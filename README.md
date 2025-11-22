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

## 📥 Tải project

### Cài Git (nếu chưa có)
**Windows:** [Tải Git](https://git-scm.com/install/windows) → Cài đặt mặc định (Next → Next → Install)  
**macOS/Linux:** Git thường đã được cài sẵn

### Clone repository
```bash
git clone https://github.com/RawLogs/RAWOPS-WORKER.git
cd RAWOPS-WORKER
```

---

## ⚡ Cài đặt nhanh (3 bước)

### Bước 1: Tải Chromium
**Windows:** Double-click vào `win_chrome_downloader.bat`  
**macOS/Linux:** Chạy `./macos_chrome_downloader.sh`  
**Hoặc:** [Tải thủ công](https://cdn.rawops.net/f/orHj/chromium.zip) và giải nén vào thư mục `chromium/`

### Bước 2: Chạy Worker
Double-click vào file `start.bat` (Windows) hoặc `start.ps1` (PowerShell)

### Bước 3: Nhập API_KEY
Khi được yêu cầu, nhập API_KEY của bạn từ rawops.net

**Lấy API_KEY:** Tham gia nhóm Telegram: https://t.me/+__jEuPbz8EM4MjM1

---

Script `start.bat` sẽ tự động:
- ✅ Cài đặt dependencies
- ✅ Tạo file `.env.local`
- ✅ Khởi động worker

## ⚙️ Cấu hình

File `.env.local` sẽ được tự động tạo khi chạy `start.bat`. Nếu cần chỉnh sửa thủ công:

```env
WEB_API_URL=https://rawops.net/api
API_KEY=rawops_your_api_key_here
```

## 🐛 Xử lý lỗi

**Lỗi "Cannot find module":**
```bash
rm -rf node_modules
pnpm install
```

