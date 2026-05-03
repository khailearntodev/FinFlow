# 🌊 FinFlow - Family Financial Management System

FinFlow là ứng dụng quản lý tài chính và chi tiêu chung thông minh, được thiết kế chuyên biệt cho mô hình gia đình hoặc nhóm người sống chung. Hệ thống giúp minh bạch hóa mọi khoản chi tiêu, tự động tính toán công nợ và đơn giản hóa quá trình tất toán hàng tháng.

## 🚀 Tính năng cốt lõi

### 1. Quản lý Gia đình & Nhóm
- **Tạo/Tham gia nhóm**: Dễ dàng tạo không gian chung cho gia đình và mời thành viên qua Email.
- **Ngày chốt sổ linh hoạt**: Chủ hộ tùy chỉnh ngày chốt sổ hàng tháng (Billing Date) để phù hợp với chu kỳ thu nhập của gia đình.

### 2. Ghi chép chi tiêu thông minh
- **Chia tiền linh hoạt (Split Logic)**: Hỗ trợ chia đều cho tất cả hoặc chỉ chọn một số thành viên tham gia vào khoản chi cụ thể.
- **Khóa dữ liệu an toàn**: Các khoản chi sau khi đã chốt sổ sẽ được khóa (SETTLED) để đảm bảo tính minh bạch, không thể sửa đổi.

### 3. Tự động hóa kết sổ (Settlement)
- **Thuật toán cấn trừ thông minh**: Tự động tính toán số dư cuối cùng (Net Balance) dựa trên số tiền đã chi trả thực tế và phần nghĩa vụ phải đóng.
- **Mô hình thanh toán tập trung**: Mọi dòng tiền đều quy về một đầu mối duy nhất là **Chủ hộ**.
- **Lịch trình tự động**: Tự động chạy chốt sổ vào lúc 00:00 của ngày được thiết lập thông qua Cronjob.

### 4. Quy trình thanh toán minh bạch
- **Minh chứng chuyển khoản**: Thành viên bắt buộc phải upload hình ảnh chuyển khoản khi báo cáo đã thanh toán.
- **Duyệt thanh toán**: Chủ hộ trực tiếp kiểm tra minh chứng và phê duyệt để hoàn tất công nợ.

### 5. Nhật ký hoạt động (Audit Trail)
- Lưu lại lịch sử mọi thao tác (Tạo/Sửa/Xóa) liên quan đến tiền bạc, bao gồm cả giá trị cũ và giá trị mới để đối soát khi cần thiết.

---

## 👥 Phân quyền người dùng

| Vai trò | Quyền hạn chính |
| :--- | :--- |
| **Chủ hộ (Head)** | Tạo gia đình, thiết lập ngày chốt sổ, thanh toán hóa đơn chung (điện, nước...), duyệt minh chứng thanh toán, hủy chốt sổ khi có sai sót. |
| **Thành viên (Member)** | Tham gia gia đình, thêm khoản chi cá nhân cho mục đích chung, theo dõi báo cáo công nợ cá nhân, nộp minh chứng thanh toán. |

---

## 🛠 Công nghệ sử dụng

### Backend (Java Ecosystem)
- **Spring Boot 3.x**: Framework chính cho server.
- **Spring Security & JWT**: Bảo mật và xác thực người dùng.
- **Spring Data JPA**: Quản lý tương tác với cơ sở dữ liệu.
- **PostgreSQL (Supabase)**: Hệ quản trị cơ sở dữ liệu quan hệ.

### Frontend (Modern Web)
- **Next.js 14 (App Router)**: Framework React mạnh mẽ cho phía Client.
- **TypeScript**: Đảm bảo an toàn kiểu dữ liệu.
- **Tailwind CSS**: Thiết kế giao diện hiện đại, responsive.
- **Lucide React**: Bộ icon tinh tế.

### Storage & Infrastructure
- **Cloudinary/Supabase Storage**: Lưu trữ hình ảnh minh chứng thanh toán.
- **Docker & Docker Compose**: Đóng gói và triển khai ứng dụng dễ dàng.

---

## ⚙️ Cài đặt nhanh

### Yêu cầu hệ thống
- Docker & Docker Compose
- Node.js (nếu chạy local không qua Docker)
- Java 17+ (nếu chạy local không qua Docker)

### Các bước thực hiện

1. **Clone dự án**:
   ```bash
   git clone <repository-url>
   cd FinFlow
   ```

2. **Cấu hình môi trường**:
   Tạo file `.env` tại thư mục gốc và các thư mục `finflow-backend`, `finflow-frontend` dựa trên các file `.env.example`.

3. **Triển khai với Docker**:
   ```bash
   docker compose up --build
   ```

4. **Truy cập ứng dụng**:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8080/api`

---

## 🛡 Bảo mật & Toàn vẹn dữ liệu
- **Data Isolation**: Đảm bảo dữ liệu giữa các gia đình hoàn toàn tách biệt.
- **Permission Check**: Kiểm tra quyền nghiêm ngặt tại layer Service (ví dụ: Thành viên không thể tự duyệt thanh toán cho chính mình).
- **Transaction Management**: Đảm bảo các thao tác tài chính quan trọng luôn được thực hiện theo cơ chế Atomic.

---
*Dự án được phát triển bởi khailearntodev.*
