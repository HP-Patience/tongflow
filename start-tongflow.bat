@echo off
setlocal
cd /d "%~dp0"
title TongFlow

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js was not found in PATH.
    goto :failed
)
where pnpm.cmd >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pnpm was not found in PATH.
    goto :failed
)
set "PYTHON=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
set "PYTHONUTF8=1"
"%PYTHON%" --version
if errorlevel 1 (
    echo [ERROR] Python 3.12 was not found or could not run.
    goto :failed
)
if not exist "node_modules\next\package.json" (
    echo [ERROR] Dependencies are missing. Run pnpm install first.
    goto :failed
)
if /i "%~1"=="--check" (
    echo Startup checks passed.
    exit /b 0
)

echo Starting TongFlow at http://localhost:3000
echo Keep this window open while using TongFlow. Press Ctrl+C to stop.
call pnpm.cmd dev --port 3000
if errorlevel 1 goto :failed
exit /b 0

:failed
echo Startup failed. Check the error above. Port 3000 may already be in use.
if /i not "%~1"=="--check" pause
exit /b 1
