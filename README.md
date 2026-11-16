# PMLingo

**PMLingo** — PWA (offline-first) giúp học **từ vựng** và **đọc hiểu** tiếng Anh phục vụ kỳ thi **PMP**.

## Tính năng

- 🃏 **Flashcard + SRS** — ôn từ vựng với lặp lại ngắt quãng (thuật toán SM-2).
- ✅ **Quiz** — trắc nghiệm nghĩa từ, sinh câu hỏi tự động từ bộ từ vựng.
- 📖 **Đọc hiểu** — đoạn văn tiếng Anh theo ngữ cảnh PMP + câu hỏi.
- 📊 **Theo dõi tiến độ** — số từ đã học, số lần ôn hôm nay, chuỗi ngày (streak).
- ⬆️ **Nhập nội dung** — tự đẩy từ vựng + bài đọc bằng Markdown (dán text hoặc chọn file `.md`).

Hoạt động **hoàn toàn offline** sau lần tải đầu, cài được lên màn hình chính (PWA).

## Chạy dự án

```bash
npm install
npm run dev        # phát triển
npm run build      # build production
npm run preview    # xem thử bản build (cần thiết để test service worker/PWA)
npm test           # chạy test
```

## Thêm nội dung học

Mở tab **Nhập** trong app → bấm **Tải template** để lấy mẫu Markdown (`public/templates/content-template.md`), điền nội dung của bạn theo mẫu, rồi dán lại hoặc chọn file `.md`. Nội dung lưu vào máy (IndexedDB) và dùng ngay ở cả Flashcard/Quiz/Đọc hiểu. File JSON trong `public/data/` chỉ là dữ liệu demo ban đầu.

## Deploy

Push lên nhánh `main` → GitHub Actions tự build và deploy lên GitHub Pages (bật Pages với Source = *GitHub Actions*). Xem [CLAUDE.md](./CLAUDE.md#deploy).

## Tech stack

React 18 · Vite · TypeScript · Dexie (IndexedDB) · vite-plugin-pwa · React Router · Vitest

> Chi tiết kiến trúc cho việc phát triển xem [CLAUDE.md](./CLAUDE.md).
