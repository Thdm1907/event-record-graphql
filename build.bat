@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Building EventRecording Solution
echo ===================================================
echo.

:: Ensure Node.js PATH if installed in standard location
set "PATH=C:\Program Files\nodejs;%PATH%"

echo [1/5] Installing/verifying workspace dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm install failed!
    exit /b %ERRORLEVEL%
)

echo.
echo [2/5] Generating Prisma Client...
call npm run prisma:generate
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Prisma Client generation failed!
    exit /b %ERRORLEVEL%
)

echo.
echo [3/5] Building GraphQL Ingestion Server (src/)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Server build failed!
    exit /b %ERRORLEVEL%
)

echo.
echo [4/5] Building Preseed ^& Generator tools (preseed/ ^& generator/)...
call npx tsc -p preseed/tsconfig.json
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Preseed build failed!
    exit /b %ERRORLEVEL%
)

call npx tsc -p generator/tsconfig.json
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Generator build failed!
    exit /b %ERRORLEVEL%
)

echo.
echo [5/5] Building React Dashboard Client (client/)...
call npm run build --workspace=client
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Client build failed!
    exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo   SUCCESS: All components built cleanly!
echo ===================================================
