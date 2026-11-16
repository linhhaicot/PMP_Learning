# PMLingo

**PMLingo** — PWA (offline-first) giúp học **từ vựng** và **đọc hiểu** tiếng Anh phục vụ kỳ thi **PMP**.

## Tính năng

- 🃏 **Flashcard + SRS** — ôn từ vựng với lặp lại ngắt quãng (thuật toán SM-2).
- ✅ **Quiz** — trắc nghiệm nghĩa từ, sinh câu hỏi tự động từ bộ từ vựng.
- 📖 **Đọc hiểu** — đoạn văn tiếng Anh theo ngữ cảnh PMP + câu hỏi.
- 📊 **Theo dõi tiến độ** — số từ đã học, số lần ôn hôm nay, chuỗi ngày (streak).

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

Nội dung là file JSON tĩnh trong `public/data/` — không cần code:

- Từ vựng: `public/data/vocabulary.json`
- Bài đọc: `public/data/readings.json`

## Tech stack

React 18 · Vite · TypeScript · Dexie (IndexedDB) · vite-plugin-pwa · React Router · Vitest

> Chi tiết kiến trúc cho việc phát triển xem [CLAUDE.md](./CLAUDE.md).
