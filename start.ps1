# PowerShell script to start RAWOPS-WORKER
# Usage: .\start.ps1

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "Đang khởi động RAWOPS-WORKER..." -ForegroundColor Green

# Auto-update logic
Write-Host "Đang kiểm tra cập nhật..." -ForegroundColor Cyan
git fetch origin
$local = git rev-parse HEAD
$remote = git rev-parse '@{u}'

if ($local -ne $remote) {
    Write-Host "Có phiên bản mới. Đang cập nhật..." -ForegroundColor Yellow
    $currentBranch = git rev-parse --abbrev-ref HEAD
    git reset --hard "origin/$currentBranch"
    git pull
    Write-Host "Cập nhật hoàn tất." -ForegroundColor Green
} else {
    Write-Host "Đã là phiên bản mới nhất." -ForegroundColor Green
}

# Check if node is installed
try {
    node --version | Out-Null
    Write-Host "Đã cài đặt Node.js." -ForegroundColor Green
} catch {
    Write-Host "Chưa cài đặt Node.js." -ForegroundColor Yellow
    $installNode = Read-Host "Bạn có muốn cài đặt ngay bằng winget? (y/n)"
    if ($installNode -eq 'y') {
        Write-Host "Đang cài đặt Node.js LTS..." -ForegroundColor Cyan
        winget install OpenJS.NodeJS.LTS
        Write-Host "Cài đặt Node.js thành công. Vui lòng khởi động lại terminal và chạy script lại." -ForegroundColor Green
        exit 0
    } else {
        Write-Host "Vui lòng cài đặt Node.js để tiếp tục." -ForegroundColor Red
        exit 1
    }
}

# Check if pnpm is installed
try {
    $pnpmVersion = pnpm --version
    Write-Host "Phiên bản pnpm: $($pnpmVersion)" -ForegroundColor Cyan
} catch {
    Write-Host "Chưa cài đặt pnpm." -ForegroundColor Yellow
    $installPnpm = Read-Host "Bạn có muốn cài đặt ngay bằng npm? (y/n)"
    if ($installPnpm -eq 'y') {
        Write-Host "Đang cài đặt pnpm toàn cục..." -ForegroundColor Cyan
        npm install -g pnpm
        Write-Host "Cài đặt pnpm thành công." -ForegroundColor Green
    } else {
        Write-Host "Vui lòng cài đặt pnpm để tiếp tục: npm install -g pnpm" -ForegroundColor Red
        exit 1
    }
}


# Always run pnpm install to ensure dependencies are up to date
Write-Host "Đang cài đặt/cập nhật dependencies..." -ForegroundColor Yellow
$hasInstalledWorker = Read-Host "Nếu đã cài WORKER lần đầu rồi thì YES, nếu chưa thì NO? (y/n)"
if ($hasInstalledWorker -eq 'y') {
    Write-Host "Bỏ qua cài đặt pnpm." -ForegroundColor Cyan
} else {
    Write-Host "Đang cài đặt dependencies bằng pnpm..." -ForegroundColor Cyan
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
            Write-Host "Đã tìm thấy API_KEY trong .env.local (độ dài: $($apiKeyValue.Length))" -ForegroundColor Cyan
            
            if ([string]::IsNullOrWhiteSpace($apiKeyValue) -or $apiKeyValue -eq '...' -or $apiKeyValue -eq 'your_api_key_here' -or $apiKeyValue -eq 'your_api_key_from_website') {
                Write-Host "API_KEY không hợp lệ: '$apiKeyValue'" -ForegroundColor Yellow
                $needsApiKey = $true
                $apiKeySet = $true
                break
            } else {
                Write-Host "API_KEY hợp lệ" -ForegroundColor Green
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
    Write-Host "Đang tạo file .env.local..." -ForegroundColor Yellow
    
    # Create directory if it doesn't exist
    $dirPath = Split-Path -Parent $envFile
    if (-not (Test-Path $dirPath)) {
        New-Item -Path $dirPath -ItemType Directory -Force | Out-Null
        Write-Host "Đã tạo thư mục: $dirPath" -ForegroundColor Cyan
    }
    
    New-Item -Path $envFile -ItemType File -Force | Out-Null
    
    # Add default content
    $defaultContent = @"
WEB_API_URL=https://rawops.net/api
API_KEY=your_api_key_here
"@
    Set-Content -Path $envFile -Value $defaultContent
    Write-Host "Đã tạo $fullPath với giá trị mặc định" -ForegroundColor Cyan
    $needsApiKey = $true
}

# Prompt for API_KEY if needed
if ($needsApiKey) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host "API_KEY bị thiếu hoặc không hợp lệ!" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Lấy API key từ: https://rawops.net/" -ForegroundColor Cyan
    Write-Host "1. Truy cập https://rawops.net/" -ForegroundColor White
    Write-Host "2. Đăng nhập vào tài khoản YAP Suite của bạn" -ForegroundColor White
    Write-Host "3. Điều hướng đến phần 'MY API KEY'" -ForegroundColor White
    Write-Host "4. Sao chép API key của bạn" -ForegroundColor White
    Write-Host ""
    
    $apiKey = Read-Host "Nhập API_KEY của bạn" 
    
    if ([string]::IsNullOrWhiteSpace($apiKey)) {
        Write-Host "API_KEY là bắt buộc!" -ForegroundColor Red
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
    Write-Host "✅ Đã lưu API_KEY vào $envFile" -ForegroundColor Green
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
        Write-Host "Đang thêm WEB_API_URL vào .env.local..." -ForegroundColor Yellow
        Add-Content -Path $envFile -Value "WEB_API_URL=https://rawops.net/api"
        Write-Host "✅ Đã thêm WEB_API_URL" -ForegroundColor Green
    }
}

# Start the application
Write-Host ""
Write-Host "Đang khởi động worker RAWOPS-WORKER..." -ForegroundColor Green
Write-Host ""
pnpm start

# Check exit code
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Ứng dụng kết thúc với mã lỗi: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Ứng dụng đã đóng." -ForegroundColor Green

