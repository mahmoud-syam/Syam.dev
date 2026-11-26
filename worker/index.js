// SYAM Academy on learn.mahmoud-syam.me
// - The whole site is behind Cloudflare Access (e-mail code login). This Worker verifies the
//   Access token, serves the site files and runs the API below.
// - Site files: the ASSETS binding when deployed with assets, otherwise fetched from ORIGIN
//   (GitHub Pages, where index.html only redirects here and the real page is app.html).
// - Data lives in D1: users, progress (interactive course), tracks, courses, modules, lessons,
//   user_lessons (done / notes / saved / video position per user).

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});
const bad = (msg, status = 400) => json({ error: msg }, status);

// ---------- Access token ----------
let certCache = { at: 0, keys: null };
async function accessKeys(team) {
  if (certCache.keys && Date.now() - certCache.at < 3600e3) return certCache.keys;
  const r = await fetch(`https://${team}/cdn-cgi/access/certs`);
  const { keys } = await r.json();
  certCache = { at: Date.now(), keys };
  return keys;
}
const b64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));

async function userFromAccess(req, env, url) {
  // Local development only (wrangler dev on localhost with DEV_EMAIL set).
  if (env.DEV_EMAIL && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) return env.DEV_EMAIL;
  const cookie = (req.headers.get('cookie') || '').match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  const token = req.headers.get('cf-access-jwt-assertion') || (cookie && cookie[1]);
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null;
  try {
    const [h, p, sig] = token.split('.');
    const header = JSON.parse(new TextDecoder().decode(b64url(h)));
    const payload = JSON.parse(new TextDecoder().decode(b64url(p)));
    const jwk = (await accessKeys(env.ACCESS_TEAM_DOMAIN)).find(k => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64url(sig), new TextEncoder().encode(`${h}.${p}`));
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!ok || !aud.includes(env.ACCESS_AUD) || payload.exp * 1000 < Date.now() || payload.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) return null;
    return (payload.email || '').toLowerCase() || null;
  } catch { return null; }
}
// Admins: users.role = 'admin' in D1 (or ADMIN_EMAILS for local development).
const isAdmin = (env, email, role) => role === 'admin' || (env.ADMIN_EMAILS || '').toLowerCase().split(/[\s,]+/).includes(email);

// ---------- Site files ----------
async function site(req, env, url) {
  if (env.ASSETS) return env.ASSETS.fetch(req);
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
  const path = url.pathname === '/' || url.pathname === '/index.html' ? '/app.html' : url.pathname;
  const r = await fetch(env.ORIGIN + path, { cf: { cacheTtl: 60, cacheEverything: true } });
  const res = new Response(r.status === 404 ? 'Not found' : r.body, r);
  res.headers.delete('content-length');
  res.headers.set('x-content-type-options', 'nosniff');
  res.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  res.headers.set('cache-control', path.endsWith('.html') || path === '/sw.js' ? 'no-cache' : 'public, max-age=3600');
  ['x-github-request-id', 'x-fastly-request-id', 'x-served-by', 'x-cache', 'x-cache-hits', 'x-timer', 'via', 'access-control-allow-origin'].forEach(h => res.headers.delete(h));
  return res;
}

