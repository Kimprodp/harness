#!/usr/bin/env node
/**
 * api-runner.js — /qa API 모드 실행 엔진
 *
 * 브라우저 없이 HTTP 요청만으로 백엔드 동작을 검증한다.
 * Playwright 를 쓰지 않으므로 화면이 없는 프로젝트에서도 동작한다.
 *
 * 사용:
 *   node .claude/scripts/qa/api-runner.js --scenario=path/to/scenario.json
 *
 * 시나리오 JSON 포맷:
 *   {
 *     "name": "auth-flow",
 *     "type": "api",
 *     "baseUrl": "http://localhost:8080",
 *     "headers": { "Content-Type": "application/json" },   // 전 요청 공통 (선택)
 *     "vars": { "email": "test@example.com" },             // 초기 변수 (선택)
 *     "steps": [
 *       {
 *         "action": "request",
 *         "name": "로그인",
 *         "method": "POST",
 *         "path": "/api/login",
 *         "body": { "email": "{{email}}", "password": "pw1234" },
 *         "expect": { "status": 200, "jsonHas": ["token"] },
 *         "capture": { "token": "$.token" }
 *       },
 *       {
 *         "action": "request",
 *         "method": "GET",
 *         "path": "/api/me",
 *         "headers": { "Authorization": "Bearer {{token}}" },
 *         "expect": { "status": 200, "jsonEquals": { "email": "{{email}}" } }
 *       },
 *       { "action": "wait", "ms": 500 }
 *     ]
 *   }
 *
 * expect 에 쓸 수 있는 것:
 *   status      숫자 또는 배열. 응답 코드
 *   statusLt    이 값보다 작아야 함 (예: 400)
 *   contains    본문 문자열에 포함
 *   notContains 본문 문자열에 미포함
 *   jsonHas     JSON 응답에 존재해야 하는 경로 목록 (["token", "user.id"])
 *   jsonEquals  경로별 기대값 ({"user.email": "a@b.c"})
 *   maxMs       응답 시간 상한
 *
 * capture: { 변수명: "$.경로" } — 다음 스텝에서 {{변수명}} 으로 사용
 *
 * 종료 코드:
 *   0 전체 통과 / 1 스텝 실패 / 2 잘못된 인자 / 3 서버 응답 없음 / 4 내부 오류
 *
 * 외부 의존성 없음. Node 18+ 의 내장 fetch 를 사용한다.
 */

const fs = require("fs");
const path = require("path");

const QA_DIR = path.resolve(__dirname);
const REPORTS_DIR = path.join(QA_DIR, "reports");
const BODY_LIMIT = 2000;

// ─────────────────────────────────────────────
// 변수 치환
// ─────────────────────────────────────────────
function substitute(value, vars) {
  if (typeof value === "string") {
    return value.replace(/\{\{(\w+)\}\}/g, (m, key) =>
      Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : m
    );
  }
  if (Array.isArray(value)) return value.map((v) => substitute(v, vars));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = substitute(v, vars);
    return out;
  }
  return value;
}

// ─────────────────────────────────────────────
// JSON 경로 조회 — "user.id" 또는 "$.user.id", 배열 인덱스 "items.0.name"
// ─────────────────────────────────────────────
function readPath(obj, expr) {
  const clean = String(expr).replace(/^\$\.?/, "");
  if (!clean) return obj;
  let cur = obj;
  for (const seg of clean.split(".")) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[seg];
  }
  return cur;
}

// ─────────────────────────────────────────────
// 검증
// ─────────────────────────────────────────────
function verify(expect, res) {
  const fails = [];
  if (!expect) return fails;

  if (expect.status !== undefined) {
    const allowed = Array.isArray(expect.status) ? expect.status : [expect.status];
    if (!allowed.includes(res.status)) {
      fails.push(`status ${res.status} (기대 ${allowed.join(" 또는 ")})`);
    }
  }

  if (expect.statusLt !== undefined && !(res.status < expect.statusLt)) {
    fails.push(`status ${res.status} (기대 < ${expect.statusLt})`);
  }

  if (expect.contains !== undefined && !res.text.includes(expect.contains)) {
    fails.push(`본문에 "${expect.contains}" 없음`);
  }

  if (expect.notContains !== undefined && res.text.includes(expect.notContains)) {
    fails.push(`본문에 "${expect.notContains}" 있음 (없어야 함)`);
  }

  if (expect.jsonHas) {
    if (res.json === undefined) {
      fails.push("JSON 응답이 아님 (jsonHas 검증 불가)");
    } else {
      for (const p of expect.jsonHas) {
        if (readPath(res.json, p) === undefined) fails.push(`JSON 경로 "${p}" 없음`);
      }
    }
  }

  if (expect.jsonEquals) {
    if (res.json === undefined) {
      fails.push("JSON 응답이 아님 (jsonEquals 검증 불가)");
    } else {
      for (const [p, want] of Object.entries(expect.jsonEquals)) {
        const got = readPath(res.json, p);
        if (JSON.stringify(got) !== JSON.stringify(want)) {
          fails.push(`JSON "${p}" = ${JSON.stringify(got)} (기대 ${JSON.stringify(want)})`);
        }
      }
    }
  }

  if (expect.maxMs !== undefined && res.ms > expect.maxMs) {
    fails.push(`응답 ${res.ms}ms (상한 ${expect.maxMs}ms)`);
  }

  return fails;
}

