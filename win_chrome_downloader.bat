@echo off
cd /d "%~dp0"

REM Start the application via PowerShell script
REM PowerShell script will handle API_KEY check and configuration
echo.
echo Install Chrome for RAWOPS-WORKER...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0win_chrome_downloader.ps1"

pause

