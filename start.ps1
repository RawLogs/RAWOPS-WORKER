# PowerShell script to start RAWOPS-WORKER
# Usage: .\start.ps1

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "Starting RAWOPS-WORKER..." -ForegroundColor Green

# Auto-update logic
Write-Host "Checking for updates..." -ForegroundColor Cyan
git fetch origin
$local = git rev-parse HEAD
$remote = git rev-parse '@{u}'

if ($local -ne $remote) {
    Write-Host "New version available. Updating..." -ForegroundColor Yellow
    $currentBranch = git rev-parse --abbrev-ref HEAD
    git reset --hard "origin/$currentBranch"
    git pull
    Write-Host "Update complete." -ForegroundColor Green
} else {
    Write-Host "Already up to date." -ForegroundColor Green
}

# Check if node is installed
try {
    node --version | Out-Null
    Write-Host "Node.js is installed." -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed." -ForegroundColor Yellow
    $installNode = Read-Host "Do you want to install it now using winget? (y/n)"
    if ($installNode -eq 'y') {
        Write-Host "Installing Node.js LTS..." -ForegroundColor Cyan
        winget install OpenJS.NodeJS.LTS
        Write-Host "Node.js installed successfully. Please restart the terminal and run the script again." -ForegroundColor Green
        exit 0
    } else {
        Write-Host "Please install Node.js to continue." -ForegroundColor Red
        exit 1
    }
}

# Check if pnpm is installed
try {
    $pnpmVersion = pnpm --version
    Write-Host "pnpm version: $($pnpmVersion)" -ForegroundColor Cyan
} catch {
    Write-Host "pnpm is not installed." -ForegroundColor Yellow
    $installPnpm = Read-Host "Do you want to install it now using npm? (y/n)"
    if ($installPnpm -eq 'y') {
        Write-Host "Installing pnpm globally..." -ForegroundColor Cyan
        npm install -g pnpm
        Write-Host "pnpm installed successfully." -ForegroundColor Green
    } else {
        Write-Host "Please install pnpm to continue: npm install -g pnpm" -ForegroundColor Red
        exit 1
    }
}


# Always run pnpm install to ensure dependencies are up to date
Write-Host "Installing/updating dependencies..." -ForegroundColor Yellow
$hasInstalledWorker = Read-Host "Nếu cài Worker rồi thì nhập y, nếu chưa cài thì nhập n? (y/n)"
if ($hasInstalledWorker -eq 'y') {
    Write-Host "Skipping pnpm install." -ForegroundColor Cyan
} else {
    Write-Host "Installing dependencies with pnpm..." -ForegroundColor Cyan
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
            Write-Host "Found API_KEY in .env.local (length: $($apiKeyValue.Length))" -ForegroundColor Cyan
            
            if ([string]::IsNullOrWhiteSpace($apiKeyValue) -or $apiKeyValue -eq '...' -or $apiKeyValue -eq 'your_api_key_here' -or $apiKeyValue -eq 'your_api_key_from_website') {
                Write-Host "API_KEY is invalid: '$apiKeyValue'" -ForegroundColor Yellow
                $needsApiKey = $true
                $apiKeySet = $true
                break
            } else {
                Write-Host "API_KEY is valid" -ForegroundColor Green
                # Valid API_KEY found, don't need to prompt
                $needsApiKey = $false
                $apiKeySet = $true
                break
            }
        }
    }
    
    # Check if API_KEY line doesn't exist at all (only if we didn't already find it)
    if (-not $apiKeySet) {
        if (-not ($envContent | Where-Object { $_ -match "^\s*API_KEY\s*=" })) {
            $needsApiKey = $true
        }
    }
} else {
    # File doesn't exist, create it
    $fullPath = Join-Path $ScriptDir $envFile
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    
    # Create directory if it doesn't exist
    $dirPath = Split-Path -Parent $envFile
    if (-not (Test-Path $dirPath)) {
        New-Item -Path $dirPath -ItemType Directory -Force | Out-Null
        Write-Host "Created directory: $dirPath" -ForegroundColor Cyan
    }
    
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
Write-Host "Starting RAWOPS-WORKER worker..." -ForegroundColor Green
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
