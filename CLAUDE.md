# CLAUDE.md — Utopia Estate (آژانس املاک اوتوپیا)

## Project Overview

**utopia-state** is a Persian-language real-estate agency website with an integrated Claude AI chatbot. The site targets Iranian users (RTL layout, Farsi content) and lets visitors browse property listings, contact the agency, and chat with an AI assistant powered by the Anthropic API.

**Live architecture:** A single `index.html` file (~2,900 lines) that calls the Anthropic API directly from the browser. A Node.js/Express server (`server.js`) exists as a legacy/optional alternative backend.

---

## Repository Structure

```
utopia-state/
├── index.html        # The entire front-end application (~2,900 lines)
├── server.js         # Legacy Express backend (optional, currently unused)
├── package.json      # Node.js dependencies for the Express server
├── package-lock.json
├── .env.example      # Environment variable template
└── .gitignore
```

No build step, no bundler, no TypeScript — everything is vanilla HTML/CSS/JS with CDN libraries.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JS, HTML5, CSS3 (embedded) |
| UI Language | Persian/Farsi (RTL, `lang="fa" dir="rtl"`) |
| Font | Vazirmatn via Google Fonts |
| Animation | GSAP v3.12.2 + ScrollTrigger, Three.js r128 |
| Database | Supabase (PostgreSQL, loaded via CDN) |
| AI Chatbot | Anthropic Claude API (direct browser fetch) |
| Legacy Backend | Node.js 18+, Express 4, @anthropic-ai/sdk |

---

## Key Sections in index.html

| DOM ID | Purpose |
|---|---|
| `#navbar` | Top navigation bar |
| `#mob-menu` | Mobile hamburger menu |
| `#main-site` | Public site wrapper |
| `#hero` | Hero/landing section with GSAP animation |
| `#f1`, `#f2` | Feature sections with Three.js 3D elements |
| `#listings` | Property listing grid (Supabase-driven) |
| `#contact` | Contact / consultation form |
| `#admin-panel` | Staff login + property management dashboard |
| `#ai-chat-fab` | Floating chatbot trigger button |
| `#ai-chat-panel` | AI chat widget container |
| `#ai-key-setup` | First-run API key entry screen |
| `#ai-chat-msgs` | Message bubble area |

---

## AI Chatbot Implementation

### How It Works

The chatbot makes direct `fetch` calls to `https://api.anthropic.com/v1/messages` using **Server-Sent Events (SSE) streaming**. The user must supply their own Anthropic API key on first use.

**Key constants (inside index.html, ~line 2700+):**

```js
const MODEL  = 'claude-opus-4-8';
const MAX_TOK = 1024;
const HISTORY_LIMIT = 20;          // last N messages sent per request
const STORAGE_KEY = 'utopia_api_key';
```

**Required request header:**
```
anthropic-dangerous-direct-browser-access: true
```
This header is mandatory for browser-originated requests to the Anthropic API.

### API Key Storage

- Stored in `localStorage` under key `utopia_api_key`
- Validated client-side: must start with `sk-`
- `aiSaveKey()` saves; `aiResetKey()` clears

### Chat Functions

| Function | Purpose |
|---|---|
| `toggleAiChat()` | Open / close the chat panel |
| `aiSaveKey()` | Persist API key to localStorage |
| `aiResetKey()` | Clear key and return to setup screen |
| `sendAiMsg()` | Build request, stream response, update UI |
| `addMsg(role, text)` | Render a message bubble |
| `showTyping()` / `hideTyping()` | Typing indicator visibility |

**Keyboard shortcut:** pressing `/` (when not in an input field) toggles the chat panel.

### System Prompt (Persian)

The assistant is instructed to:
- Represent Utopia Estate agency
- Answer only real-estate questions (buying, selling, renting)
- Always respond in Persian unless the user writes in another language
- Keep answers short and practical
- Direct users to contact the agency for specifics

The identical system prompt lives in `server.js` as well.

---

## Legacy Express Server (server.js)

`server.js` is **not used** by the current `index.html` but is kept in the repo. It provides:

- `POST /api/chat` — streaming SSE endpoint that proxies to the Anthropic API server-side
- Uses `ANTHROPIC_API_KEY` from the environment instead of the user's key
- Serves static files from the project root

**When to use it:** If you need to hide the API key from end-users, re-enable the server and update `index.html` to POST to `/api/chat` instead of directly to `api.anthropic.com`.

### Running the Server

```bash
cp .env.example .env
# edit .env — set ANTHROPIC_API_KEY
npm install
npm start        # production
npm run dev      # development (auto-restarts on file save)
```

Server listens on `PORT` env var, defaulting to **3000**.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Server mode only | — | Anthropic API key from console.anthropic.com |
| `PORT` | No | `3000` | Port for Express server |

In standalone-HTML mode neither variable is needed server-side.

---

## Supabase Integration

Supabase is loaded via CDN in `index.html`. The admin panel reads/writes:

- **`listings` table** — property records (type, price, area, city, images, etc.)
- **`users` table** — consultant/staff accounts

Supabase credentials (URL + anon key) are embedded inline in `index.html`. When rotating credentials, update those inline values.

---

## Styling Conventions

All CSS is embedded in `<style>` tags inside `index.html`. Key design tokens:

```css
--gold:        #C9A84C   /* primary accent */
--gold-light:  #E8C96A
--gold-dark:   #6b4f1e
--bg-primary:  #060606
--bg-secondary:#0e0e0e
--bg-card:     #161616
--bg-elevated: #1e1e1e
--text-cream:  #F5F0E8
```

RTL-first: all layout uses `direction: rtl` and Persian text throughout.

---

## Development Workflow

### Editing the Site

All changes go into `index.html`. There is no build step — edit and refresh.

```bash
# Serve locally (optional, for server-mode testing)
npm run dev
# Then open http://localhost:3000
```

For pure HTML changes, open `index.html` directly in a browser or use any static server (`npx serve .`, VS Code Live Server, etc.).

### Adding / Modifying the Chatbot

The chat widget starts around **line 2698** in `index.html`. Look for:
```html
<!-- AI Chat Widget -->
```
All chat HTML, CSS, and JS is self-contained in that block.

### Branching Strategy

There is no enforced branching convention beyond what Claude Code sessions use. Feature branches follow the pattern `claude/<feature-name>-<id>`.

### Commit Style

Commits so far use imperative present tense:
- `"Add Claude AI chatbot to Utopia Estate website"`
- `"Switch to standalone HTML: call Anthropic API directly from browser"`

---

## Important Constraints

1. **No build tooling** — do not introduce webpack, vite, or TypeScript without discussing it first. The project intentionally avoids a build step.
2. **Single-file frontend** — all public-facing code lives in `index.html`. Resist splitting unless the file grows unmanageable.
3. **RTL/Persian first** — any new UI must work correctly in RTL layout with Farsi text. Test with the Vazirmatn font loaded.
4. **API key is user-supplied** — the browser chatbot never bundles a secret key. The key lives only in `localStorage`. Do not change this without deliberate intent to switch to server mode.
5. **Message history cap** — the chatbot trims history to the last 20 messages before each API call. Keep this limit in place to control API costs.
6. **`anthropic-dangerous-direct-browser-access: true`** — this header must be present on every direct browser-to-Anthropic request. Without it, requests will be rejected.

---

## No Tests, No CI

There are currently no automated tests and no CI/CD pipeline. Verification is manual:
- Open `index.html` in a browser
- Test chatbot with a valid Anthropic API key
- Check admin panel login flow
- Verify listing grid loads from Supabase
