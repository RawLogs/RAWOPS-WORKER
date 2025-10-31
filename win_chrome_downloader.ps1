# ==============================
# Chrome + ChromeDriver Downloader (Local Temp)
# ==============================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Chrome + ChromeDriver Auto Downloader   " -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

# --- Set working directories ---
$currentDir = Get-Location
$targetDir = Join-Path $currentDir "chromium"
$tempDir = Join-Path $currentDir "temp_chrome"

# Create dirs
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir | Out-Null
}
if (Test-Path $tempDir) {
    Write-Host "`nRemoving old temp_chrome directory..." -ForegroundColor DarkGray
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "`nTemporary download directory created at:" -ForegroundColor Green
Write-Host "   $tempDir" -ForegroundColor Cyan
Write-Debug "`nTarget installation directory:"
Write-Debug "   $targetDir"

# --- Build URLs (RawOps CDN Mirror) ---
$chromeUrl = "https://cdn.rawops.net/f/orHj/chromium.zip"

# --- Download files ---
function Get-File($url, $output) {
    Write-Host "Downloading $url ..." -ForegroundColor Yellow
    try {
        if (Get-Command curl.exe -ErrorAction SilentlyContinue) {
            & curl.exe -L --retry 5 --retry-delay 2 --continue-at - "$url" -o "$output"
        } elseif (Get-Command Start-BitsTransfer -ErrorAction SilentlyContinue) {
            Start-BitsTransfer -Source $url -Destination $output
        } else {
            Invoke-WebRequest -Uri $url -OutFile $output
        }
        Write-Host "Downloaded: $output" -ForegroundColor Green
    } catch {
        Write-Host "Download failed: $url" -ForegroundColor Red
        pause
        exit 1
    }
}

$chromePath = Join-Path $tempDir "chromium.zip"

Get-File $chromeUrl $chromePath

# --- Extract archives ---
if (Test-Path $chromePath) {
    Write-Host "`nExtracting Chrome..." -ForegroundColor Cyan
    Expand-Archive -LiteralPath $chromePath -DestinationPath $tempDir -Force
} else {
    Write-Host "Chrome ZIP not found!" -ForegroundColor Red
}

# --- Copy extracted content ---
Write-Host "`nCopying extracted files to $targetDir ..." -ForegroundColor Yellow
Get-ChildItem "$tempDir" -Recurse | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $targetDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "`nChrome and ChromeDriver are ready in:" -ForegroundColor Green
Write-Host "   $targetDir" -ForegroundColor Cyan

# --- Ask before cleaning up ---
$choice = Read-Host "`nDo you want to delete the temp_chrome folder? (Y/N)"
if ($choice -match "^[Yy]$") {
    Write-Host "Cleaning up temp_chrome..." -ForegroundColor DarkGray
    Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
    Write-Host "🧹 Temporary files removed." -ForegroundColor Green
} else {
    Write-Host "Temp folder kept at:" -ForegroundColor Yellow
    Write-Host "   $tempDir" -ForegroundColor Cyan
}

Write-Host "`nAll tasks completed successfully!" -ForegroundColor Green
pause