// ─────────────────────────────────────────────
// 요청 실행
// ─────────────────────────────────────────────
async function doRequest(step, scenario, vars) {
  const method = (step.method || "GET").toUpperCase();
  const raw = step.url || (scenario.baseUrl || "") + (step.path || "");
  const url = substitute(raw, vars);

  const headers = substitute(
    { ...(scenario.headers || {}), ...(step.headers || {}) },
    vars
  );

  let body;
  if (step.body !== undefined) {
    const sub = substitute(step.body, vars);
    if (typeof sub === "string") {
      body = sub;
    } else {
      body = JSON.stringify(sub);
      if (!Object.keys(headers).some((h) => h.toLowerCase() === "content-type")) {
        headers["Content-Type"] = "application/json";
      }
    }
  }

  const timeout = step.timeout || 10000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const started = Date.now();
  try {
    const resp = await fetch(url, { method, headers, body, signal: controller.signal });
    const text = await resp.text();
    const ms = Date.now() - started;

    let json;
    const ct = resp.headers.get("content-type") || "";
    if (ct.includes("json")) {
      try {
        json = JSON.parse(text);
      } catch {
        json = undefined;
      }
    }

    return {
      url,
      method,
      status: resp.status,
      ms,
      text,
      json,
      headers: Object.fromEntries(resp.headers.entries()),
    };
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.scenario) {
    console.error("사용: node api-runner.js --scenario <path.json>");
    process.exit(2);
  }

  const scenarioPath = path.isAbsolute(args.scenario)
    ? args.scenario
    : path.resolve(process.cwd(), args.scenario);
  const scenario = JSON.parse(fs.readFileSync(scenarioPath, "utf-8"));

  // 서버 응답 확인
  if (scenario.baseUrl) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 5000);
      await fetch(scenario.baseUrl, { method: "HEAD", signal: controller.signal }).catch(
        async () => {
          await fetch(scenario.baseUrl, { method: "GET", signal: controller.signal });
        }
      );
      clearTimeout(t);
    } catch (e) {
      console.log(
        JSON.stringify({
          failed: true,
          reason: "server_unreachable",
          url: scenario.baseUrl,
          error: String(e.message || e),
        })
      );
      process.exit(3);
    }
  }

  const vars = { ...(scenario.vars || {}) };
  const results = [];
  let failedIndex = -1;

  for (let i = 0; i < scenario.steps.length; i++) {
    const step = scenario.steps[i];
    const label = step.name || `${step.action}${step.path ? " " + step.path : ""}`;

    try {
      if (step.action === "wait") {
        await new Promise((r) => setTimeout(r, step.ms || 100));
        results.push({ index: i + 1, action: "wait", label, ok: true });
        continue;
      }

      if (step.action !== "request") {
        results.push({
          index: i + 1,
          action: step.action,
          label,
          ok: false,
          error: `알 수 없는 action: ${step.action}`,
        });
        failedIndex = i;
        break;
      }

      const res = await doRequest(step, scenario, vars);
      // 기대값에도 변수를 치환한다. {{token}} 같은 값이 그대로 비교되면 안 된다
      const fails = verify(substitute(step.expect, vars), res);

      if (step.capture && fails.length === 0) {
        for (const [name, expr] of Object.entries(step.capture)) {
          const got = res.json !== undefined ? readPath(res.json, expr) : undefined;
          if (got === undefined) {
            fails.push(`capture "${name}" — 경로 "${expr}" 에서 값을 찾지 못함`);
          } else {
            vars[name] = got;
          }
        }
      }

      results.push({
        index: i + 1,
        action: "request",
        label,
        method: res.method,
        url: res.url,
        status: res.status,
        ms: res.ms,
        ok: fails.length === 0,
        failures: fails.length ? fails : undefined,
        bodyPreview:
          res.text.length > BODY_LIMIT ? res.text.slice(0, BODY_LIMIT) + "…(생략)" : res.text,
      });

      if (fails.length) {
        failedIndex = i;
        break;
      }
    } catch (e) {
      results.push({
        index: i + 1,
        action: step.action,
        label,
        ok: false,
        error: String(e.message || e),
      });
      failedIndex = i;
      break;
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const timings = results.filter((r) => typeof r.ms === "number").map((r) => r.ms);

  const report = {
    scenario: scenario.name || path.basename(scenarioPath),
    type: "api",
    baseUrl: scenario.baseUrl,
    timestamp: new Date().toISOString(),
    total: scenario.steps.length,
    passed,
    failed: failedIndex >= 0 ? 1 : 0,
    skipped: failedIndex >= 0 ? scenario.steps.length - results.length : 0,
    slowestMs: timings.length ? Math.max(...timings) : null,
    steps: results,
  };

  try {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.writeFileSync(
      path.join(REPORTS_DIR, `${stamp}-${report.scenario}-api.json`),
      JSON.stringify(report, null, 2),
      "utf-8"
    );
  } catch {
    // 리포트 저장 실패는 검증 결과에 영향을 주지 않는다
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(failedIndex >= 0 ? 1 : 0);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      out[k] = v !== undefined ? v : argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    }
  }
  return out;
}

main().catch((e) => {
  console.error(String(e && e.stack ? e.stack : e));
  process.exit(4);
});