// ---------- Field checks ----------
const TYPES = ['video', 'reading', 'lab', 'link', 'quiz'];
const PROVIDERS = ['youtube', 'udemy', 'microsoft-learn', 'coursera', 'aws-skill-builder', 'book', 'other'];
const str = (v, max, def = '') => (v === undefined || v === null ? def : String(v).trim().slice(0, max));
const int = (v, def = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : def; };
const bool = (v, def = 1) => (v === undefined ? def : v ? 1 : 0);
function link(v) { const s = str(v, 1000); if (!s) return ''; try { const u = new URL(s); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch { return ''; } }
function links(v) {
  let a = v; if (typeof a === 'string') { try { a = JSON.parse(a); } catch { a = []; } }
  return JSON.stringify((Array.isArray(a) ? a : []).slice(0, 30).map(x => ({ title: str(x && x.title, 200), url: link(x && x.url) })).filter(x => x.url));
}
const color = v => (/^#[0-9a-f]{6}$/i.test(v || '') ? v : '#2f86ce');
const newId = p => p + '_' + crypto.randomUUID().replace(/-/g, '').slice(0, 10);

const KINDS = {
  tracks: { parent: null, fields: b => ({ title: str(b.title, 120), description: str(b.description, 600), color: color(b.color) }) },
  courses: { parent: 'track_id', parentTable: 'tracks', fields: b => ({ title: str(b.title, 160), description: str(b.description, 2000), provider: PROVIDERS.includes(b.provider) ? b.provider : 'other', url: link(b.url), level: str(b.level, 40), published: bool(b.published) }) },
  modules: { parent: 'course_id', parentTable: 'courses', fields: b => ({ title: str(b.title, 160) }) },
  lessons: { parent: 'module_id', parentTable: 'modules', fields: b => ({ title: str(b.title, 200), type: TYPES.includes(b.type) ? b.type : 'video', url: link(b.url), minutes: Math.max(0, Math.min(int(b.minutes), 1000)), body: str(b.body, 60000), links: links(b.links), published: bool(b.published) }) }
};

async function createRow(env, kind, b) {
  const K = KINDS[kind], f = K.fields(b), now = Date.now();
  if (!f.title) throw new Error('Title is required');
  if (K.parent) {
    const pid = str(b[K.parent], 40);
    const p = await env.DB.prepare(`SELECT id FROM ${K.parentTable} WHERE id = ?1`).bind(pid).first();
    if (!p) throw new Error('Parent not found');
    f[K.parent] = pid;
  }
  const where = K.parent ? ` WHERE ${K.parent} = ?1` : '';
  const max = await env.DB.prepare(`SELECT COALESCE(MAX(sort), -1) AS m FROM ${kind}${where}`).bind(...(K.parent ? [f[K.parent]] : [])).first();
  const row = { id: newId(kind[0]), ...f, sort: (max ? max.m : -1) + 1, created_at: now, updated_at: now };
  const cols = Object.keys(row);
  await env.DB.prepare(`INSERT INTO ${kind} (${cols.join(',')}) VALUES (${cols.map((_, i) => '?' + (i + 1)).join(',')})`).bind(...cols.map(c => row[c])).run();
  return row;
}

async function updateRow(env, kind, id, b) {
  const K = KINDS[kind];
  const cur = await env.DB.prepare(`SELECT * FROM ${kind} WHERE id = ?1`).bind(id).first();
  if (!cur) throw new Error('Not found');
  const merged = { ...cur, ...b };
  if (kind === 'lessons' && b.links === undefined) merged.links = cur.links;
  const f = K.fields(merged);
  if (!f.title) throw new Error('Title is required');
  if (K.parent && b[K.parent] && b[K.parent] !== cur[K.parent]) {
    const p = await env.DB.prepare(`SELECT id FROM ${K.parentTable} WHERE id = ?1`).bind(b[K.parent]).first();
    if (!p) throw new Error('Parent not found');
    f[K.parent] = b[K.parent];
  }
  f.updated_at = Date.now();
  const cols = Object.keys(f);
  await env.DB.prepare(`UPDATE ${kind} SET ${cols.map((c, i) => c + ' = ?' + (i + 1)).join(', ')} WHERE id = ?${cols.length + 1}`).bind(...cols.map(c => f[c]), id).run();
  return { ...cur, ...f };
}

async function deleteRow(env, kind, id) {
  // Delete children explicitly (do not depend on foreign-key settings).
  const s = [];
  if (kind === 'tracks') {
    s.push(env.DB.prepare('DELETE FROM user_lessons WHERE lesson_id IN (SELECT l.id FROM lessons l JOIN modules m ON l.module_id = m.id JOIN courses c ON m.course_id = c.id WHERE c.track_id = ?1)').bind(id));
    s.push(env.DB.prepare('DELETE FROM lessons WHERE module_id IN (SELECT m.id FROM modules m JOIN courses c ON m.course_id = c.id WHERE c.track_id = ?1)').bind(id));
    s.push(env.DB.prepare('DELETE FROM modules WHERE course_id IN (SELECT id FROM courses WHERE track_id = ?1)').bind(id));
    s.push(env.DB.prepare('DELETE FROM courses WHERE track_id = ?1').bind(id));
  }
  if (kind === 'courses') {
    s.push(env.DB.prepare('DELETE FROM user_lessons WHERE lesson_id IN (SELECT l.id FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = ?1)').bind(id));
    s.push(env.DB.prepare('DELETE FROM lessons WHERE module_id IN (SELECT id FROM modules WHERE course_id = ?1)').bind(id));
    s.push(env.DB.prepare('DELETE FROM modules WHERE course_id = ?1').bind(id));
  }
  if (kind === 'modules') {
    s.push(env.DB.prepare('DELETE FROM user_lessons WHERE lesson_id IN (SELECT id FROM lessons WHERE module_id = ?1)').bind(id));
    s.push(env.DB.prepare('DELETE FROM lessons WHERE module_id = ?1').bind(id));
  }
  if (kind === 'lessons') s.push(env.DB.prepare('DELETE FROM user_lessons WHERE lesson_id = ?1').bind(id));
  s.push(env.DB.prepare(`DELETE FROM ${kind} WHERE id = ?1`).bind(id));
  await env.DB.batch(s);
}

// ---------- Catalog ----------
async function catalog(env, admin) {
  const pub = admin ? '' : ' WHERE published = 1';
  const [t, c, m, l] = await env.DB.batch([
    env.DB.prepare('SELECT * FROM tracks ORDER BY sort, created_at'),
    env.DB.prepare(`SELECT * FROM courses${pub} ORDER BY sort, created_at`),
    env.DB.prepare('SELECT * FROM modules ORDER BY sort, created_at'),
    env.DB.prepare(`SELECT * FROM lessons${pub} ORDER BY sort, created_at`)
  ]);
  const lessons = l.results.map(x => ({ ...x, links: JSON.parse(x.links || '[]') }));
  return { tracks: t.results, courses: c.results, modules: m.results, lessons, at: Date.now() };
}

// ---------- Link helpers for the dashboard ----------
async function linkInfo(u) {
  const url = link(u);
  if (!url) throw new Error('Enter a full link that starts with https://');
  const host = new URL(url).hostname.replace(/^www\./, '');
  if (/(^|\.)youtube\.com$|^youtu\.be$/.test(host)) {
    const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(url));
    if (r.ok) { const j = await r.json(); return { title: j.title, author: j.author_name, provider: 'youtube', type: 'video' }; }
  }
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; SYAM-Academy/1.0)', accept: 'text/html' }, redirect: 'follow' });
  const html = (await r.text()).slice(0, 400000);
  const pick = re => { const m = html.match(re); return m ? m[1].replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').trim() : ''; };
  const title = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i) || pick(/<title[^>]*>([^<]+)<\/title>/i);
  const provider = /udemy\.com$/.test(host) ? 'udemy' : /learn\.microsoft\.com$/.test(host) ? 'microsoft-learn' : /coursera\.org$/.test(host) ? 'coursera' : 'other';
  return { title: title.slice(0, 200), provider, type: provider === 'microsoft-learn' ? 'reading' : 'link' };
}

