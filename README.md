<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# UTE Shop - Project CNPM

> Một dự án mẫu sử dụng [NestJS](https://nestjs.com/) để xây dựng backend cho ứng dụng shop.

## Mô tả

- **UTE Shop** là backend API xây dựng bằng NestJS (Node.js + TypeScript), thích hợp cho các ứng dụng thương mại điện tử.
- Dự án giúp quản lý sản phẩm, đơn hàng, người dùng, v.v.

## Cài đặt

1. **Yêu cầu:**
   - Node.js >= v14
   - npm
   - (Khuyến nghị) MongoDB/MySQL/Database khác nếu dự án sử dụng (xem các biến `DB_...` nếu có).

2. **Clone repository:**

   ```bash
   git clone https://github.com/zerrorTwo/project-cnpm-ute-shop.git
   cd project-cnpm-ute-shop
   ```

3. **Cài đặt packages:**

   ```bash
   npm install
   ```

4. **Tạo file .env**

   - Tạo file `.env` ở thư mục gốc và điền các nội dung sau (tuỳ chỉnh giá trị phù hợp):

     ```
     # --------- PORT & ENVIRONMENT ----------
     PORT=3009
     NODE_ENV=development

     # --------- JWT SECRET ----------
     ACCESS_TOKEN_SECRET=access_token_secret_key_demo
     REFRESH_TOKEN_SECRET=refresh_token_secret_key_demo

     # --------- CLOUDINARY ----------
     CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
     CLOUDINARY_API_KEY=your_cloudinary_api_key
     CLOUDINARY_API_SECRET=your_cloudinary_api_secret

     # --------- LOGGING ----------
     ENABLE_LOGGING=true

     # --------- CLIENT URL ----------
     CLIENT_URL=http://localhost:3000

     # --------- DATABASE -----------
     # Thêm biến kết nối DB nếu cần, ví dụ:
     # DB_HOST=localhost
     # DB_PORT=3306
     # DB_USERNAME=root
     # DB_PASSWORD=yourpassword
     # DB_DATABASE=ute_shop
     ```

   - Các giá trị SECRET/CLOUDINARY nên thay bằng giá trị thật môi trường của bạn.
   - Nếu bạn chạy frontend ở port khác, hãy cập nhật lại CLIENT_URL.
   - Nếu dùng Database hãy bổ sung chính xác các biến DB_... theo config source.

## Chạy dự án

### Development

```bash
npm run start
```

### Watch mode (Tự động reload khi thay đổi code)

```bash
npm run start:dev
```

> Bạn có thể xem/thiết lập cấu hình cơ sở dữ liệu tại các file trong `src/config` hoặc tài liệu hướng dẫn riêng.

## Lưu ý

- Để chạy được đầy đủ chức năng, cần tạo file `.env` hoặc cấu hình biến môi trường phù hợp với database của bạn.
- Hãy kiểm tra các file cấu hình để biết thêm thông tin về port, kết nối DB, v.v.
- Các giá trị ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET KHÔNG nên để mặc định khi deploy production!

---

_Cảm ơn bạn đã quan tâm đến dự án!_

**Link tham khảo:**  
- [NestJS](https://nestjs.com/)  
- [Source code](https://github.com/zerrorTwo/project-cnpm-ute-shop)
