# RustDesk API Web

Modern admin frontend for [RustDesk API](https://github.com/WeiYusc/rustdesk-api).

## Tech Stack

- Vue 3.5 + TypeScript 5 (strict)
- Naive UI 2.x
- UnoCSS
- Vite 6
- Pinia 2
- Vue Router 4 (hash mode)
- Vue I18n 9 (7 languages)
- axios

## Prerequisites

- Node.js >= 20
- pnpm (enable via `corepack enable pnpm`)

## Development

```bash
pnpm install
pnpm dev
```

The dev server proxies `/api` to `http://127.0.0.1:21114` by default.
Override via a local `.env` file:

```
VITE_PROXY_TARGET=http://your-backend:21114
```

## Build

```bash
pnpm build
```

Output is in `dist/`. Copy `dist/` contents to the backend's `resources/admin/`
directory to serve via `/_admin/`.

## License

[MIT](./LICENSE)
