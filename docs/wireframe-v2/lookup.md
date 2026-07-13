# Wireframe Lookup Reference

Mapping of wireframe HTML files to Astro component files (verified 2026-07-12).

## Input Wireframes → Astro Pages

| Wireframe    | File                                        | Astro Component                                          | Status |
| ------------ | ------------------------------------------- | -------------------------------------------------------- | ------ |
| 1-dashboard  | `docs/wireframe-v2/input/1-dashboard.html`  | `site/src/pages/dashboard/index.astro`                   | EXISTS |
| 2-akun       | `docs/wireframe-v2/input/2-akun.html`       | `site/src/pages/dashboard/for/accounts/index.astro`      | EXISTS |
| 3-kamar      | `docs/wireframe-v2/input/3-kamar.html`      | `site/src/pages/dashboard/for/rooms/index.astro`         | EXISTS |
| 4-penghuni   | `docs/wireframe-v2/input/4-penghuni.html`   | `site/src/pages/dashboard/for/tenants/index.astro`       | EXISTS |
| 5-komplain   | `docs/wireframe-v2/input/5-komplain.html`   | `site/src/pages/dashboard/for/complaints/index.astro`    | EXISTS |
| 6-transaksi  | `docs/wireframe-v2/input/6-transaksi.html`  | `site/src/pages/dashboard/for/transactions/index.astro`  | EXISTS |
| 7-notifikasi | `docs/wireframe-v2/input/7-notifikasi.html` | `site/src/pages/dashboard/for/notifications/index.astro` | EXISTS |
| 8-chatbot    | `docs/wireframe-v2/input/8-chatbot.html`    | `site/src/pages/dashboard/for/chatbot/index.astro`       | EXISTS |
| 9-audit      | `docs/wireframe-v2/input/9-audit.html`      | `site/src/pages/dashboard/for/audit/index.astro`         | EXISTS |
| 10-login     | `docs/wireframe-v2/input/10-login.html`     | `site/src/pages/login/index.astro`                       | EXISTS |

## Output Wireframes → Report Pages

| Wireframe            | File                                                 | Astro Component                                                | Status                 |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------- | ---------------------- |
| 1-laporan-penghuni   | `docs/wireframe-v2/output/1-laporan-penghuni.html`   | `site/src/pages/dashboard/for/tenants/report/html.astro`       | EXISTS                 |
| 2-laporan-kamar      | `docs/wireframe-v2/output/2-laporan-kamar.html`      | `site/src/pages/dashboard/for/rooms/report/html.astro`         | EXISTS                 |
| 3-laporan-komplain   | `docs/wireframe-v2/output/3-laporan-komplain.html`   | `site/src/pages/dashboard/for/complaints/report/html.astro`    | EXISTS                 |
| 4-laporan-transaksi  | `docs/wireframe-v2/output/4-laporan-transaksi.html`  | `site/src/pages/dashboard/for/transactions/report/html.astro`  | EXISTS                 |
| 5-laporan-notifikasi | `docs/wireframe-v2/output/5-laporan-notifikasi.html` | `site/src/pages/dashboard/for/notifications/report/html.astro` | EXISTS                 |
| 6-laporan-chatbot    | `docs/wireframe-v2/output/6-laporan-chatbot.html`    | `site/src/pages/dashboard/for/chatbot/report/html.astro`       | EXISTS                 |
| 7-laporan-audit      | `docs/wireframe-v2/output/7-laporan-audit.html`      | `site/src/pages/dashboard/for/audit/report/html.astro`         | EXISTS                 |
| 8-invoice            | `docs/wireframe-v2/output/8-invoice.html`            | `site/src/pages/invoice/[id]/index.astro`                      | EXISTS (dynamic route) |

## Summary

- **10/10 input wireframes** → corresponding `index.astro` pages exist
- **8/8 output wireframes** → corresponding report/invoice pages exist
- All paths verified in codebase
- Invoice uses dynamic route `[id]` for per-invoice generation
- All dashboard reports follow pattern: `{module}/report/html.astro`
