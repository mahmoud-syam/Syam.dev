// SYAM.DEV course on learn.mahmoud-syam.me.
// - Site files are deployed with the Worker as static assets (Cloudflare builds from GitHub on
//   every push). If no ASSETS binding exists, they are fetched from ORIGIN instead.
// - /api/* is protected by Cloudflare Access (e-mail code login); this Worker verifies the
//   Access token and reads/writes one progress row per user in D1.
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

let certCache = { at: 0, keys: null };
async function accessKeys(team) {
  if (certCache.keys && Date.now() - certCache.at < 3600e3) return certCache.keys;
  const r = await fetch(`https://${team}/cdn-cgi/access/certs`);
  const { keys } = await r.json();
  certCache = { at: Date.now(), keys };
  return keys;
}
const b64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));

// Returns the signed-in user's e-mail, or null.
async function userFromAccess(req, env) {
  const cookie = (req.headers.get('cookie') || '').match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  const token = req.headers.get('cf-access-jwt-assertion') || (cookie && cookie[1]);
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null;
  const [h, p, sig] = token.split('.');
  if (!sig) return null;
  const header = JSON.parse(new TextDecoder().decode(b64url(h)));
  const payload = JSON.parse(new TextDecoder().decode(b64url(p)));
  const jwk = (await accessKeys(env.ACCESS_TEAM_DOMAIN)).find(k => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64url(sig), new TextEncoder().encode(`${h}.${p}`));
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!ok || !aud.includes(env.ACCESS_AUD) || payload.exp * 1000 < Date.now() || payload.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) return null;
  return (payload.email || '').toLowerCase() || null;
}

async function site(req, env, url) {
  if (env.ASSETS) return env.ASSETS.fetch(req);
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
  // On GitHub Pages index.html only redirects here; the real page is app.html.
  const path = url.pathname === '/' || url.pathname === '/index.html' ? '/app.html' : url.pathname;
  const r = await fetch(env.ORIGIN + path, { cf: { cacheTtl: 120, cacheEverything: true } });
  const res = new Response(r.status === 404 ? 'Not found' : r.body, r);
  res.headers.set('x-content-type-options', 'nosniff');
  res.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  res.headers.set('cache-control', path.endsWith('.html') || path === '/sw.js' ? 'no-cache' : 'public, max-age=3600');
  ['x-github-request-id', 'x-fastly-request-id', 'x-served-by', 'x-cache', 'x-cache-hits', 'x-timer', 'via', 'access-control-allow-origin'].forEach(h => res.headers.delete(h));
  return res;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return site(req, env, url);

    const email = await userFromAccess(req, env);
    if (url.pathname === '/api/login') return Response.redirect(`${url.origin}/#home`, 302);
    if (url.pathname === '/api/logout') return Response.redirect(`${url.origin}/cdn-cgi/access/logout`, 302);
    if (!email) return json({ error: 'not signed in' }, 401);

    const now = Date.now();
    await env.DB.prepare('INSERT INTO users (email, created_at, last_seen) VALUES (?1, ?2, ?2) ON CONFLICT(email) DO UPDATE SET last_seen = ?2').bind(email, now).run();

    if (url.pathname === '/api/me') return json({ email });

    if (url.pathname === '/api/progress') {
      if (req.method === 'GET') {
        const row = await env.DB.prepare('SELECT data, updated_at FROM progress WHERE email = ?1').bind(email).first();
        return json(row ? { data: JSON.parse(row.data), updated_at: row.updated_at } : { data: null });
      }
      if (req.method === 'PUT') {
        const body = await req.text();
        if (body.length > 200000) return json({ error: 'too large' }, 413);
        let data; try { data = JSON.parse(body); } catch { return json({ error: 'bad json' }, 400); }
        if (!data || typeof data !== 'object' || typeof data.done !== 'object') return json({ error: 'bad progress' }, 400);
        await env.DB.prepare('INSERT INTO progress (email, data, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(email) DO UPDATE SET data = ?2, updated_at = ?3').bind(email, JSON.stringify(data), now).run();
        return json({ ok: true, updated_at: now });
      }
      return json({ error: 'method not allowed' }, 405);
    }
    return json({ error: 'not found' }, 404);
  }
};
