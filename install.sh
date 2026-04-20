#!/usr/bin/env bash
# install.sh — 하니스를 새 프로젝트에 설치
#
# 사용법 (사용자가 하니스 로컬 clone 한 상태 전제):
#   cd <target-project>
#   bash <harness-path>/install.sh [--force] [--skip-playwright]
#
# 동작:
#   1. 대상 디렉토리 결정 (현재 pwd)
#   2. 기존 .claude/ 있으면 백업 제안
#   3. 하니스 .claude/ 복사
#   4. .gitignore 필수 엔트리 자동 추가
#   5. Node.js 확인 + .claude 내 npm install
#   6. Playwright 브라우저 바이너리 설치 (선택)
#   7. 완료 안내

set -euo pipefail

# ─────────────────────────────────────────────
# 설정
# ─────────────────────────────────────────────
HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$(pwd)"
FORCE=0
SKIP_PLAYWRIGHT=0

for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    --skip-playwright) SKIP_PLAYWRIGHT=1 ;;
    --help|-h)
      echo "사용법: bash install.sh [--force] [--skip-playwright]"
      exit 0
      ;;
    *)
      echo "알 수 없는 옵션: $arg"
      exit 2
      ;;
  esac
done

# ─────────────────────────────────────────────
# Safety: 하니스 자체에 재설치 방지
# ─────────────────────────────────────────────
if [ "$HARNESS_DIR" = "$TARGET_DIR" ]; then
  echo "❌ 하니스 프로젝트 자체에서 실행하지 마세요."
  echo "   새 프로젝트 루트로 이동해서 실행하세요."
  exit 1
fi

echo "🎯 하니스 설치"
echo "  source: $HARNESS_DIR"
echo "  target: $TARGET_DIR"
echo ""

# ─────────────────────────────────────────────
# 기존 .claude/ 처리
# ─────────────────────────────────────────────
if [ -d "$TARGET_DIR/.claude" ]; then
  if [ "$FORCE" -eq 1 ]; then
    BACKUP_DIR="$TARGET_DIR/.claude.backup-$(date +%Y%m%d-%H%M%S)"
    echo "ℹ️  기존 .claude/ 를 $BACKUP_DIR 로 백업 (--force 지정)"
    mv "$TARGET_DIR/.claude" "$BACKUP_DIR"
  else
    echo "⚠️  기존 .claude/ 폴더가 있습니다."
    read -rp "백업 후 덮어쓸까요? (y/N) " yn
    case "$yn" in
      [Yy]*)
        BACKUP_DIR="$TARGET_DIR/.claude.backup-$(date +%Y%m%d-%H%M%S)"
        mv "$TARGET_DIR/.claude" "$BACKUP_DIR"
        echo "   백업: $BACKUP_DIR"
        ;;
      *)
        echo "중단."
        exit 0
        ;;
    esac
  fi
fi

# ─────────────────────────────────────────────
# .claude/ 복사
# ─────────────────────────────────────────────
echo "📁 .claude/ 복사 중..."
cp -r "$HARNESS_DIR/.claude" "$TARGET_DIR/.claude"
# 하니스 고유 로컬 파일 제거
rm -rf "$TARGET_DIR/.claude/node_modules"
rm -rf "$TARGET_DIR/.claude/state"
mkdir -p "$TARGET_DIR/.claude/state"
touch "$TARGET_DIR/.claude/state/.gitkeep"

# ─────────────────────────────────────────────
# .gitignore 업데이트
# ─────────────────────────────────────────────
GITIGNORE="$TARGET_DIR/.gitignore"
HARNESS_ENTRIES="# Claude 하니스 런타임
.claude/node_modules/
.claude/state/*
!.claude/state/.gitkeep
.claude/scripts/*/reports/
.claude/scripts/*/snapshots/
.claude/scripts/*/mockups/
.claude/settings.local.json"

if [ ! -f "$GITIGNORE" ]; then
  echo "📝 .gitignore 생성"
  echo "$HARNESS_ENTRIES" > "$GITIGNORE"
elif ! grep -q "Claude 하니스 런타임" "$GITIGNORE"; then
  echo "📝 .gitignore 에 하니스 엔트리 추가"
  printf "\n%s\n" "$HARNESS_ENTRIES" >> "$GITIGNORE"
else
  echo "✓ .gitignore 이미 하니스 엔트리 포함"
fi

# ─────────────────────────────────────────────
# Node.js 확인
# ─────────────────────────────────────────────
if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "⚠️  Node.js 가 설치되지 않았습니다."
  echo "   하니스의 일부 기능 (/qa, /design-review) 은 Node + Playwright 를 사용합니다."
  echo "   Node 18+ 설치 후 다음 수행:"
  echo "     cd .claude && npm install && npx playwright install chromium"
  echo ""
  echo "기본 커맨드 (/kickoff, /feature-*, /task, /code-review 등) 는 Node 없이도 동작합니다."
  exit 0
fi

NODE_VERSION="$(node --version)"
echo "✓ Node.js $NODE_VERSION"

# ─────────────────────────────────────────────
# npm install (.claude/)
# ─────────────────────────────────────────────
echo "📦 .claude/ 안에서 npm install..."
(cd "$TARGET_DIR/.claude" && npm install --silent)

# ─────────────────────────────────────────────
# Playwright 브라우저 (선택)
# ─────────────────────────────────────────────
if [ "$SKIP_PLAYWRIGHT" -eq 1 ]; then
  echo "ℹ️  Playwright 브라우저 설치 건너뜀 (--skip-playwright)"
  echo "   나중에 필요하면: cd .claude && npx playwright install chromium"
else
  echo ""
  read -rp "Playwright 브라우저 (Chromium, ~320MB) 도 지금 설치할까요? (y/N) " yn
  case "$yn" in
    [Yy]*)
      echo "🌐 Playwright Chromium 다운로드..."
      (cd "$TARGET_DIR/.claude" && npx playwright install chromium)
      ;;
    *)
      echo "ℹ️  건너뜀. 첫 /qa 또는 /design-review 실행 시 자동 설치됩니다."
      ;;
  esac
fi

# ─────────────────────────────────────────────
# 완료
# ─────────────────────────────────────────────
echo ""
echo "✅ 하니스 설치 완료!"
echo ""
echo "다음 단계:"
echo "  1. claude-code 실행"
echo "  2. 새 프로젝트면:  /kickoff"
echo "     기존 프로젝트면: /project-status (상태 파악) 또는 /feature-start <기능명>"
echo ""
echo "주요 커맨드:"
echo "  /kickoff, /feature-start, /feature-plan, /task"
echo "  /code-review, /investigate, /qa, /design-review"
echo "  /security-audit, /ship, /update-docs, /project-status"
