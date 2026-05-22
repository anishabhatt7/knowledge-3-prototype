# Agent guidelines — Design System 2 Starter Kit

This repository is a **starter template** for prototyping Salesforce-aligned UIs locally. It uses **LWC** (Lightning Web Components), **Vite**, **SLDS** (Salesforce Lightning Design System), and **lightning-base-components**, with synthetic shadow DOM and client-side routing.

---

## Project-specific guidance

### Where to put code

- **Route-level views** — `src/modules/page/<name>/` → tag `page-<name>`. Register routes in `src/routes.config.js`, wire the component in `src/router.js`, and register in `src/modules/shell/app/app.js` (`ROUTE_COMPONENTS`; optionally `ROUTE_TO_NAV_PAGE` / `NAV_PAGE_TO_PATH` for nav).
- **Reusable UI** — `src/modules/ui/<name>/` → tag `ui-<name>`. Use inside pages or other components.
- **App shell** — `src/modules/shell/<name>/` → tag `shell-`*. Root app, layout, header, nav, theme—not route views (`page-`*) and not generic reusable widgets (`ui-*`).
- **Do not** add components under `src/build/lightning-icon/shims/` except the checked-in icon overrides, or under `src/modules/lightning/`.

### SLDS linter

After you change any `.html` or `.css` file, run the SLDS linter on each file you touched before considering the task complete:

```bash
npx @salesforce-ux/slds-linter@latest lint <path-to-changed-file>
```

Fix reported issues where possible. If something cannot be fixed, say so briefly. Re-run lint until clean or remaining issues are explained.

### Engineering habits

- Prefer small, single-responsibility LWCs and readable structure.
- Do not use `!important`.
- Do not use inline `style` attributes; use utility classes or the component’s CSS file as appropriate.

### LWC troubleshooting

If LWC or local tooling issues need platform-aware help, use the **Salesforce DX** MCP and its tools selectively.

### Modals (this repo)

Extend `lightning/modal` and follow `**src/modules/ui/demoModal/`** as the reference (header, body, footer slots; open via `MyModal.open({ size, label })`). Do not build modals from raw `slds-modal` markup.

### Deployment (GitHub Pages)

- **Only path:** **`npm run deploy`** — runs **`build:gh-pages`** (hash routing for static hosting), then pushes **`dist/`** to **`gh-pages`** on **`origin`**. Default **`npm run build`** / **`npm run dev`** keep path-based routing. GitHub Pages **Source** must be **Deploy from a branch** → **`gh-pages`** (see README). There is no Actions-based Pages deploy in this repo.
- For another push target, `gh-pages` accepts **`-o <remote>`** or **`-r <url>`**; mention when the user asks.
