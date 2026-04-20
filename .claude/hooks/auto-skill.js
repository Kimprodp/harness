#!/usr/bin/env node
/**
 * auto-skill.js — UserPromptSubmit Hook
 *
 * 사용자 프롬프트 제출 직후 실행. 2가지 일을 수행:
 *   1. skill-rules.json 의 키워드 매칭 → 관련 커맨드/에이전트 힌트를 AI 컨텍스트에 주입
 *   2. 보안 감사 주기 초과 여부 체크 → 경고 힌트 주입
 *
 * 출력 규약 (Claude Code):
 *   - stdout 텍스트 → AI 컨텍스트에 system 힌트로 삽입
 *   - exit 0 → 성공. 메시지 그대로 전달
 *   - 실패해도 조용히 exit 0 (Hook 이 사용자 플로우 방해 금지)
 *
 * 설계 원칙:
 *   - 힌트는 권고일 뿐. AI 가 필요 시 사용자에게 전달.
 *   - 한 메시지당 최대 3개 힌트 (과다 주입 방지).
 *   - 외부 의존성 無. Node 내장만 사용.
 */

const fs = require("fs");
const path = require("path");

const CLAUDE_DIR = path.resolve(__dirname, "..");
const RULES_FILE = path.join(CLAUDE_DIR, "skill-rules.json");
const SECURITY_STATE_FILE = path.join(
  CLAUDE_DIR,
  "state",
  "security-audit.json"
);
const CLEANUP_STATE_FILE = path.join(CLAUDE_DIR, "state", "cleanup.json");
const SETTINGS_FILE = path.join(CLAUDE_DIR, "settings.json");

const MAX_HINTS = 3;
const DEFAULT_SECURITY_INTERVAL_DAYS = 30;
const DEFAULT_CLEANUP_INTERVAL_DAYS = 45;
const DEFAULT_SENSITIVE_KEYWORDS = [
  "인증", "로그인", "토큰", "세션", "비밀번호", "password",
  "결제", "카드", "환불", "PG", "payment",
  "API 키", "시크릿", "secret", "OAuth",
  "권한", "admin", "관리자",
];

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return fallback;
  }
}

function getPayload() {
  try {
    const raw = fs.readFileSync(0, "utf-8");
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

function getReminderSettings() {
  const s = readJson(SETTINGS_FILE, {});
  const r = s.reminders || {};
  return {
    securityInterval: r.security_audit_interval_days || DEFAULT_SECURITY_INTERVAL_DAYS,
    cleanupInterval: r.cleanup_interval_days || DEFAULT_CLEANUP_INTERVAL_DAYS,
    keywords: r.security_sensitive_keywords || DEFAULT_SENSITIVE_KEYWORDS,
  };
}

function matchRules(userText, rules) {
  const hints = [];
  const lower = userText.toLowerCase();
  for (const rule of rules.rules || []) {
    if (!Array.isArray(rule.keywords)) continue;
    const matched = rule.keywords.some((kw) =>
      lower.includes(String(kw).toLowerCase())
    );
    if (matched && rule.hint) {
      hints.push(rule.hint);
      if (hints.length >= MAX_HINTS) break;
    }
  }
  return hints;
}

function checkSecurityAuditInterval(userText, settings) {
  const state = readJson(SECURITY_STATE_FILE, null);
  if (!state || !state.last_audit || !state.last_audit.date) return null;

  const lastDate = new Date(state.last_audit.date);
  const daysSince = Math.floor(
    (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const interval = settings.securityInterval;

  // 메시지에 민감 키워드 있으면 주기 반 경과만 돼도 알림 (조기 경고)
  const lower = userText.toLowerCase();
  const sensitiveInMessage = settings.keywords.some((kw) =>
    lower.includes(String(kw).toLowerCase())
  );

  if (daysSince > interval) {
    const base = `[보안 감사 주기 초과] 마지막 감사 ${daysSince}일 전 (기준 ${interval}일).`;
    const extra = sensitiveInMessage
      ? " 이번 작업이 민감 영역과 관련 — `/security-audit` 강력 권장."
      : " `/security-audit` 실행 권장.";
    return base + extra;
  }

  if (sensitiveInMessage && daysSince > interval / 2) {
    return `[민감 영역 작업] 마지막 보안 감사 ${daysSince}일 전 (주기 ${interval}일 중반). 작업 후 \`/security-audit\` 권장.`;
  }

  return null;
}

function checkCleanupInterval(settings) {
  const state = readJson(CLEANUP_STATE_FILE, null);
  if (!state || !state.last_cleanup || !state.last_cleanup.date) return null;

  const lastDate = new Date(state.last_cleanup.date);
  const daysSince = Math.floor(
    (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const interval = settings.cleanupInterval;

  if (daysSince > interval * 2) {
    return `[cleanup 주기 2배 초과] 마지막 정리 ${daysSince}일 전 (기준 ${interval}일). \`/cleanup\` 강력 권장.`;
  }
  if (daysSince > interval) {
    return `[cleanup 주기 초과] 마지막 정리 ${daysSince}일 전 (기준 ${interval}일). \`/cleanup\` 권장.`;
  }
  return null;
}

function main() {
  const payload = getPayload();
  const userText = payload.prompt || "";
  if (!userText.trim()) {
    process.exit(0);
  }

  const rules = readJson(RULES_FILE, { rules: [] });
  const settings = getReminderSettings();

  const hints = matchRules(userText, rules);

  const securityHint = checkSecurityAuditInterval(userText, settings);
  if (securityHint && hints.length < MAX_HINTS) {
    hints.push(securityHint);
  }

  const cleanupHint = checkCleanupInterval(settings);
  if (cleanupHint && hints.length < MAX_HINTS) {
    hints.push(cleanupHint);
  }

  if (hints.length === 0) {
    process.exit(0);
  }

  // stdout 으로 출력 → Claude Code 가 AI 컨텍스트에 system 메시지로 삽입
  console.log(
    `[auto-skill hints — 참고용, 사용자에게 노출 선택]\n${hints
      .map((h) => `- ${h}`)
      .join("\n")}`
  );
  process.exit(0);
}

main();
