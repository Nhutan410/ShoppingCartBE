# SecureUserAPI

SecureUserAPI là một ứng dụng API RESTful cho phép quản lý người dùng, xử lý xác thực, quản lý hồ sơ cá nhân và upload media. Dự án được xây dựng bằng Node.js và Express với cấu trúc rõ ràng, hỗ trợ nhiều chức năng liên quan đến quản lý người dùng.

## 🛠️ Tính năng

### Người dùng
- **Đăng ký tài khoản**: Tạo tài khoản mới với email và mật khẩu.
- **Đăng nhập/Đăng xuất**: Quản lý phiên đăng nhập với access token và refresh token.
- **Xác minh email**: Xác nhận email thông qua token.
- **Quên mật khẩu**: Gửi email khôi phục và đặt lại mật khẩu.
- **Cập nhật hồ sơ**: Cập nhật thông tin cá nhân như tên, ngày sinh, ảnh đại diện, v.v.
- **Đổi mật khẩu**: Đổi mật khẩu hiện tại.
- **Lấy thông tin cá nhân**: Xem chi tiết hồ sơ của người dùng.

### Media
- **Upload hình ảnh**: Tải lên và lưu trữ hình ảnh của người dùng.
- **Upload video**: Tải lên và lưu trữ video.

---

## 🏗️ Cài đặt và chạy dự án

### Yêu cầu
- Node.js v16+  
- npm hoặc yarn  
- MongoDB (hoặc cơ sở dữ liệu tương thích)
