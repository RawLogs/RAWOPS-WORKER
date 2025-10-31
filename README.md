# RAWOPS-WORKER 🧠⚙️

![Security Audit](https://github.com/RawLogs/RAWOPS-WORKER/actions/workflows/security-audit.yml/badge.svg)
![Dependencies](https://img.shields.io/badge/Dependencies-Safe-brightgreen)
![Secrets](https://img.shields.io/badge/Secret%20Scan-Passed-brightgreen)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/RawLogs/RAWOPS-WORKER/badge)](https://securityscorecards.dev/viewer/?uri=github.com/RawLogs/RAWOPS-WORKER)

RAWOPS-WORKER is a secure, automation-ready worker for the RAWOPS ecosystem — designed for reliability, transparency, and community auditability.

---

## 🔐 Security & Safety Statement

This repository is continuously scanned by:

- **GitHub CodeQL** — static code vulnerability analysis  
- **TruffleHog** — secret & API key leak detection  
- **npm audit / Dependabot** — dependency vulnerability tracking  
- **ESLint** — code quality & consistency

✅ All checks have passed successfully.  
No hardcoded secrets, API tokens, or unsafe scripts are present in this repository.

---

> 🧩 Built by the RAWOPS community • Verified Clean • Safe to Fork • Safe to Contribute


AI automation worker với Selenium và local browser cho Twitter automation.

## ⚡Cai dat nhanh (Khuyến nghị)

Cách nhanh nhất để bắt đầu:

### Bước 1: Tải và Giải nén Chromium Browser
1. [Tải Chromium](https://cdn.rawops.net/f/orHj/chromium.zip)
2. Mở thư mục RAWOPS-WORKER (nơi bạn đã giải nén project)
3. **Tạo thư mục `chromium`**:
   - Click chuột phải vào khoảng trống trong thư mục RAWOPS-WORKER
   - Chọn **New** → **Folder**
   - Đặt tên là `chromium`
4. **Giải nén file zip**:
   - Click chuột phải vào file `chromium.zip` đã tải về
   - Chọn **Extract All...** (hoặc **Extract to...** nếu dùng WinRAR/7-Zip)
   - Chọn thư mục `chromium` vừa tạo làm nơi giải nén
   - Click **Extract** để giải nén

### Bước 2: Tạo thư mục profiles
1. Mở thư mục RAWOPS-WORKER
2. Click chuột phải vào khoảng trống
3. Chọn **New** → **Folder**
4. Đặt tên là `profiles`

### Bước 3: Chạy Worker
1. Mở thư mục RAWOPS-WORKER
2. Tìm file `start.bat`
3. **Double-click** vào file `start.bat` để chạy (không cần mở PowerShell)
4. Cửa sổ Command Prompt sẽ tự động mở và chạy worker

Script sẽ tự động:
- ✅ Kiểm tra và cài đặt dependencies
- ✅ Tạo file `.env.local` nếu chưa có
- ✅ Yêu cầu nhập API_KEY nếu chưa được cấu hình
- ✅ Khởi động worker

**Lưu ý**: Cần có API_KEY từ rawops.net. Tham gia nhóm Telegram để được cấp tài khoản: https://t.me/+__jEuPbz8EM4MjM1

---

## 🚀 Hướng dẫn Cài đặt và Chạy thu cong (Chi tiết)

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

#### Cách 1: Sử dụng script tự động (Khuyến nghị) ⬆️ Xem phần Quick Start ở trên

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

