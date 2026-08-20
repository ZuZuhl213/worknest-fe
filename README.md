# WorkNest Frontend

Giao diện người dùng cho hệ thống WorkNest xây dựng trên React 19, TypeScript, Vite và Tailwind CSS.

---

## Tính năng chính

- **Xác thực người dùng**: Đăng nhập qua Form hoặc Google OAuth2, lưu phiên qua HTTP-only cookies, tự động làm mới token.
- **Quản lý Workspace & Dự án**: Bảng điều khiển tổng quan, quản lý thành viên và phân quyền chi tiết.
- **Kanban Board & Task Detail**: Kéo thả task, gán nhãn, cập nhật trạng thái, đính kèm tệp tin và bình luận.
- **Thông báo thời gian thực**: Trung tâm thông báo các sự kiện quan trọng trong dự án.

---

## Yêu cầu môi trường

- **Node.js**: 22+
- **pnpm**: 9+

---

## Khởi chạy Local

1. **Cài đặt dependencies và thiết lập môi trường:**
   ```bash
   cp .env.example .env
   pnpm install
   ```

2. **Chạy dev server:**
   ```bash
   pnpm dev
   ```

- Địa chỉ truy cập: `http://localhost:5173`
- Dev proxy chuyển tiếp request `/api/*` tới backend (mặc định cấu hình `VITE_API_PROXY_TARGET=http://localhost:8000` trong `.env`).

---

## Kiểm thử & Build

```bash
# Kiểm tra định dạng và lỗi code
pnpm lint

# Chạy Unit test
pnpm test

# Build production
pnpm build

# Chạy bản build local để kiểm thử
pnpm preview
```

---

## Triển khai Production (Cloudflare Pages)

- **Build command**: `pnpm run build`
- **Output directory**: `dist`
- **Node version**: `22`
- **Mô hình**: Cùng domain (Same-origin) thông qua rule rewrite trong `public/_redirects`:
  ```text
  /api/* https://api.your-domain.com/api/:splat 200
  ```
  *(Để trống biến `VITE_API_BASE_URL` khi sử dụng proxy rewrite này)*.