async function playlist(u) {
  const url = link(u);
  const id = url && new URL(url).searchParams.get('list');
  if (!id) throw new Error('Paste a YouTube playlist link (it has list= in it)');
  const r = await fetch('https://www.youtube.com/playlist?list=' + encodeURIComponent(id) + '&hl=en', { headers: { 'accept-language': 'en-US,en;q=0.9', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' } });
  const html = await r.text();
  const m = html.match(/var ytInitialData = (\{.+?\});<\/script>/s) || html.match(/ytInitialData"\]\s*=\s*(\{.+?\});/s);
  if (!m) throw new Error('Could not read this playlist. Is it public?');
  const data = JSON.parse(m[1]);
  const out = [], seen = new Set();
  (function walk(o) {
    if (!o || typeof o !== 'object') return;
    const v = o.playlistVideoRenderer;
    if (v && v.videoId && !seen.has(v.videoId)) {
      seen.add(v.videoId);
      const title = (v.title && (v.title.simpleText || (v.title.runs || []).map(x => x.text).join(''))) || 'Video';
      out.push({ title, url: 'https://www.youtube.com/watch?v=' + v.videoId, minutes: Math.max(1, Math.round(int(v.lengthSeconds) / 60)), type: 'video' });
    }
    const lv = o.lockupViewModel; // newer YouTube layout
    if (lv && lv.contentId && /VIDEO/.test(lv.contentType || '') && !seen.has(lv.contentId)) {
      seen.add(lv.contentId);
      const t = lv.metadata && lv.metadata.lockupMetadataViewModel && lv.metadata.lockupMetadataViewModel.title;
      const badge = JSON.stringify(lv.contentImage || {}).match(/"text":"(\d+(?::\d{2}){1,2})"/);
      let minutes = 0;
      if (badge) { const n = badge[1].split(':').map(Number); const sec = n.length === 3 ? n[0] * 3600 + n[1] * 60 + n[2] : n[0] * 60 + n[1]; minutes = Math.max(1, Math.round(sec / 60)); }
      out.push({ title: (t && t.content) || 'Video', url: 'https://www.youtube.com/watch?v=' + lv.contentId, minutes, type: 'video' });
    }
    for (const k in o) walk(o[k]);
  })(data);
  const titleM = html.match(/<meta property="og:title" content="([^"]+)"/);
  return { title: titleM ? titleM[1] : '', lessons: out.slice(0, 500) };
}

// ---------- Router ----------
async function readJson(req) {
  if (!/application\/json/.test(req.headers.get('content-type') || '')) throw new Error('Send JSON');
  const t = await req.text();
  if (t.length > 1_000_000) throw new Error('Too large');
  return JSON.parse(t || '{}');
}

async function api(req, env, url, email, role) {
  const p = url.pathname, M = req.method, admin = isAdmin(env, email, role);

  if (p === '/api/me') return json({ email, admin });

  if (p === '/api/progress') {
    if (M === 'GET') {
      const row = await env.DB.prepare('SELECT data, updated_at FROM progress WHERE email = ?1').bind(email).first();
      return json(row ? { data: JSON.parse(row.data), updated_at: row.updated_at } : { data: null });
    }
    if (M === 'PUT') {
      const data = await readJson(req);
      if (!data || typeof data !== 'object' || typeof data.done !== 'object') return bad('bad progress');
      const now = Date.now();
      await env.DB.prepare('INSERT INTO progress (email, data, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(email) DO UPDATE SET data = ?2, updated_at = ?3').bind(email, JSON.stringify(data), now).run();
      return json({ ok: true, updated_at: now });
    }
  }

  if (p === '/api/catalog' && M === 'GET') return json(await catalog(env, admin));

  if (p === '/api/my' && M === 'GET') {
    const r = await env.DB.prepare('SELECT lesson_id, done, done_at, note, saved, position, updated_at FROM user_lessons WHERE email = ?1').bind(email).all();
    return json({ lessons: r.results });
  }
  let m = p.match(/^\/api\/my\/lessons\/([\w-]{3,40})$/);
  if (m && M === 'PUT') {
    const id = m[1], b = await readJson(req), now = Date.now();
    const ok = await env.DB.prepare('SELECT id FROM lessons WHERE id = ?1').bind(id).first();
    if (!ok) return bad('Lesson not found', 404);
    const cur = await env.DB.prepare('SELECT * FROM user_lessons WHERE email = ?1 AND lesson_id = ?2').bind(email, id).first() || { done: 0, done_at: null, note: '', saved: 0, position: 0 };
    const done = b.done === undefined ? cur.done : (b.done ? 1 : 0);
    const row = {
      done, done_at: done ? (cur.done_at || now) : null,
      note: b.note === undefined ? cur.note : str(b.note, 20000),
      saved: b.saved === undefined ? cur.saved : (b.saved ? 1 : 0),
      position: b.position === undefined ? cur.position : Math.max(0, int(b.position))
    };
    await env.DB.prepare('INSERT INTO user_lessons (email, lesson_id, done, done_at, note, saved, position, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8) ON CONFLICT(email, lesson_id) DO UPDATE SET done=?3, done_at=?4, note=?5, saved=?6, position=?7, updated_at=?8')
      .bind(email, id, row.done, row.done_at, row.note, row.saved, row.position, now).run();
    return json({ lesson_id: id, ...row, updated_at: now });
  }

  // ----- Admin -----
  if (p.startsWith('/api/admin/')) {
    if (!admin) return bad('Admins only', 403);
    m = p.match(/^\/api\/admin\/(tracks|courses|modules|lessons)(?:\/([\w-]{3,40}))?$/);
    if (m) {
      const [, kind, id] = m;
      if (M === 'POST' && !id) return json(await createRow(env, kind, await readJson(req)), 201);
      if (M === 'PUT' && id) return json(await updateRow(env, kind, id, await readJson(req)));
      if (M === 'DELETE' && id) { await deleteRow(env, kind, id); return json({ ok: true }); }
      return bad('method not allowed', 405);
    }
    if (p === '/api/admin/reorder' && M === 'POST') {
      const b = await readJson(req);
      if (!KINDS[b.kind] || !Array.isArray(b.ids)) return bad('bad reorder');
      await env.DB.batch(b.ids.slice(0, 500).map((id, i) => env.DB.prepare(`UPDATE ${b.kind} SET sort = ?1 WHERE id = ?2`).bind(i, String(id))));
      return json({ ok: true });
    }
    if (p === '/api/admin/bulk' && M === 'POST') {
      const b = await readJson(req);
      const course = await env.DB.prepare('SELECT id FROM courses WHERE id = ?1').bind(str(b.course_id, 40)).first();
      if (!course) return bad('Course not found', 404);
      let mods = 0, les = 0;
      for (const mod of (b.modules || []).slice(0, 200)) {
        const row = await createRow(env, 'modules', { course_id: course.id, title: mod.title || 'Section' }); mods++;
        const now = Date.now();
        const items = (mod.lessons || []).slice(0, 500).map((x, i) => {
          const f = KINDS.lessons.fields(x);
          return { id: newId('l'), module_id: row.id, ...f, title: f.title || 'Lesson ' + (i + 1), sort: i, created_at: now, updated_at: now };
        });
        for (let i = 0; i < items.length; i += 50) {
          await env.DB.batch(items.slice(i, i + 50).map(r => { const cols = Object.keys(r); return env.DB.prepare(`INSERT INTO lessons (${cols.join(',')}) VALUES (${cols.map((_, k) => '?' + (k + 1)).join(',')})`).bind(...cols.map(c => r[c])); }));
        }
        les += items.length;
      }
      return json({ ok: true, modules: mods, lessons: les });
    }
    if (p === '/api/admin/link-info' && M === 'GET') return json(await linkInfo(url.searchParams.get('url')));
    if (p === '/api/admin/playlist' && M === 'GET') return json(await playlist(url.searchParams.get('url')));
    if (p === '/api/admin/learners' && M === 'GET') {
      const r = await env.DB.prepare(`SELECT u.email, u.created_at, u.last_seen, p.data AS progress,
          (SELECT COUNT(*) FROM user_lessons ul WHERE ul.email = u.email AND ul.done = 1) AS course_done,
          (SELECT MAX(updated_at) FROM user_lessons ul WHERE ul.email = u.email) AS course_at
        FROM users u LEFT JOIN progress p ON p.email = u.email ORDER BY u.last_seen DESC`).all();
      return json({ learners: r.results.map(x => { let d = {}; try { d = JSON.parse(x.progress || '{}'); } catch {} return { email: x.email, name: d.name || '', created_at: x.created_at, last_seen: x.last_seen, interactive_done: Object.keys(d.done || {}).length, course_done: x.course_done, course_at: x.course_at }; }) });
    }
    if (p === '/api/admin/export' && M === 'GET') return json(await catalog(env, true));
    return bad('not found', 404);
  }
  return bad('not found', 404);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return site(req, env, url);
    if (url.pathname === '/api/login') return Response.redirect(`${url.origin}/#home`, 302);
    if (url.pathname === '/api/logout') return Response.redirect(`${url.origin}/cdn-cgi/access/logout`, 302);
    const email = await userFromAccess(req, env, url);
    if (!email) return bad('not signed in', 401);
    try {
      const now = Date.now();
      const u = await env.DB.prepare('INSERT INTO users (email, created_at, last_seen) VALUES (?1, ?2, ?2) ON CONFLICT(email) DO UPDATE SET last_seen = ?2 RETURNING role').bind(email, now).first();
      return await api(req, env, url, email, u && u.role);
    } catch (e) {
      return bad(e && e.message ? e.message : 'Something went wrong', 400);
    }
  }
};
