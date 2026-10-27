<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Заметки проекта (Next 16.4)

- Сборка статическая: `output: 'export'` → папка `out/`. Не использовать Route Handlers с Request, `redirects`/`headers` в next.config, ISR, Proxy (бывший middleware), стандартный loader next/image, Server Actions, cookies.
- Динамические маршруты — только с `generateStaticParams` и `dynamicParams = false`.
- Картинки — свой компонент `<Picture>` и файлы из `scripts/media.mjs`.
- Шрифты next/font/google — всегда с subset `cyrillic-ext` (кыргызские ң, ө, ү).
- Комментарии — по-русски, коротко, объясняют «почему».
- Себестоимость и остатки со склада в репозиторий не попадают.
