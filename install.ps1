# install.ps1 — 하니스를 새 프로젝트에 설치 (PowerShell)
#
# 사용법:
#   cd <target-project>
#   powershell -ExecutionPolicy Bypass -File <harness-path>\install.ps1 [-Force] [-SkipPlaywright]

param(
    [switch]$Force,
    [switch]$SkipPlaywright,
    [switch]$Help
)

if ($Help) {
    Write-Host "사용법: powershell -File install.ps1 [-Force] [-SkipPlaywright]"
    exit 0
}

$ErrorActionPreference = "Stop"

$HarnessDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TargetDir = Get-Location | Select-Object -ExpandProperty Path

if ($HarnessDir -eq $TargetDir) {
    Write-Host "❌ 하니스 프로젝트 자체에서 실행하지 마세요." -ForegroundColor Red
    exit 1
}

Write-Host "🎯 하니스 설치"
Write-Host "  source: $HarnessDir"
Write-Host "  target: $TargetDir"
Write-Host ""

# 기존 .claude/ 처리
$ClaudeDir = Join-Path $TargetDir ".claude"
if (Test-Path $ClaudeDir) {
    if ($Force) {
        $BackupDir = Join-Path $TargetDir (".claude.backup-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
        Write-Host "ℹ️  기존 .claude/ 를 백업 (-Force)"
        Move-Item $ClaudeDir $BackupDir
    } else {
        Write-Host "⚠️  기존 .claude/ 폴더가 있습니다." -ForegroundColor Yellow
        $yn = Read-Host "백업 후 덮어쓸까요? (y/N)"
        if ($yn -match "^[Yy]") {
            $BackupDir = Join-Path $TargetDir (".claude.backup-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
            Move-Item $ClaudeDir $BackupDir
            Write-Host "   백업: $BackupDir"
        } else {
            Write-Host "중단."
            exit 0
        }
    }
}

# .claude/ 복사
Write-Host "📁 .claude/ 복사 중..."
Copy-Item -Recurse (Join-Path $HarnessDir ".claude") $ClaudeDir
$NodeModules = Join-Path $ClaudeDir "node_modules"
if (Test-Path $NodeModules) { Remove-Item -Recurse -Force $NodeModules }
$StateDir = Join-Path $ClaudeDir "state"
if (Test-Path $StateDir) { Remove-Item -Recurse -Force $StateDir }
New-Item -ItemType Directory -Force -Path $StateDir | Out-Null
New-Item -ItemType File -Force -Path (Join-Path $StateDir ".gitkeep") | Out-Null

# .gitignore 업데이트
$GitIgnore = Join-Path $TargetDir ".gitignore"
$HarnessEntries = @"

# Claude 하니스 런타임
.claude/node_modules/
.claude/state/*
!.claude/state/.gitkeep
.claude/scripts/*/reports/
.claude/scripts/*/snapshots/
.claude/scripts/*/mockups/
.claude/settings.local.json
"@

if (-not (Test-Path $GitIgnore)) {
    Write-Host "📝 .gitignore 생성"
    Set-Content -Path $GitIgnore -Value $HarnessEntries.TrimStart()
} elseif (-not (Select-String -Path $GitIgnore -Pattern "Claude 하니스 런타임" -Quiet)) {
    Write-Host "📝 .gitignore 에 하니스 엔트리 추가"
    Add-Content -Path $GitIgnore -Value $HarnessEntries
} else {
    Write-Host "✓ .gitignore 이미 하니스 엔트리 포함"
}

# Node.js 확인
$NodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $NodeCmd) {
    Write-Host ""
    Write-Host "⚠️  Node.js 가 설치되지 않았습니다." -ForegroundColor Yellow
    Write-Host "   Node 18+ 설치 후: cd .claude; npm install; npx playwright install chromium"
    Write-Host ""
    Write-Host "기본 커맨드는 Node 없이도 동작합니다."
    exit 0
}

$NodeVersion = & node --version
Write-Host "✓ Node.js $NodeVersion"

# npm install
Write-Host "📦 .claude/ 안에서 npm install..."
Push-Location $ClaudeDir
try {
    & npm install --silent
} finally {
    Pop-Location
}

# Playwright browser
if ($SkipPlaywright) {
    Write-Host "ℹ️  Playwright 브라우저 설치 건너뜀 (-SkipPlaywright)"
} else {
    Write-Host ""
    $yn = Read-Host "Playwright 브라우저 (Chromium, ~320MB) 도 지금 설치할까요? (y/N)"
    if ($yn -match "^[Yy]") {
        Write-Host "🌐 Playwright Chromium 다운로드..."
        Push-Location $ClaudeDir
        try {
            & npx playwright install chromium
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "ℹ️  건너뜀. 첫 /qa 또는 /design-review 실행 시 자동 설치됩니다."
    }
}

Write-Host ""
Write-Host "✅ 하니스 설치 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계:"
Write-Host "  1. claude-code 실행"
Write-Host "  2. 새 프로젝트면:  /kickoff"
Write-Host "     기존 프로젝트면: /project-status 또는 /feature-start <기능명>"
