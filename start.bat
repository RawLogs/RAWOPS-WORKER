@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

REM Check if .env.local exists
if not exist ".env.local" (
    echo Creating .env.local at root directory...
    (
        echo WEB_API_URL=https://rawops.net/api
        echo API_KEY=your_api_key_here
    ) > ".env.local"
    echo Created: %CD%\.env.local
)

REM Check API_KEY
findstr /C:"API_KEY=" ".env.local" | findstr /V "your_api_key_here" | findstr /V "..." >nul 2>&1
if errorlevel 1 (
    echo.
    echo ================================================
    echo API_KEY is missing or invalid!
    echo ================================================
    echo.
    echo Get your API key from: https://rawops.net/
    echo.
    set /p API_KEY="Enter your API_KEY: "
    
    if "!API_KEY!"=="" (
        echo API_KEY is required!
        pause
        exit /b 1
    )
    
    REM Save API_KEY to .env.local
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& { $apiKey = '!API_KEY!'; $envFile = '.env.local'; $content = Get-Content $envFile; $found = $false; $newContent = @(); foreach ($line in $content) { if ($line -match '^API_KEY=') { $newContent += \"API_KEY=$apiKey\"; $found = $true } else { $newContent += $line } }; if (-not $found) { $newContent += \"API_KEY=$apiKey\" }; Set-Content $envFile -Value $newContent; Write-Host 'API_KEY saved successfully!' -ForegroundColor Green }"
    echo.
)

REM Check WEB_API_URL
findstr /C:"WEB_API_URL=" ".env.local" >nul 2>&1
if errorlevel 1 (
    echo Adding WEB_API_URL to .env.local...
    echo WEB_API_URL=https://rawops.net/api >> ".env.local"
    echo WEB_API_URL added.
)

REM Start the application
echo.
echo Starting RAWOPS-WORKER...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"

pause

