# 🪜 HƯỚNG DẪN CÀI ĐẶT RAWOPS-WORKER (Windows)

## **Bước 0 — Tạo tài khoản GitHub & đánh dấu repo**
1. Vào 👉 [https://github.com/RawLogs/RAWOPS-WORKER](https://github.com/RawLogs/RAWOPS-WORKER)  
2. Nếu chưa có tài khoản, **đăng ký GitHub** (chỉ cần email).  
3. Sau khi đăng nhập, **nhấn “⭐ Star”** để theo dõi dự án.

---

## **Bước 1 — Tải và cài Git Bash**
🔗 Link tải nhanh:  
[https://git-scm.com/install/windows](https://git-scm.com/install/windows)  
Hoặc tải trực tiếp:  
[Git-2.51.1-64-bit.exe](https://github.com/git-for-windows/git/releases/download/v2.51.1.windows.1/Git-2.51.1-64-bit.exe)

👉 Cài đặt mặc định, cứ nhấn **Next → Next → Install** là xong.

---

## **Bước 2 — Clone source RAWOPS-WORKER**
1. Mở thư mục bạn muốn lưu project (VD: Desktop).  
2. **Chuột phải > Git Bash Here**  
3. Dán lệnh sau và Enter:
   ```bash
   git clone https://github.com/RawLogs/RAWOPS-WORKER.git
   ```
4. Đợi tải xong, bạn sẽ có thư mục `RAWOPS-WORKER`.

---

## **Bước 3 — Lấy API KEY & cấu hình**
1. Truy cập 👉 [https://rawops.net/my-profile](https://rawops.net/my-profile)  
   → Copy **API_KEY** của bạn.  
2. Vào 👉 [https://aistudio.google.com/usage?timeRange=last-28-days](https://aistudio.google.com/usage?timeRange=last-28-days)  
   → Lấy **Gemini API Key**.  
3. Dán 1 **API_KEY** này vào file cấu hình khi được yêu cầu (hoặc chỉnh trực tiếp trong `.env.local` nếu làm thủ công).

---

## **Bước 4 — Tải Chromium/ChromeDriver**

Tool cần Chromium để chạy. Tải theo hệ điều hành của bạn:

### **Windows:**
1. Mở thư mục `RAWOPS-WORKER` (thư mục đã clone ở Bước 2).
2. **Chuột phải vào file `win_chrome_downloader.bat`** → Chọn **Run as administrator** (hoặc double-click).
3. Script sẽ tự động tải và cài đặt ChromeDriver vào thư mục `chromium/`.
4. Đợi quá trình tải hoàn tất.

### **macOS/Linux:**
1. Mở Terminal.
2. Di chuyển đến thư mục `RAWOPS-WORKER`:
   ```bash
   cd /đường/dẫn/đến/RAWOPS-WORKER
   ```
3. Cấp quyền thực thi và chạy script:
   ```bash
   chmod +x macos_chrome_downloader.sh
   ./macos_chrome_downloader.sh
   ```
4. Trả lời câu hỏi "Da co chromedriver chua? (y/n)" → Nhấn `n` nếu chưa có.
5. Script sẽ tự động phát hiện phiên bản Chrome và tải ChromeDriver phù hợp vào thư mục `chromium/`.

---

## **Bước 5 — Chạy tool**

- Cách nhanh nhất: **chạy file `start.bat`** trong thư mục `RAWOPS-WORKER`.  
  (Tool sẽ tự kiểm tra môi trường, cài thư viện và chạy worker tự động.)  
- Nếu muốn cài thủ công: đọc file hướng dẫn chi tiết tại 👉  
  [README.md trên GitHub](https://github.com/RawLogs/RAWOPS-WORKER/blob/master/README.md)

---

## **Bước 6 — Thiết lập profile X (Twitter)**
1. Truy cập 👉 [https://rawops.net/profiles](https://rawops.net/profiles)  
2. Tạo profile mới, **tên profile = username X (không có @)**  
   → Ví dụ: nếu Twitter là `@hieu_xyz`, thì nhập `hieu_xyz`.

---

## **Bước 7 — Kích hoạt và test comment**
1. Vào 👉 [https://rawops.net/ycomment](https://rawops.net/ycomment)  
2. Ở phần **Action**, chọn **Active Profile** → Login X (Twitter).  
3. Click vào profile đó → điền **link bài tweet cần chéo comment**.  
4. Test thử **1 link** để kiểm tra, sau đó chéo comment bình thường.

---

✅ **Hoàn tất!**  
Bạn đã cài và kích hoạt thành công RAWOPS-WORKER để tham gia hệ thống comment, quote và tương tác YAP.
