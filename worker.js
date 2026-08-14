/**
 * MSA News Desk — API proxy
 *
 * Sits between the GitHub Pages site and the Claude API so the API key never
 * reaches the browser. Deploy on Cloudflare Workers (free tier is plenty).
 *
 * Setup:
 *   1. Put your Pages URL(s) in ALLOWED_ORIGINS below.
 *   2. Add the key as a secret named ANTHROPIC_API_KEY (never hardcode it here).
 *   3. Paste the deployed Worker URL into PROXY_URL at the top of index.html.
 */

const ALLOWED_ORIGINS = [
  "https://USERNAME.github.io",        // ← your GitHub Pages origin
  // "https://news.your-domain.com",   // ← add a custom domain when you point one here
];

const ALLOWED_MODELS = new Set([
  "claude-sonnet-4-6",           // what the tool uses
  "claude-haiku-4-5-20251001",   // kept so you can switch down without editing this file
]);
const MAX_TOKENS_CAP = 1500;   // this tool never needs more
const MAX_PROMPT_CHARS = 8000; // one news item, not a novel

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = ALLOWED_ORIGINS.includes(origin);
    const cors = {
      "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST")    return json({ error: "Method not allowed" }, 405, cors);
    if (!allowed)                     return json({ error: "Origin not allowed" }, 403, cors);
    if (!env.ANTHROPIC_API_KEY)       return json({ error: "Server missing ANTHROPIC_API_KEY" }, 500, cors);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid JSON" }, 400, cors); }

    // Only let through the exact shape this tool sends.
    if (!ALLOWED_MODELS.has(body.model))  return json({ error: "Model not allowed" }, 400, cors);
    if (!Array.isArray(body.messages))    return json({ error: "messages[] required" }, 400, cors);
    const size = JSON.stringify(body.messages).length;
    if (size > MAX_PROMPT_CHARS)          return json({ error: "Request too large" }, 413, cors);

    const payload = {
      model: body.model,
      max_tokens: Math.min(Number(body.max_tokens) || 1000, MAX_TOKENS_CAP),
      messages: body.messages,
    };

    let upstream;
    try {
      upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      return json({ error: "Upstream unreachable" }, 502, cors);
    }

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { ...cors, "content-type": "application/json" },
    });
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}
