@echo off
cd /d "%~dp0"

REM Start the application via PowerShell script
REM PowerShell script will handle API_KEY check and configuration
echo.
echo Starting RAWOPS-WORKER...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"

pause

