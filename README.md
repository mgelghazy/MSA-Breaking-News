# MSA — غرفة الأخبار / News Desk

Internal tool for MSA (Metal Service Agency). Paste breaking news in Arabic, clean and
paraphrase it, then export branded Instagram Story (1080×1920) and Feed (1080×1080) images
in gold or silver. Built by Endorphins Art Labs.

- `index.html` — the whole app. Fonts load from Google Fonts; the logos are embedded, so
  there are no other assets to host.
- `worker.js` — Cloudflare Worker that holds the API key so the browser never sees it.

---

## 1. Publish the page

1. Create a repo (public is fine — nothing secret lives in these files).
2. Upload `index.html` to the root.
3. **Settings → Pages → Source: Deploy from a branch → `main` / `root` → Save.**
4. After a minute the site is live at `https://USERNAME.github.io/REPO/`.

At this point everything works except the text cleaning, which needs step 2.

## 2. Deploy the proxy

1. In the Cloudflare dashboard: **Workers & Pages → Create → Worker.** Name it something
   like `msa-news-desk-api` and deploy the starter.
2. **Edit code**, replace everything with the contents of `worker.js`, and put your Pages
   origin in `ALLOWED_ORIGINS` — origin only, no path:
   `https://USERNAME.github.io`
3. Deploy.
4. **Settings → Variables and Secrets → Add → Secret**, named exactly
   `ANTHROPIC_API_KEY`, value = your key from `console.anthropic.com`. Deploy again.
5. Copy the Worker URL (`https://msa-news-desk-api.<subdomain>.workers.dev`).

Prefer the CLI? `npx wrangler deploy` then
`npx wrangler secret put ANTHROPIC_API_KEY` — `wrangler.toml` is included.

## 3. Connect the two

In `index.html`, line 12 — the only line you ever need to touch — paste the Worker URL:

```html
<meta name="msa-proxy-url" content="https://msa-news-desk-api.<subdomain>.workers.dev">
```

Commit. Pages redeploys in about a minute. Open the site — the **المحرّر** lamp in the
header turns green after the first successful correction.

## Custom domain

Point a subdomain (e.g. `news.your-domain.com`) at Pages in **Settings → Pages → Custom
domain**, then add that same origin to `ALLOWED_ORIGINS` in the Worker and redeploy.
Both origins can stay in the list.

---

## How it behaves

The app picks a route in this order:

1. A personal key pasted into the **المحرّر** panel (session only, never stored) — overrides everything.
2. `PROXY_URL`, if set — the normal path once deployed.
3. A direct call, which only works while the file runs inside Claude.

If none of them work, the app still runs: it applies a basic spacing and punctuation tidy,
tells you the editor is offline, and lets you correct the text by hand. Generating and
downloading the images is fully offline — no network needed.

## Model and cost

The tool runs on Claude Sonnet 4.6 — the balanced choice: strong enough on Arabic editing
to keep mistakes rare, without Opus pricing. Roughly half a US cent per news item.

Nothing about tokens or cost appears in the interface; it is deliberately kept out of the
editor's way. Check actual spend in the Anthropic console under Usage, and set a monthly
budget alert there while you're at it.

To change models, edit `MODEL` in `index.html`. `worker.js` already allows Sonnet 4.6 and
Haiku 4.5, so nothing else needs redeploying.

## Guards in the Worker

- Requests are rejected unless the `Origin` is in `ALLOWED_ORIGINS`.
- Only the model this tool uses is allowed through.
- `max_tokens` is capped at 1500 and payloads over 8000 characters are refused.

These stop a stray copy of the page — or anyone who finds the Worker URL — from running up
your API bill. Rotate the key in the Cloudflare dashboard if it ever leaks; nothing needs
to change in the page.

## Editorial rule

The tool corrects grammar, improves wording, paraphrases, and formats. It does not verify
whether a story is true and never invents facts, sources, numbers, names, or dates. If the
input is ambiguous, the ambiguity is preserved. Accuracy stays with the editor.
