#!/usr/bin/env node
/**
 * bench.js — /perf 부하 측정 엔진
 *
 * 지정한 엔드포인트에 동시 요청을 보내고 응답 시간 분포와 처리량을 잰다.
 * 결과를 기준선으로 저장해 다음 측정과 비교한다.
 *
 * 사용:
 *   node .claude/scripts/perf/bench.js --scenario=path/to/perf.json
 *   node .claude/scripts/perf/bench.js --scenario=... --save-baseline
 *   node .claude/scripts/perf/bench.js --scenario=... --compare
 *
 * 시나리오 JSON 포맷:
 *   {
 *     "name": "list-api",
 *     "baseUrl": "http://localhost:8080",
 *     "headers": { "Authorization": "Bearer ..." },
 *     "duration": 10,          // 초. 기본 10
 *     "concurrency": 10,       // 동시 요청 수. 기본 10
 *     "warmupMs": 1000,        // 준비 운동. 기본 1000
 *     "targets": [
 *       { "name": "목록 조회", "method": "GET", "path": "/api/items?page=1" },
 *       { "name": "상세 조회", "method": "GET", "path": "/api/items/1" },
 *       { "name": "생성", "method": "POST", "path": "/api/items",
 *         "body": { "title": "bench" } }
 *     ],
 *     "thresholds": { "p95Ms": 500, "errorRate": 0.01 }   // 선택
 *   }
 *
 * 종료 코드:
 *   0 정상 (임계 위반 없음)
 *   1 임계 위반 또는 기준선 대비 악화
 *   2 잘못된 인자
 *   3 서버 응답 없음
 *   4 내부 오류
 *
 * 외부 의존성 없음. Node 18+ 의 내장 fetch 를 사용한다.
 *
 * 주의: 부하 측정은 대상 서버에 실제 부하를 준다.
 * 운영 환경을 대상으로 돌리지 않는다. /perf 커맨드가 이를 확인한다.
 */

const fs = require("fs");
const path = require("path");

const PERF_DIR = path.resolve(__dirname);
const CLAUDE_DIR = path.resolve(PERF_DIR, "../..");
const STATE_DIR = path.join(CLAUDE_DIR, "state");
const BASELINE_FILE = path.join(STATE_DIR, "perf-baseline.json");
const REPORTS_DIR = path.join(PERF_DIR, "reports");

