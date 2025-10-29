# RAWOPS-WORKER

AI automation worker với Selenium và local browser cho Twitter automation.

## 🚀 Hướng dẫn Cài đặt và Chạy

### 0. Join Nhóm và Cấp Tài khoản
```bash
# Join nhóm Telegram để được hỗ trợ và cấp tài khoản
# Link: https://t.me/+__jEuPbz8EM4MjM1

# Liên hệ admin để được cấp tài khoản rawops.net
# Tài khoản cần thiết để sử dụng API và các tính năng premium
```

### 1. Cài đặt Node.js
```bash
# Tải và cài đặt Node.js từ https://nodejs.org/
# Khuyến nghị: Node.js 18+ hoặc 20+
```

### 2. Cài đặt pnpm
```bash
# Cài đặt pnpm globally
npm install -g pnpm
```

### 3. Cài đặt Dependencies
```bash
# Cài đặt tất cả dependencies
pnpm install
```

### 4. Cấu hình Environment
```bash
# Copy file example thành .env.local
cp example .env.local

# Chỉnh sửa .env.local với các thông tin cần thiết
# - API keys
```

### 5. Tải Chromium Browser
 [Tỉa](https://cdn.rawops.net/f/orHj/chromium.zip)
```bash
# Và giải nén cho thư mục chromium/
```

### 6. Tạo Profiles Directory
```bash
# Tạo thư mục profiles để lưu browser profiles
mkdir profiles

# Profiles sẽ được tự động tạo khi chạy worker
# Mỗi profile sẽ có tên riêng và cấu hình độc lập
```

### 7. Chạy Worker

#### Cách 1: Sử dụng script tự động (Khuyến nghị)
```bash
# Windows - Chạy file batch
start.bat

# Hoặc sử dụng PowerShell
.\start.ps1
```

Script sẽ tự động:
- Kiểm tra và cài đặt dependencies
- Tạo file `.env.local` nếu chưa có
- Yêu cầu nhập API_KEY nếu chưa được cấu hình
- Khởi động worker

#### Cách 2: Chạy thủ công
```bash
# Chạy worker trong production mode
pnpm start

# Hoặc chạy trong development mode
pnpm run dev
```

## 📁 Cấu trúc Thư mục

```
RAWOPS-WORKER/
├── worker/
├── packages/                # Packages workspace
├── chromium/               # Chromium browser files
├── profiles/              # Browser profiles
│   ├── DefaultUser/       # Default profile
│   └── [custom-profiles]/ # Custom profiles
├── cache/                 # Cache files
└── package.json           # Dependencies và scripts
```

## 🔧 Scripts Available

```bash
# Chạy worker
pnpm start
```

## ⚙️ Environment Variables

Tạo file `.env.local` ở root của project với các biến sau:

```env
WEB_API_URL=https://rawops.net/api
API_KEY=rawops_your_api_key_here
```

**Lưu ý**: File `.env.local` nằm ở root `I:\AI\RAWOPS\RAWOPS-WORKER\.env.local`

Nếu sử dụng `start.bat` hoặc `start.ps1`, file sẽ được tự động tạo và yêu cầu nhập API_KEY khi chạy.

## 🐛 Troubleshooting

### Lỗi "Cannot find module"
```bash
# Reinstall dependencies
rm -rf node_modules
pnpm install
```

