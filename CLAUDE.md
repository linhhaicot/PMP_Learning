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

**IndexedDB (qua Dexie) là nguồn sự thật duy nhất cho CẢ nội dung lẫn trạng thái học** — đây là điểm quan trọng nhất. Schema ở `src/db/schema.ts` (5 bảng, version 2): `vocab`, `readings` (nội dung) + `progress`, `reviews`, `daily` (trạng thái người học).

**Luồng nội dung (import):** người dùng tự đẩy nội dung bằng Markdown, KHÔNG sửa JSON trong repo.
- `src/import/parseMarkdown.ts` — parser **thuần, không I/O**, theo đúng mẫu `public/templates/content-template.md`. Parser **chặt**: gì không khớp mẫu thành lỗi kèm số dòng, không đoán. Mọi thay đổi parser phải đồng bộ với template (có test `parseMarkdown.test.ts` parse chính template đó để chống lệch).
- `src/db/importContent.ts` — `preview()` (parse, không ghi) / `commit()` (ghi đè theo `id` slug) / `clearContent()`. Id slug ổn định nên re-import giữ nguyên tiến độ SRS.
- `public/data/*.json` chỉ là **seed demo**, nạp một lần vào Dexie bởi `src/db/seed.ts` (`seedIfEmpty()`, gọi ở `main.tsx` trước khi render) khi bảng trống — sau đó không bao giờ đè nội dung đã import.

**Mọi tương tác có chấm điểm phải đi qua `src/db/reviews.ts`** — lớp ghi duy nhất. `gradeFlashcard()` và `logAnswer()` cập nhật SRS + review log + thống kê ngày **trong cùng một Dexie transaction**. Không ghi thẳng vào các bảng từ component.

**Thuật toán SRS** (`src/srs/sm2.ts`) là module **thuần, không I/O** (SM-2, kiểu Anki). Nhận `now` như tham số (không đọc đồng hồ) để test tất định. Mọi thay đổi lịch ôn tập đều ở đây và phải có test (`sm2.test.ts`) đi kèm.

**UI reactive**: các trang đọc nội dung qua `useLiveQuery` (dexie-react-hooks) → tự cập nhật ngay sau khi import hoặc ghi review, không truyền state thủ công. Trang nào trống nội dung sẽ hiện empty-state dẫn tới `/import`.

### Bố cục

- `src/router.tsx` — bảng route duy nhất; 5 tính năng (4 học + Nhập) là route con dưới `AppLayout` (tab bar dưới cùng). Dùng **`createHashRouter`** (URL dạng `/#/...`) để chạy được khi deploy ở subpath GitHub Pages mà không cần SPA fallback.
- `src/features/{flashcards,quiz,reading,progress,import}/` — mỗi tính năng một trang. Quiz sinh câu hỏi trắc nghiệm **on-the-fly** từ bộ từ vựng (shuffle tất định theo index); Reading lấy câu hỏi từ Dexie.
- `src/components/QuestionCard.tsx` — UI trắc nghiệm **dùng chung** cho Quiz và Reading; tự giữ state chọn đáp án, báo kết quả lên qua `onAnswer`.
- `src/types.ts` — domain types dùng chung (`VocabCard`, `Reading`, `Question`, `Grade`).

## Quy ước

- TypeScript strict + `noUnusedLocals`/`noUnusedParameters` bật. Code dọn sạch biến/tham số thừa trước khi build.
- Config Vitest nằm ngay trong `vite.config.ts` (cần dòng `/// <reference types="vitest/config" />` ở đầu file để type `test` hợp lệ).
- Project dùng TS project references: `tsconfig.app.json` (code `src/`) và `tsconfig.node.json` (`vite.config.ts`).
- Icon PWA (`public/pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`) được sinh bằng `python3 scripts/make_icons.py` (cần Pillow). Sửa thiết kế trong script đó rồi chạy lại, đừng sửa PNG trực tiếp.
- **Đường dẫn runtime phải prefix `import.meta.env.BASE_URL`** (vd `fetch` trong `seed.ts`, link tải template trong `ImportPage`). Base là `/` ở local nhưng `/<repo>/` trên GitHub Pages; literal `/data/...` sẽ 404 ở subpath. Asset trong `index.html` thì Vite tự rewrite.

## Deploy

GitHub Pages qua `.github/workflows/deploy.yml` (push lên `main`). Workflow set `VITE_BASE=/<repo>/` để build đúng subpath; `vite.config.ts` đọc `process.env.VITE_BASE` (mặc định `/`). Bật Pages: Settings → Pages → Source = **GitHub Actions**.
