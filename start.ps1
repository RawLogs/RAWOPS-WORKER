# PowerShell script to start RAWOPS-WORKER
# Usage: .\start.ps1

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "Starting RAWOPS-WORKER..." -ForegroundColor Green

# Check if pnpm is installed
try {
    $pnpmVersion = pnpm --version
    Write-Host "pnpm version: $pnpmVersion" -ForegroundColor Cyan
} catch {
    Write-Host "Error: pnpm is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install pnpm: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pnpm install
}

# Check API_KEY configuration
$envFile = ".env.local"
$needsApiKey = $false
$apiKey = ""

# Check if .env.local exists
if (Test-Path $envFile) {
    # Read and check API_KEY
    $envContent = Get-Content $envFile
    $apiKeySet = $false
    
    foreach ($line in $envContent) {
        if ($line -match "^\s*API_KEY\s*=\s*(.+)$") {
            $apiKeyValue = $matches[1].Trim()
            if ([string]::IsNullOrWhiteSpace($apiKeyValue) -or $apiKeyValue -eq '...' -or $apiKeyValue -eq 'your_api_key_here' -or $apiKeyValue -eq 'your_api_key_from_website') {
                $needsApiKey = $true
                $apiKeySet = $true
                break
            }
        }
    }
    
    # Check if API_KEY line doesn't exist at all
    if (-not $envContent | Where-Object { $_ -match "^\s*API_KEY\s*=" }) {
        $needsApiKey = $true
    }
} else {
    # File doesn't exist, create it
    $fullPath = Join-Path $ScriptDir $envFile
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    New-Item -Path $envFile -ItemType File -Force | Out-Null
    
    # Add default content
    $defaultContent = @"
WEB_API_URL=https://rawops.net/api
API_KEY=your_api_key_here
"@
    Set-Content -Path $envFile -Value $defaultContent
    Write-Host "Created $fullPath with default values" -ForegroundColor Cyan
    $needsApiKey = $true
}

# Prompt for API_KEY if needed
if ($needsApiKey) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host "API_KEY is missing or invalid!" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Get your API key from: https://rawops.net/" -ForegroundColor Cyan
    Write-Host "1. Visit https://rawops.net/" -ForegroundColor White
    Write-Host "2. Sign in to your YAP Suite account" -ForegroundColor White
    Write-Host "3. Navigate to 'MY API KEY' section" -ForegroundColor White
    Write-Host "4. Copy your API key" -ForegroundColor White
    Write-Host ""
    
    $apiKey = Read-Host "Enter your API_KEY" 
    
    if ([string]::IsNullOrWhiteSpace($apiKey)) {
        Write-Host "API_KEY is required!" -ForegroundColor Red
        exit 1
    }
    
    # Update the .env.local file
    $envContent = Get-Content $envFile
    $newContent = @()
    $updated = $false
    
    foreach ($line in $envContent) {
        if ($line -match "^\s*API_KEY\s*=") {
            $newContent += "API_KEY=$apiKey"
            $updated = $true
        } else {
            $newContent += $line
        }
    }
    
    # If no API_KEY line was found, add it
    if (-not $updated) {
        $newContent += "API_KEY=$apiKey"
    }
    
    Set-Content -Path $envFile -Value $newContent
    Write-Host ""
    Write-Host "✅ API_KEY saved to $envFile" -ForegroundColor Green
    Write-Host ""
}

# Check WEB_API_URL
$envContent = Get-Content $envFile -ErrorAction SilentlyContinue
if ($envContent) {
    $hasWebApiUrl = $false
    foreach ($line in $envContent) {
        if ($line -match "^\s*WEB_API_URL\s*=") {
            $hasWebApiUrl = $true
            break
        }
    }
    
    if (-not $hasWebApiUrl) {
        Write-Host "Adding WEB_API_URL to .env.local..." -ForegroundColor Yellow
        Add-Content -Path $envFile -Value "WEB_API_URL=https://rawops.net/api"
        Write-Host "✅ WEB_API_URL added" -ForegroundColor Green
    }
}

# Start the application
Write-Host ""
Write-Host "Starting RAWOPS-WORKER..." -ForegroundColor Green
Write-Host ""
pnpm start

# Check exit code
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Application exited with error code: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Application closed." -ForegroundColor Green