// 기준선 대비 이만큼 느려지면 악화로 본다
const REGRESSION_RATIO = 1.2;

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function summarize(samples) {
  const oks = samples.filter((s) => s.ok).map((s) => s.ms).sort((a, b) => a - b);
  const errors = samples.filter((s) => !s.ok);
  const total = samples.length;
  return {
    requests: total,
    errors: errors.length,
    errorRate: total ? Number((errors.length / total).toFixed(4)) : 0,
    minMs: oks.length ? oks[0] : null,
    p50Ms: percentile(oks, 50),
    p95Ms: percentile(oks, 95),
    p99Ms: percentile(oks, 99),
    maxMs: oks.length ? oks[oks.length - 1] : null,
    avgMs: oks.length ? Math.round(oks.reduce((a, b) => a + b, 0) / oks.length) : null,
    statusCounts: samples.reduce((acc, s) => {
      const k = s.status || "error";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {}),
  };
}

async function hit(target, scenario) {
  const url = (scenario.baseUrl || "") + (target.path || "");
  const method = (target.method || "GET").toUpperCase();
  const headers = { ...(scenario.headers || {}), ...(target.headers || {}) };
  let body;
  if (target.body !== undefined) {
    body = typeof target.body === "string" ? target.body : JSON.stringify(target.body);
    if (!Object.keys(headers).some((h) => h.toLowerCase() === "content-type")) {
      headers["Content-Type"] = "application/json";
    }
  }

  const started = Date.now();
  try {
    const resp = await fetch(url, { method, headers, body });
    await resp.arrayBuffer(); // 본문을 끝까지 받아야 실제 응답 시간이다
    return { ms: Date.now() - started, status: resp.status, ok: resp.status < 400 };
  } catch (e) {
    return { ms: Date.now() - started, status: null, ok: false, error: String(e.message || e) };
  }
}

async function runTarget(target, scenario) {
  const durationMs = (scenario.duration || 10) * 1000;
  const concurrency = scenario.concurrency || 10;
  const warmupMs = scenario.warmupMs === undefined ? 1000 : scenario.warmupMs;

  // 준비 운동 — JIT 와 연결 풀이 데워지기 전 값은 버린다
  if (warmupMs > 0) {
    const warmEnd = Date.now() + warmupMs;
    while (Date.now() < warmEnd) {
      await Promise.all(Array.from({ length: concurrency }, () => hit(target, scenario)));
    }
  }

  const samples = [];
  const endAt = Date.now() + durationMs;
  const startedAt = Date.now();

  const workers = Array.from({ length: concurrency }, async () => {
    while (Date.now() < endAt) {
      samples.push(await hit(target, scenario));
    }
  });
  await Promise.all(workers);

  const elapsedSec = (Date.now() - startedAt) / 1000;
  const summary = summarize(samples);
  summary.rps = Number((samples.length / elapsedSec).toFixed(1));
  summary.elapsedSec = Number(elapsedSec.toFixed(1));

  return { name: target.name || `${target.method || "GET"} ${target.path}`, target: target.path, ...summary };
}

function readBaseline() {
  try {
    return JSON.parse(fs.readFileSync(BASELINE_FILE, "utf-8"));
  } catch {
    return null;
  }
}

function compare(current, baseline) {
  if (!baseline || !baseline.results) return null;
  const rows = [];
  for (const cur of current.results) {
    const base = baseline.results.find((r) => r.name === cur.name);
    if (!base || !base.p95Ms || !cur.p95Ms) continue;
    const ratio = cur.p95Ms / base.p95Ms;
    rows.push({
      name: cur.name,
      basel_p95Ms: base.p95Ms,
      current_p95Ms: cur.p95Ms,
      ratio: Number(ratio.toFixed(2)),
      verdict: ratio >= REGRESSION_RATIO ? "악화" : ratio <= 1 / REGRESSION_RATIO ? "개선" : "유지",
    });
  }
  return { measuredAt: baseline.measuredAt, rows };
}

function checkThresholds(results, thresholds) {
  if (!thresholds) return [];
  const violations = [];
  for (const r of results) {
    if (thresholds.p95Ms !== undefined && r.p95Ms !== null && r.p95Ms > thresholds.p95Ms) {
      violations.push(`${r.name}: p95 ${r.p95Ms}ms (상한 ${thresholds.p95Ms}ms)`);
    }
    if (thresholds.errorRate !== undefined && r.errorRate > thresholds.errorRate) {
      violations.push(
        `${r.name}: 오류율 ${(r.errorRate * 100).toFixed(1)}% (상한 ${(thresholds.errorRate * 100).toFixed(1)}%)`
      );
    }
  }
  return violations;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.scenario) {
    console.error("사용: node bench.js --scenario <path.json> [--save-baseline] [--compare]");
    process.exit(2);
  }

  const scenarioPath = path.isAbsolute(args.scenario)
    ? args.scenario
    : path.resolve(process.cwd(), args.scenario);
  const scenario = JSON.parse(fs.readFileSync(scenarioPath, "utf-8"));

  if (!scenario.targets || !scenario.targets.length) {
    console.error("시나리오에 targets 가 없습니다.");
    process.exit(2);
  }

  // 서버 확인
  try {
    const probe = await hit(scenario.targets[0], scenario);
    if (probe.status === null) throw new Error(probe.error || "응답 없음");
  } catch (e) {
    console.log(
      JSON.stringify({ failed: true, reason: "server_unreachable", error: String(e.message || e) })
    );
    process.exit(3);
  }

  const results = [];
  for (const target of scenario.targets) {
    results.push(await runTarget(target, scenario));
  }

  const report = {
    scenario: scenario.name || path.basename(scenarioPath),
    baseUrl: scenario.baseUrl,
    measuredAt: new Date().toISOString(),
    settings: {
      duration: scenario.duration || 10,
      concurrency: scenario.concurrency || 10,
      warmupMs: scenario.warmupMs === undefined ? 1000 : scenario.warmupMs,
    },
    results,
  };

  const violations = checkThresholds(results, scenario.thresholds);
  if (violations.length) report.thresholdViolations = violations;

  if (args.compare || args["save-baseline"]) {
    const baseline = readBaseline();
    const cmp = compare(report, baseline);
    if (cmp) report.comparison = cmp;
  }

  if (args["save-baseline"]) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(report, null, 2), "utf-8");
    report.baselineSaved = true;
  }

  try {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const stamp = report.measuredAt.replace(/[:.]/g, "-");
    fs.writeFileSync(
      path.join(REPORTS_DIR, `${stamp}-${report.scenario}.json`),
      JSON.stringify(report, null, 2),
      "utf-8"
    );
  } catch {
    // 리포트 저장 실패는 측정 결과에 영향을 주지 않는다
  }

  console.log(JSON.stringify(report, null, 2));

  const regressed = report.comparison && report.comparison.rows.some((r) => r.verdict === "악화");
  process.exit(violations.length || regressed ? 1 : 0);
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
