# RustDesk API Web

Modern admin frontend for [RustDesk API](https://github.com/WeiYusc/rustdesk-api).

## Tech Stack

- Vue 3.5 + TypeScript 5 (strict)
- Naive UI 2.x
- UnoCSS
- Vite 6
- Pinia 2
- Vue Router 4 (hash mode)
- Vue I18n 11 (7 languages: en/zh-CN/zh-TW/fr/ko/ru/es)
- axios

## Features

- **Modern UI**: Clean, elegant design with Naive UI, dark mode support
- **Role-based access**: Admin and regular user menus automatically filtered
- **i18n**: 7 languages with full translation
- **Responsive**: Desktop sidebar, mobile drawer, 4 breakpoints
- **Security**: CSP enabled, no v-html, marked output sanitized
- **Pages**:
  - Auth: Login (password + captcha + OIDC), Register, OAuth bind
  - My: Personal info, Peer, Address book collection + rules, Address book, Tags, Share records, Login log
  - Admin: User management + tokens, Groups, Device groups, Tags, Address book collections + rules, Address books (with shareByWebClient), Peers, OAuth, Login log, Connection/File audit, Share records, Server commands (simple/advanced)

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

Output is in `dist/`.

### Deploy to backend

```bash
# Option 1: Use sync script
bash scripts/sync-admin.sh

# Option 2: Manual copy
cp -r dist/* ../rustdesk-api/resources/admin/
```

The backend serves the frontend at `/_admin/` via Gin's `StaticFS`.

## License

[MIT](./LICENSE)
