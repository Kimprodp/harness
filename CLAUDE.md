# Harness — AI 작업 가이드

> 이 파일은 Claude Code가 **세션 시작 시 자동 로드**한다.
> 대화 압축 이후에도 이 파일이 맥락을 복구한다.
> 작업 진행 시 반드시 이 문서와 `docs/progress.md` 를 먼저 읽고 현재 상태를 파악한다.

---

## 🎯 프로젝트 정체

- **이름**: harness (개인용 범용 Claude Code 하니스)
- **소유자**: Kim Gyutae
- **경로**: `C:\Users\Kimgyutae\harness`
- **GitHub**: Private 레포
- **라이선스**: MIT
- **용도**: 새 프로젝트마다 `.claude/` 폴더를 복사해서 사용 (Phase 1에선 단순 복사 방식)

---

## 📚 배경 / 레퍼런스

### 동기 (본 영상들)

1. **"개발자가 AI 길들이는 데 6개월 걸린 이유"** — u/JokeGold5455 원문
   - 자동 매뉴얼 (Hook) + 작업 기억 (3문서) + 자동 품질 검사 + 전문 에이전트
2. **"skills.sh 하나면 AI 코딩 레벨이 달라집니다"** — Vercel 스킬 마켓
3. **"폴더 하나로 AI를 우리 팀 전문가로 만드는 법"** — Anthropic Skills 개념
4. **"하니스 완전 공개"** — 스킬+에이전트+커맨드 3층 구조
5. **"클로드로 개인 AI 비서 만드는 법"** — Karpathy LLM 위키 (생활 자동화)
6. **"YC 대표 60일 60만줄"** — Garry Tan gstack (오피스아워/디자인리뷰 등)

### 코드 레퍼런스

