# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**PMLingo** — PWA (offline-first) để học từ vựng và đọc hiểu tiếng Anh phục vụ thi **PMP**. Stack: **React 18 + Vite + TypeScript**, dữ liệu người dùng lưu **IndexedDB qua Dexie**, đóng gói PWA bằng **vite-plugin-pwa** (Workbox). Không có backend — toàn bộ chạy client-side và hoạt động offline.

## Commands

```bash
npm run dev          # Vite dev server (HMR)
npm run build        # tsc -b (typecheck toàn bộ project refs) rồi vite build → dist/ + service worker
npm run preview      # Chạy thử bản build production (bắt buộc để test PWA/service worker)
npm run lint         # ESLint
npm run typecheck    # tsc -b --noEmit, không build
npm test             # vitest run (one-shot)
npm run test:watch   # vitest watch
npx vitest run src/srs/sm2.test.ts   # Chạy một file test
```

`npm run build` **typecheck trước khi build** (`tsc -b`) — lỗi type sẽ làm fail build, không chỉ là cảnh báo.

## Kiến trúc

Luồng dữ liệu tách làm hai, đây là điểm quan trọng nhất cần nắm:

- **Nội dung tĩnh** (từ vựng, bài đọc) = JSON trong `public/data/`, nạp qua `fetch` trong `src/db/content.ts` (có memoise theo session). KHÔNG nằm trong IndexedDB. Thêm/sửa từ vựng = sửa `public/data/vocabulary.json`; thêm bài đọc = sửa `public/data/readings.json`. Service worker cache các file này nên chúng chạy offline.
- **Trạng thái người học** (tiến độ SRS, lịch sử trả lời, thống kê ngày) = IndexedDB qua Dexie, định nghĩa ở `src/db/schema.ts` (3 bảng: `progress`, `reviews`, `daily`).

**Mọi tương tác có chấm điểm phải đi qua `src/db/reviews.ts`** — đây là lớp ghi duy nhất. `gradeFlashcard()` và `logAnswer()` cập nhật SRS + review log + thống kê ngày **trong cùng một Dexie transaction** để dữ liệu luôn nhất quán. Không ghi thẳng vào `db.progress`/`db.reviews`/`db.daily` từ component.

**Thuật toán SRS** (`src/srs/sm2.ts`) là module **thuần, không I/O** (SM-2, kiểu Anki). Nhận `now` như tham số (không đọc đồng hồ) để test tất định. Mọi thay đổi lịch ôn tập đều ở đây và phải có test (`sm2.test.ts`) đi kèm.

**UI reactive**: `HomePage` dùng `useLiveQuery` (dexie-react-hooks) nên số liệu tự cập nhật ngay khi có review mới ghi vào DB ở bất kỳ đâu — không cần truyền state thủ công.

### Bố cục

- `src/router.tsx` — bảng route duy nhất; 4 tính năng là route con dưới `AppLayout` (tab bar dưới cùng).
- `src/features/{flashcards,quiz,reading,progress}/` — mỗi tính năng một trang. Quiz sinh câu hỏi trắc nghiệm **on-the-fly** từ bộ từ vựng (shuffle tất định theo index); Reading đọc câu hỏi từ JSON.
- `src/components/QuestionCard.tsx` — UI trắc nghiệm **dùng chung** cho Quiz và Reading; tự giữ state chọn đáp án, báo kết quả lên qua `onAnswer`.
- `src/types.ts` — domain types dùng chung (`VocabCard`, `Reading`, `Question`, `Grade`).

## Quy ước

- TypeScript strict + `noUnusedLocals`/`noUnusedParameters` bật. Code dọn sạch biến/tham số thừa trước khi build.
- Config Vitest nằm ngay trong `vite.config.ts` (cần dòng `/// <reference types="vitest/config" />` ở đầu file để type `test` hợp lệ).
- Project dùng TS project references: `tsconfig.app.json` (code `src/`) và `tsconfig.node.json` (`vite.config.ts`).
- Icon PWA (`public/pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`) được sinh bằng `python3 scripts/make_icons.py` (cần Pillow). Sửa thiết kế trong script đó rồi chạy lại, đừng sửa PNG trực tiếp.