- **[gstack](https://github.com/garrytan/gstack)** (MIT)
  - `office-hours` → `idea-validation` 포팅
  - `plan-ceo-review` → `scope-review` (4 모드 차용)
  - `plan-eng-review` → `tech-stack-decision` (축약) + `tech-spec` (전체)
- **[diet103/claude-code-infrastructure-showcase](https://github.com/diet103/claude-code-infrastructure-showcase)** (MIT, u/JokeGold5455 공개)
  - 3-Document Dev Docs System (plan/context/tasks) 구조 차용
  - Hook 자동 활성화 시스템 (Phase 2 도입 예정)

---

## 🏗 아키텍처 (6-Layer)

```
┌───────────────────────────────────────────────┐
│  L6. 부트스트랩   → /kickoff, /feature-start   │
│                    /feature-plan, /task,       │
│                    /code-review, /update-docs, │
│                    /project-status             │
├───────────────────────────────────────────────┤
│  L5. 문서 템플릿  → plan/context/tasks + PRD/  │
│                    tech-spec + CLAUDE.md       │
├───────────────────────────────────────────────┤
│  L4. Hook        → (Phase 2)                   │
├───────────────────────────────────────────────┤
│  L3. 커맨드      → 사용자 진입점 (위 7개)      │
├───────────────────────────────────────────────┤
│  L2. 에이전트    → plan-reviewer, reviewer,    │
│                    security (배치 실행)         │
├───────────────────────────────────────────────┤
│  L1. 스킬        → idea-validation,            │
│                    product-spec, scope-review, │
│                    tech-stack-decision,        │
│                    tech-spec                    │
└───────────────────────────────────────────────┘
```

### 폴더 구조

```
harness/
├── .claude/
│   ├── agents/            # 3개 서브에이전트 (배치 실행)
│   ├── skills/            # 5개 스킬 (AI 참조 매뉴얼)
│   ├── commands/          # 7개 슬래시 커맨드 (사용자 진입점)
│   └── templates/         # 6개 템플릿 (3문서 + CLAUDE.md + PRD + tech-spec)
├── .gitignore
├── LICENSE
├── CLAUDE.md              # ← 이 파일
├── README.md              # (Step 7 예정, 현재는 초기 상태)
└── docs/
    └── progress.md        # Step별 상세 진행 로그
```

---

## 📊 현재 상태 (Phase 3 구현 완료)

**상세 진행 이력은 [docs/progress.md](docs/progress.md) 참조**

### 완료 (2026-04-20 기준)

- **에이전트 3개**: `@plan-reviewer`, `@reviewer`, `@security`
- **스킬 6개**: `idea-validation`, `product-spec`, `scope-review`, `tech-stack-decision`, `tech-spec`, `design-slop-patterns`
- **커맨드 12개**: `/kickoff`, `/feature-start`, `/feature-plan`, `/task`, `/code-review`, `/project-status`, `/update-docs`, `/investigate`, `/qa`, `/design-review`, `/security-audit`, `/ship`
- **Hook**: `freshness.js` (Stop, 문서 Last Updated 자동 갱신) + `auto-skill.js` (UserPromptSubmit, 힌트 주입 + 보안 주기 체크) + `post-edit.example.js` (사용자 커스텀 슬롯)
- **스크립트**: `_shared` 3종 (ensure-playwright/check-dev-server/version-check) + `qa/runner.js` + `design-review` 3종 + `ship` 2종
- **템플릿 6개**: 하이브리드 구조
- **설치**: `install.sh`, `install.ps1` (cross-platform)

### 남은 작업 (백로그)

- [ ] `README.md` (GitHub용 간결)
- [ ] `docs/story.md` (포트폴리오용 상세)
- [ ] 실전 하니스 설치 + Dry Run 검증

### Phase 4 (먼 미래)

- 생활 자동화 (Gmail, Calendar — Karpathy 방식)
- Mac Mini + Telegram Bot
- README / story.md 완성 + 공개

---

## 🎛 주요 설계 결정 (요약)

> 상세 결정 로그는 `docs/progress.md` 결정 섹션 참조

### 문서 구조 (하이브리드)
- **프로덕트 레벨**: `docs/plan.md`, `context.md`, `tasks.md` (1세트)
- **기능 레벨**: `docs/features/<name>/prd.md`, `tech-spec.md` (2파일)
- 원문은 기능마다 3문서 세트였지만 **파일 수 과다**로 하이브리드 채택

### ADR 태그 시스템
- 모든 ADR은 `docs/context.md` 한 곳에 통합
- 기능별 결정도 `[feature: <X>]` 태그로 분류
- 분산 우려 해결

### 커맨드 vs 에이전트 역할
- **커맨드**: 사용자 진입점 (슬래시)
- **에이전트**: 격리된 배치 실행 (사용자 대화 불가)
- 인터랙티브 인터뷰는 **메인 AI가 직접 수행** (에이전트 X)

### `/task` 단위 = 1 todo
- `/task` 1회 호출 = tasks.md의 todo 1개 작업
- 기능 완성은 여러 /task 반복 호출로

### 기능 단위 아카이브
- 개별 todo 완료 시: 원래 위치에 `[x]` (이동 X)
- 기능 하위 모든 todo 완료 시: AI 감지 → "완료된 기능" 섹션으로 **통째 이동**

### 연속성 자동 호출
- `/feature-start` → `/feature-plan` → `/task` → `/code-review` → `/update-docs`
- 각 단계 완료 시 "이어서 할까요?" 프롬프트
- "네" 응답 시 **AI가 다음 커맨드 파일을 Read 해서 이어서 수행**

### 템플릿 위치
- `.claude/templates/` (원래 루트 `templates/`였으나 설치 시 누락 방지 위해 이동)

### 말투 규칙
- 안티패턴 금지: "delve", "crucial", "robust", "흥미롭네요", "여러 방법이 있죠" 등
- 직설적 빌더 톤

### 에이전트 이름
- `@plan-reviewer`, `@reviewer`, `@security`
- 사용자는 직접 호출하지 않음 (커맨드 내부에서 자동). 필요 시 자연어 요청 가능.

---

## 🔧 작업 규칙

### 변경 시
1. **모든 구조 변경 / 주요 결정**은 이 `CLAUDE.md` 와 `docs/progress.md` 에 반영
2. 파일 추가/이동/삭제 시 `docs/progress.md` "파일 변경 이력" 갱신
3. 큰 설계 변경은 `docs/progress.md` "결정 로그" 에 태그와 함께 기록

### 커밋 단위
- 기능 단위 / Step 단위로 나눔
- 커밋 메시지는 간결하게 (Co-Authored-By 제외)
- Private 레포이므로 자유롭게 (나중에 공개 시 정리)

### 토론 문화
- 구조적 결정은 사용자와 먼저 상의
- 단순 버그 수정은 즉시 반영 OK

---

## 📖 다음 단계

**즉시**: Phase 1 남은 작업 (README, story.md) — 완성 후에 일괄 작성
**다음 세션에서**: `docs/progress.md` 읽고 현재 상태 재파악 → 사용자 요청 확인
**Phase 2 진입 시**: Hook 시스템부터 우선 구축

---

## 🔗 관련 링크

- 진행 로그: [docs/progress.md](docs/progress.md)
- 사용자 프로젝트용 CLAUDE.md 템플릿: [.claude/templates/CLAUDE.md.template](.claude/templates/CLAUDE.md.template)
