var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/html.js
var ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function esc(value) {
  if (value === null || value === void 0) return "";
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}
__name(esc, "esc");
function safeUrl(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return s;
  return "";
}
__name(safeUrl, "safeUrl");
function jsonArray(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
__name(jsonArray, "jsonArray");
function paragraphs(text) {
  return String(text || "").split(/\n{2,}/).map((block) => block.trim()).filter(Boolean).map((block) => "<p>" + esc(block).replace(/\n/g, "<br>") + "</p>").join("");
}
__name(paragraphs, "paragraphs");
var BRAND_MARK = '<img class="mark brand-logo" src="/logo.png" alt="" width="170" height="256" decoding="async">';
var NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];
function layout({ title, description, path = "/", env = {}, body = "", head = "", ogImage = "" }) {
  const siteName = env.SITE_NAME || "LumoraSpace Academy";
  const siteUrl = (env.SITE_URL || "https://edu.lumoraspace.in").replace(/\/$/, "");
  const parentUrl = env.PARENT_URL || "https://lumoraspace.in";
  const contactEmail = env.CONTACT_EMAIL || "hello@lumoraspace.in";
  const fullTitle = title ? title + " \u2014 " + siteName : siteName;
  const desc = description || "Structured, mentor-led courses for students and early-career builders. Explore the catalog and register in minutes.";
  const canonical = siteUrl + path;
  const nav = NAV_LINKS.map((l) => {
    const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
    return '<a class="nav-link' + (active ? " is-active" : "") + '" href="' + esc(l.href) + '"' + (active ? ' aria-current="page"' : "") + ">" + esc(l.label) + "</a>";
  }).join("");
  const mobileNav = NAV_LINKS.map(
    (l) => '<a href="' + esc(l.href) + '">' + esc(l.label) + "</a>"
  ).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="theme-color" content="#050505" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(siteName)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
${ogImage ? '<meta property="og:image" content="' + esc(ogImage) + '">' : ""}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/favicon-512.png" sizes="512x512" type="image/png">
<link rel="apple-touch-icon" href="/favicon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap">
<link rel="stylesheet" href="/styles.css">
<script>
/* Applies the saved theme before first paint, flags that JS is alive so the
   motion layer can engage, and guarantees the page becomes visible even if
   app.js never loads. */
(function(){var d=document.documentElement;
try{var t=localStorage.getItem('ls-theme');if(t==='light'||t==='dark'){d.setAttribute('data-theme',t);}}catch(e){}
d.classList.add('js');
var reveal=function(){d.classList.add('is-ready');};
window.addEventListener('load',reveal);setTimeout(reveal,1600);})();
<\/script>
${head}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div>
<div class="cursor-ring" data-cursor-ring aria-hidden="true"></div>
<div class="cursor-dot" data-cursor-dot aria-hidden="true"></div>

<header class="site-header" id="siteHeader">
  <div class="shell header-inner">
    <a class="brand" href="/" aria-label="${esc(siteName)} home">
      ${BRAND_MARK}
      <span class="brand-text">
        <span class="brand-name">LUMORASPACE</span>
        <span class="brand-sub">Academy</span>
      </span>
    </a>

    <nav class="nav-desktop" aria-label="Primary">${nav}</nav>

    <div class="header-actions">
      <button class="icon-btn theme-toggle" type="button" data-theme-toggle aria-label="Switch colour theme">
        <svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.3 5.3l1.9 1.9M16.8 16.8l1.9 1.9M18.7 5.3l-1.9 1.9M7.2 16.8l-1.9 1.9"/></svg>
        <svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z"/></svg>
      </button>
      <a class="btn btn-primary btn-sm header-cta" href="/courses">Browse courses</a>
      <button class="icon-btn nav-burger" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobileMenu" aria-label="Open menu">
        <span class="burger-bars" aria-hidden="true"><i></i><i></i></span>
      </button>
    </div>
  </div>
</header>

<div class="mobile-menu" id="mobileMenu" hidden>
  <nav class="mobile-nav" aria-label="Mobile">
    ${mobileNav}
    <a class="btn btn-primary mobile-cta" href="/courses">Browse courses</a>
    <a class="mobile-parent" href="${esc(parentUrl)}">Back to lumoraspace.in &rarr;</a>
  </nav>
</div>

<main id="main">
${body}
</main>

<footer class="site-footer">
  <div class="shell">
    <div class="footer-top">
      <div class="footer-brand">
        <a class="brand" href="/">
          ${BRAND_MARK}
          <span class="brand-text">
            <span class="brand-name">LUMORASPACE</span>
            <span class="brand-sub">Academy</span>
          </span>
        </a>
        <p class="footer-tagline">Learn &bull; Build &bull; Grow &bull; Belong</p>
        <p class="footer-note">Structured, mentor-led programs for students and early-career builders.</p>
      </div>
      <div class="footer-cols">
        <div class="footer-col">
          <h3>Academy</h3>
          <a href="/courses">All courses</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </div>
        <div class="footer-col">
          <h3>Ecosystem</h3>
          <a href="${esc(parentUrl)}">LumoraSpace</a>
          <a href="${esc(parentUrl)}#community">Community</a>
          <a href="${esc(parentUrl)}#mentors">Mentors</a>
        </div>
        <div class="footer-col">
          <h3>Get in touch</h3>
          <a href="mailto:${esc(contactEmail)}">${esc(contactEmail)}</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} LumoraSpace. All rights reserved.</span>
      <span class="footer-bottom-links"><a href="${esc(parentUrl)}">lumoraspace.in</a></span>
    </div>
  </div>
</footer>

<script src="/app.js" defer><\/script>
</body>
</html>`;
}
__name(layout, "layout");

// src/db.js
var COLUMNS = [
  "slug",
  "title",
  "summary",
  "description",
  "category",
  "level",
  "mode",
  "duration",
  "schedule",
  "price_label",
  "start_label",
  "seats_label",
  "image_url",
  "highlights",
  "curriculum",
  "tags",
  "register_url",
  "published",
  "featured",
  "sort_order"
];
var MAX = {
  slug: 120,
  title: 140,
  summary: 320,
  description: 2e4,
  category: 60,
  level: 60,
  mode: 60,
  duration: 60,
  schedule: 120,
  price_label: 40,
  start_label: 80,
  seats_label: 80,
  image_url: 600,
  register_url: 600
};
function slugify(input) {
  return String(input || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}
__name(slugify, "slugify");
function str(value, limit) {
  return String(value === null || value === void 0 ? "" : value).trim().slice(0, limit || 500);
}
__name(str, "str");
function toList(value, limit = 24, itemLimit = 300) {
  let items = [];
  if (Array.isArray(value)) items = value;
  else if (typeof value === "string") items = value.split("\n");
  return items.map((v) => typeof v === "string" ? v.trim() : v).filter((v) => typeof v === "string" ? v.length > 0 : Boolean(v)).slice(0, limit).map((v) => typeof v === "string" ? v.slice(0, itemLimit) : v);
}
__name(toList, "toList");
function toCurriculum(value) {
  const items = Array.isArray(value) ? value : [];
  return items.slice(0, 30).map((item) => {
    if (typeof item === "string") return { title: item.trim().slice(0, 160), detail: "" };
    return {
      title: str(item && item.title, 160),
      detail: str(item && item.detail, 600)
    };
  }).filter((item) => item.title);
}
__name(toCurriculum, "toCurriculum");
function normalizeCourse(input = {}) {
  const title = str(input.title, MAX.title);
  if (!title) throw new ValidationError("Title is required.");
  const slug = slugify(input.slug || title);
  if (!slug) throw new ValidationError("Could not build a URL slug from that title. Add a slug manually.");
  const registerUrl = safeUrl(str(input.register_url, MAX.register_url));
  if (input.register_url && !registerUrl) {
    throw new ValidationError("The registration link must be a full https:// URL.");
  }
  const imageUrl = safeUrl(str(input.image_url, MAX.image_url));
  if (input.image_url && !imageUrl) {
    throw new ValidationError("The image link must be a full https:// URL.");
  }
  const published = truthy(input.published);
  if (published && !registerUrl) {
    throw new ValidationError("Add the Google Form registration link before publishing this course.");
  }
  return {
    slug,
    title,
    summary: str(input.summary, MAX.summary),
    description: str(input.description, MAX.description),
    category: str(input.category, MAX.category) || "General",
    level: str(input.level, MAX.level) || "Beginner",
    mode: str(input.mode, MAX.mode) || "Online",
    duration: str(input.duration, MAX.duration),
    schedule: str(input.schedule, MAX.schedule),
    price_label: str(input.price_label, MAX.price_label) || "Free",
    start_label: str(input.start_label, MAX.start_label),
    seats_label: str(input.seats_label, MAX.seats_label),
    image_url: imageUrl,
    highlights: JSON.stringify(toList(input.highlights)),
    curriculum: JSON.stringify(toCurriculum(input.curriculum)),
    tags: JSON.stringify(toList(input.tags, 16, 40)),
    register_url: registerUrl,
    published: published ? 1 : 0,
    featured: truthy(input.featured) ? 1 : 0,
    sort_order: Number.isFinite(Number(input.sort_order)) ? Math.trunc(Number(input.sort_order)) : 0
  };
}
__name(normalizeCourse, "normalizeCourse");
function truthy(v) {
  return v === true || v === 1 || v === "1" || v === "on" || v === "true";
}
__name(truthy, "truthy");
var ValidationError = class extends Error {
  static {
    __name(this, "ValidationError");
  }
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
  }
};
async function listPublished(db, { category = "", limit = 200 } = {}) {
  const where = category ? "WHERE published = 1 AND category = ?" : "WHERE published = 1";
  const sql = "SELECT * FROM courses " + where + " ORDER BY featured DESC, sort_order ASC, id DESC LIMIT ?";
  const stmt = category ? db.prepare(sql).bind(category, limit) : db.prepare(sql).bind(limit);
  const { results } = await stmt.all();
  return results || [];
}
__name(listPublished, "listPublished");
async function listFeatured(db, limit = 3) {
  const { results } = await db.prepare(
    "SELECT * FROM courses WHERE published = 1 ORDER BY featured DESC, sort_order ASC, id DESC LIMIT ?"
  ).bind(limit).all();
  return results || [];
}
__name(listFeatured, "listFeatured");
async function listAll(db) {
  const { results } = await db.prepare("SELECT * FROM courses ORDER BY published DESC, sort_order ASC, id DESC").all();
  return results || [];
}
__name(listAll, "listAll");
async function getBySlug(db, slug, { includeDrafts = false } = {}) {
  const sql = includeDrafts ? "SELECT * FROM courses WHERE slug = ?" : "SELECT * FROM courses WHERE slug = ? AND published = 1";
  return db.prepare(sql).bind(slug).first();
}
__name(getBySlug, "getBySlug");
async function getById(db, id) {
  return db.prepare("SELECT * FROM courses WHERE id = ?").bind(Number(id)).first();
}
__name(getById, "getById");
async function listCategories(db) {
  const { results } = await db.prepare("SELECT category, COUNT(*) AS n FROM courses WHERE published = 1 GROUP BY category ORDER BY n DESC, category ASC").all();
  return results || [];
}
__name(listCategories, "listCategories");
async function countCourses(db) {
  const row = await db.prepare("SELECT COUNT(*) AS total, SUM(published) AS live FROM courses").first();
  return { total: row?.total || 0, live: row?.live || 0 };
}
__name(countCourses, "countCourses");
async function createCourse(db, input) {
  const row = normalizeCourse(input);
  row.slug = await uniqueSlug(db, row.slug, null);
  const placeholders = COLUMNS.map(() => "?").join(", ");
  const values = COLUMNS.map((c) => row[c]);
  const res = await db.prepare("INSERT INTO courses (" + COLUMNS.join(", ") + ") VALUES (" + placeholders + ")").bind(...values).run();
  return getById(db, res.meta.last_row_id);
}
__name(createCourse, "createCourse");
async function updateCourse(db, id, input) {
  const existing = await getById(db, id);
  if (!existing) return null;
  const row = normalizeCourse(input);
  row.slug = await uniqueSlug(db, row.slug, Number(id));
  const assignments = COLUMNS.map((c) => c + " = ?").join(", ");
  const values = COLUMNS.map((c) => row[c]);
  await db.prepare("UPDATE courses SET " + assignments + ", updated_at = datetime('now') WHERE id = ?").bind(...values, Number(id)).run();
  return getById(db, id);
}
__name(updateCourse, "updateCourse");
async function setPublished(db, id, published) {
  const existing = await getById(db, id);
  if (!existing) return null;
  if (published && !existing.register_url) {
    throw new ValidationError("Add the Google Form registration link before publishing this course.");
  }
  await db.prepare("UPDATE courses SET published = ?, updated_at = datetime('now') WHERE id = ?").bind(published ? 1 : 0, Number(id)).run();
  return getById(db, id);
}
__name(setPublished, "setPublished");
async function deleteCourse(db, id) {
  const res = await db.prepare("DELETE FROM courses WHERE id = ?").bind(Number(id)).run();
  return res.meta.changes > 0;
}
__name(deleteCourse, "deleteCourse");
async function uniqueSlug(db, base, ignoreId) {
  let candidate = base;
  for (let n = 2; n < 200; n++) {
    const row = await db.prepare("SELECT id FROM courses WHERE slug = ?").bind(candidate).first();
    if (!row || ignoreId !== null && row.id === ignoreId) return candidate;
    candidate = base.slice(0, 110) + "-" + n;
  }
  return base + "-" + Date.now();
}
__name(uniqueSlug, "uniqueSlug");

// src/auth.js
var COOKIE_NAME = "ls_admin";
var SESSION_TTL_MS = 8 * 60 * 60 * 1e3;
var MAX_FAILS = 5;
var LOCKOUT_MS = 15 * 60 * 1e3;
var encoder = new TextEncoder();
function b64urlEncode(bytes) {
  let bin = "";
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(b64urlEncode, "b64urlEncode");
function b64urlDecode(str2) {
  const padded = str2.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - str2.length % 4) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
__name(b64urlDecode, "b64urlDecode");
async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
__name(hmacKey, "hmacKey");
async function sign(secret, payload) {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return b64urlEncode(sig);
}
__name(sign, "sign");
function timingSafeEqual(a, b) {
  const ab = encoder.encode(String(a));
  const bb = encoder.encode(String(b));
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) diff |= (ab[i] || 0) ^ (bb[i] || 0);
  return diff === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
function requireSecret(env) {
  const secret = env.SESSION_SECRET;
  if (!secret || String(secret).length < 16) {
    throw new Error("SESSION_SECRET is missing. Run: wrangler secret put SESSION_SECRET");
  }
  return secret;
}
__name(requireSecret, "requireSecret");
async function createSessionCookie(env, { secure = true } = {}) {
  const secret = requireSecret(env);
  const payload = b64urlEncode(encoder.encode(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })));
  const sig = await sign(secret, payload);
  const attrs = [
    COOKIE_NAME + "=" + payload + "." + sig,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=" + Math.floor(SESSION_TTL_MS / 1e3)
  ];
  if (secure) attrs.push("Secure");
  return attrs.join("; ");
}
__name(createSessionCookie, "createSessionCookie");
function clearSessionCookie({ secure = true } = {}) {
  const attrs = [COOKIE_NAME + "=", "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) attrs.push("Secure");
  return attrs.join("; ");
}
__name(clearSessionCookie, "clearSessionCookie");
function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return "";
}
__name(readCookie, "readCookie");
async function isAuthenticated(request, env) {
  try {
    const secret = requireSecret(env);
    const token = readCookie(request, COOKIE_NAME);
    if (!token) return false;
    const dot = token.lastIndexOf(".");
    if (dot < 1) return false;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = await sign(secret, payload);
    if (!timingSafeEqual(sig, expected)) return false;
    const data = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)));
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}
__name(isAuthenticated, "isAuthenticated");
function clientIp(request) {
  return (request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown").split(",")[0].trim();
}
__name(clientIp, "clientIp");
async function checkLoginRate(db, ip) {
  const row = await db.prepare("SELECT fails, locked_until FROM login_attempts WHERE ip = ?").bind(ip).first();
  if (!row) return { allowed: true, retryAfterSec: 0 };
  const now = Date.now();
  if (row.locked_until && row.locked_until > now) {
    return { allowed: false, retryAfterSec: Math.ceil((row.locked_until - now) / 1e3) };
  }
  return { allowed: true, retryAfterSec: 0 };
}
__name(checkLoginRate, "checkLoginRate");
async function recordLoginFailure(db, ip) {
  const now = Date.now();
  const row = await db.prepare("SELECT fails, locked_until FROM login_attempts WHERE ip = ?").bind(ip).first();
  const fails = (row ? row.fails : 0) + 1;
  const lockedUntil = fails >= MAX_FAILS ? now + LOCKOUT_MS : 0;
  await db.prepare(
    "INSERT INTO login_attempts (ip, fails, locked_until, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(ip) DO UPDATE SET fails = excluded.fails, locked_until = excluded.locked_until, updated_at = excluded.updated_at"
  ).bind(ip, fails >= MAX_FAILS ? 0 : fails, lockedUntil, now).run();
  return { fails, lockedUntil };
}
__name(recordLoginFailure, "recordLoginFailure");
async function clearLoginFailures(db, ip) {
  await db.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
}
__name(clearLoginFailures, "clearLoginFailures");
function passwordMatches(env, candidate) {
  const expected = env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD is missing. Run: wrangler secret put ADMIN_PASSWORD");
  return timingSafeEqual(candidate || "", expected);
}
__name(passwordMatches, "passwordMatches");
function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
__name(sameOrigin, "sameOrigin");

// src/admin.js
var json = /* @__PURE__ */ __name((data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }
}), "json");
var noStoreHtml = /* @__PURE__ */ __name((body, status = 200, headers = {}) => new Response(body, {
  status,
  headers: {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store, must-revalidate",
    "X-Robots-Tag": "noindex, nofollow",
    ...headers
  }
}), "noStoreHtml");
function loginPage({ error = "", notice = "" } = {}) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Admin sign in \u2014 LumoraSpace Academy</title>
<meta name="theme-color" content="#050505" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/favicon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap">
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/admin.css">
<script>(function(){try{var t=localStorage.getItem('ls-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();<\/script>
</head>
<body class="admin-body admin-login-body">
<main class="login-wrap">
  <div class="login-card">
    <a class="brand login-brand" href="/">
      ${BRAND_MARK}
      <span class="brand-text">
        <span class="brand-name">LUMORASPACE</span>
        <span class="brand-sub">Academy admin</span>
      </span>
    </a>
    <h1>Sign in</h1>
    <p class="login-sub">Enter the admin password to manage courses.</p>
    ${error ? '<p class="form-error" role="alert">' + esc(error) + "</p>" : ""}
    ${notice ? '<p class="form-notice">' + esc(notice) + "</p>" : ""}
    <form method="post" action="/admin/login" class="login-form">
      <label class="field">
        <span class="field-label">Password</span>
        <input class="input" type="password" name="password" autocomplete="current-password" required autofocus>
      </label>
      <button class="btn btn-primary btn-block" type="submit">Sign in</button>
    </form>
    <a class="login-back" href="/">&larr; Back to the site</a>
  </div>
</main>
</body>
</html>`;
}
__name(loginPage, "loginPage");
function consolePage({ stats }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Course admin \u2014 LumoraSpace Academy</title>
<meta name="theme-color" content="#050505" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/favicon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap">
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/admin.css">
<script>(function(){try{var t=localStorage.getItem('ls-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();<\/script>
</head>
<body class="admin-body">

<header class="admin-header">
  <div class="admin-shell admin-header-inner">
    <a class="brand" href="/admin">
      ${BRAND_MARK}
      <span class="brand-text">
        <span class="brand-name">LUMORASPACE</span>
        <span class="brand-sub">Academy admin</span>
      </span>
    </a>
    <div class="admin-header-actions">
      <a class="admin-link" href="/" target="_blank" rel="noopener">View site &nearr;</a>
      <button class="icon-btn theme-toggle" type="button" data-theme-toggle aria-label="Switch colour theme">
        <svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.3 5.3l1.9 1.9M16.8 16.8l1.9 1.9M18.7 5.3l-1.9 1.9M7.2 16.8l-1.9 1.9"/></svg>
        <svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z"/></svg>
      </button>
      <form method="post" action="/admin/logout"><button class="btn btn-ghost btn-sm" type="submit">Sign out</button></form>
    </div>
  </div>
</header>

<main class="admin-main admin-shell">
  <div class="admin-page-head">
    <div>
      <h1>Courses</h1>
      <p class="admin-sub">Create a course, paste its Google Form link, and publish it to the public catalog.</p>
    </div>
    <button class="btn btn-primary" type="button" data-new-course>+ New course</button>
  </div>

  <div class="admin-stats">
    <div class="admin-stat"><span>Total</span><strong data-stat-total>${esc(String(stats.total))}</strong></div>
    <div class="admin-stat"><span>Published</span><strong data-stat-live>${esc(String(stats.live))}</strong></div>
    <div class="admin-stat"><span>Drafts</span><strong data-stat-draft>${esc(String(stats.total - stats.live))}</strong></div>
  </div>

  <div id="courseList" class="admin-list" aria-busy="true">
    <p class="admin-loading">Loading courses\u2026</p>
  </div>
</main>

<div class="drawer" id="editor" hidden>
  <div class="drawer-scrim" data-close-editor></div>
  <section class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="editorTitle">
    <header class="drawer-head">
      <h2 id="editorTitle">New course</h2>
      <button class="icon-btn" type="button" data-close-editor aria-label="Close editor">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </header>
    <form id="courseForm" class="drawer-body" novalidate>
      <p class="form-error" data-form-error hidden role="alert"></p>

      <fieldset class="form-group">
        <legend>The basics</legend>
        <label class="field">
          <span class="field-label">Course title <em>required</em></span>
          <input class="input" name="title" maxlength="140" required placeholder="Full Stack Web Development">
        </label>
        <label class="field">
          <span class="field-label">URL slug</span>
          <input class="input" name="slug" maxlength="120" placeholder="auto-generated from the title">
          <span class="field-hint">The public address: edu.lumoraspace.in/courses/<span data-slug-preview>your-slug</span></span>
        </label>
        <label class="field">
          <span class="field-label">Short summary</span>
          <textarea class="input" name="summary" rows="2" maxlength="320" placeholder="One or two lines shown on the course card."></textarea>
        </label>
        <label class="field">
          <span class="field-label">Full description</span>
          <textarea class="input" name="description" rows="8" placeholder="Leave a blank line between paragraphs."></textarea>
          <span class="field-hint">Blank lines become paragraphs on the course page.</span>
        </label>
      </fieldset>

      <fieldset class="form-group">
        <legend>Registration</legend>
        <label class="field">
          <span class="field-label">Google Form link <em>required to publish</em></span>
          <input class="input" name="register_url" type="url" maxlength="600" placeholder="https://forms.gle/...">
          <span class="field-hint">This is exactly where the Register Now button sends students.</span>
        </label>
      </fieldset>

      <fieldset class="form-group">
        <legend>Details</legend>
        <div class="field-row">
          <label class="field">
            <span class="field-label">Category</span>
            <input class="input" name="category" list="categoryList" maxlength="60" placeholder="Web Development">
          </label>
          <label class="field">
            <span class="field-label">Level</span>
            <input class="input" name="level" list="levelList" maxlength="60" placeholder="Beginner">
          </label>
        </div>
        <div class="field-row">
          <label class="field">
            <span class="field-label">Mode</span>
            <input class="input" name="mode" list="modeList" maxlength="60" placeholder="Online (Live)">
          </label>
          <label class="field">
            <span class="field-label">Duration</span>
            <input class="input" name="duration" maxlength="60" placeholder="12 weeks">
          </label>
        </div>
        <div class="field-row">
          <label class="field">
            <span class="field-label">Schedule</span>
            <input class="input" name="schedule" maxlength="120" placeholder="Weekends, 7:00 PM IST">
          </label>
          <label class="field">
            <span class="field-label">Fee label</span>
            <input class="input" name="price_label" maxlength="40" placeholder="Free">
          </label>
        </div>
        <div class="field-row">
          <label class="field">
            <span class="field-label">Start label</span>
            <input class="input" name="start_label" maxlength="80" placeholder="Next cohort opens soon">
          </label>
          <label class="field">
            <span class="field-label">Seats label</span>
            <input class="input" name="seats_label" maxlength="80" placeholder="Limited seats per cohort">
          </label>
        </div>
        <label class="field">
          <span class="field-label">Cover image URL</span>
          <input class="input" name="image_url" type="url" maxlength="600" placeholder="https://...">
          <span class="field-hint">Optional. Leave blank for a clean typographic card.</span>
        </label>
        <label class="field">
          <span class="field-label">Skill tags</span>
          <input class="input" name="tags" maxlength="400" placeholder="React, Node.js, SQL">
          <span class="field-hint">Comma separated.</span>
        </label>
      </fieldset>

      <fieldset class="form-group">
        <legend>What is included</legend>
        <label class="field">
          <span class="field-label">Highlights</span>
          <textarea class="input" name="highlights" rows="5" placeholder="One per line."></textarea>
          <span class="field-hint">One per line. Rendered as the ticked list.</span>
        </label>
      </fieldset>

      <fieldset class="form-group">
        <legend>Curriculum</legend>
        <div id="modules" class="modules"></div>
        <button class="btn btn-ghost btn-sm" type="button" data-add-module>+ Add module</button>
      </fieldset>

      <fieldset class="form-group">
        <legend>Publishing</legend>
        <label class="switch">
          <input type="checkbox" name="published">
          <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
          <span class="switch-text"><strong>Published</strong><em>Visible in the public catalog</em></span>
        </label>
        <label class="switch">
          <input type="checkbox" name="featured">
          <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
          <span class="switch-text"><strong>Featured</strong><em>Pinned to the top of the home page</em></span>
        </label>
        <label class="field field-narrow">
          <span class="field-label">Sort order</span>
          <input class="input" name="sort_order" type="number" value="0" step="10">
          <span class="field-hint">Lower numbers appear first.</span>
        </label>
      </fieldset>
    </form>
    <footer class="drawer-foot">
      <button class="btn btn-ghost" type="button" data-close-editor>Cancel</button>
      <button class="btn btn-primary" type="submit" form="courseForm" data-save>Save course</button>
    </footer>
  </section>
</div>

<datalist id="categoryList">
  <option value="Web Development"></option><option value="Data Science"></option>
  <option value="AI &amp; Machine Learning"></option><option value="Design"></option>
  <option value="Cloud &amp; DevOps"></option><option value="Cybersecurity"></option>
  <option value="Mobile Development"></option><option value="Career Skills"></option>
</datalist>
<datalist id="levelList">
  <option value="Beginner"></option><option value="Intermediate"></option>
  <option value="Advanced"></option><option value="Beginner to Advanced"></option>
</datalist>
<datalist id="modeList">
  <option value="Online (Live)"></option><option value="Online (Self-paced)"></option>
  <option value="Hybrid"></option><option value="In person"></option>
</datalist>

<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>

<script src="/admin.js" defer><\/script>
</body>
</html>`;
}
__name(consolePage, "consolePage");
async function handleAdmin(request, env, url) {
  const path = url.pathname;
  const isApi = path.startsWith("/api/admin");
  if (!path.startsWith("/admin") && !isApi) return null;
  const secure = url.protocol === "https:";
  if (!env.DB) {
    return isApi ? json({ error: "Database is not bound. Set database_id in wrangler.toml." }, 500) : noStoreHtml(loginPage({ error: "Database is not connected yet. Check wrangler.toml." }), 500);
  }
  const isRead = request.method === "GET" || request.method === "HEAD";
  if (path === "/admin/login") {
    if (isRead) {
      if (await isAuthenticated(request, env)) return Response.redirect(url.origin + "/admin", 302);
      return noStoreHtml(loginPage());
    }
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (!sameOrigin(request)) return noStoreHtml(loginPage({ error: "Request blocked." }), 403);
    const ip = clientIp(request);
    const rate = await checkLoginRate(env.DB, ip);
    if (!rate.allowed) {
      const mins = Math.ceil(rate.retryAfterSec / 60);
      return noStoreHtml(
        loginPage({ error: "Too many attempts. Try again in about " + mins + " minute" + (mins === 1 ? "" : "s") + "." }),
        429,
        { "Retry-After": String(rate.retryAfterSec) }
      );
    }
    const form = await request.formData();
    const password = String(form.get("password") || "");
    let ok = false;
    try {
      ok = passwordMatches(env, password);
    } catch (err) {
      return noStoreHtml(loginPage({ error: err.message }), 500);
    }
    if (!ok) {
      await recordLoginFailure(env.DB, ip);
      return noStoreHtml(loginPage({ error: "Incorrect password." }), 401);
    }
    await clearLoginFailures(env.DB, ip);
    let cookie;
    try {
      cookie = await createSessionCookie(env, { secure });
    } catch (err) {
      return noStoreHtml(loginPage({ error: err.message }), 500);
    }
    return new Response(null, {
      status: 303,
      headers: { Location: "/admin", "Set-Cookie": cookie, "Cache-Control": "no-store" }
    });
  }
  if (path === "/admin/logout" && request.method === "POST") {
    return new Response(null, {
      status: 303,
      headers: { Location: "/admin/login", "Set-Cookie": clearSessionCookie({ secure }), "Cache-Control": "no-store" }
    });
  }
  const authed = await isAuthenticated(request, env);
  if (!authed) {
    if (isApi) return json({ error: "Not signed in." }, 401);
    return new Response(null, { status: 302, headers: { Location: "/admin/login", "Cache-Control": "no-store" } });
  }
  if (isApi) {
    if (!isRead && !sameOrigin(request)) return json({ error: "Request blocked." }, 403);
    return handleApi(request, env, url);
  }
  if (path === "/admin" || path === "/admin/") {
    if (!isRead) return new Response("Method not allowed", { status: 405 });
    const stats = await countCourses(env.DB);
    return noStoreHtml(consolePage({ stats }));
  }
  return new Response(null, { status: 302, headers: { Location: "/admin", "Cache-Control": "no-store" } });
}
__name(handleAdmin, "handleAdmin");
async function handleApi(request, env, url) {
  const segments = url.pathname.replace(/^\/api\/admin\/?/, "").split("/").filter(Boolean);
  const db = env.DB;
  try {
    if (segments[0] !== "courses") return json({ error: "Unknown endpoint." }, 404);
    if (segments.length === 1) {
      if (request.method === "GET") {
        const [courses, stats] = await Promise.all([listAll(db), countCourses(db)]);
        return json({ courses, stats });
      }
      if (request.method === "POST") {
        const course = await createCourse(db, await readJson(request));
        const stats = await countCourses(db);
        return json({ course, stats }, 201);
      }
      return json({ error: "Method not allowed" }, 405);
    }
    const id = Number(segments[1]);
    if (!Number.isInteger(id) || id <= 0) return json({ error: "Invalid course id." }, 400);
    if (segments[2] === "publish" && request.method === "POST") {
      const body = await readJson(request);
      const course = await setPublished(db, id, Boolean(body.published));
      if (!course) return json({ error: "Course not found." }, 404);
      const stats = await countCourses(db);
      return json({ course, stats });
    }
    if (segments.length !== 2) return json({ error: "Unknown endpoint." }, 404);
    if (request.method === "GET") {
      const course = await getById(db, id);
      return course ? json({ course }) : json({ error: "Course not found." }, 404);
    }
    if (request.method === "PUT" || request.method === "PATCH") {
      const course = await updateCourse(db, id, await readJson(request));
      if (!course) return json({ error: "Course not found." }, 404);
      const stats = await countCourses(db);
      return json({ course, stats });
    }
    if (request.method === "DELETE") {
      const removed = await deleteCourse(db, id);
      if (!removed) return json({ error: "Course not found." }, 404);
      const stats = await countCourses(db);
      return json({ ok: true, stats });
    }
    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    if (err instanceof ValidationError) return json({ error: err.message }, 400);
    console.error("admin api error", err);
    return json({ error: "Something went wrong saving that. Please try again." }, 500);
  }
}
__name(handleApi, "handleApi");
async function readJson(request) {
  const text = await request.text();
  if (text.length > 2e5) throw new ValidationError("That course is too large to save.");
  try {
    const data = JSON.parse(text || "{}");
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("bad shape");
    return data;
  } catch {
    throw new ValidationError("Could not read the submitted data.");
  }
}
__name(readJson, "readJson");

// src/pages.js
function pill(text) {
  return text ? '<span class="pill">' + esc(text) + "</span>" : "";
}
__name(pill, "pill");
function courseMeta(course) {
  return [pill(course.duration), pill(course.level), pill(course.mode)].filter(Boolean).join("");
}
__name(courseMeta, "courseMeta");
function courseCard(course, index) {
  const tags = jsonArray(course.tags).slice(0, 3);
  const num = String(index + 1).padStart(2, "0");
  const img = safeUrl(course.image_url);
  return `
<article class="course-card">
  <a class="course-card-link" href="/courses/${esc(course.slug)}" aria-label="${esc(course.title)}">
    ${img ? `<div class="course-card-media"><img src="${esc(img)}" alt="" loading="lazy" decoding="async"></div>` : `<div class="course-card-media course-card-media--blank" aria-hidden="true"><span>${esc(num)}</span></div>`}
    <div class="course-card-body">
      <div class="course-card-top">
        <span class="eyebrow">${esc(course.category)}</span>
        ${course.featured ? '<span class="badge">Featured</span>' : ""}
      </div>
      <h3 class="course-card-title">${esc(course.title)}</h3>
      <p class="course-card-summary">${esc(course.summary)}</p>
      ${tags.length ? '<div class="tag-row">' + tags.map((t) => '<span class="tag">' + esc(t) + "</span>").join("") + "</div>" : ""}
      <div class="course-card-meta">${courseMeta(course)}</div>
      <div class="course-card-foot">
        <span class="price">${esc(course.price_label || "Free")}</span>
        <span class="link-arrow">View course <i aria-hidden="true">&rarr;</i></span>
      </div>
    </div>
  </a>
</article>`;
}
__name(courseCard, "courseCard");
function emptyState(message, hint) {
  return `
<div class="empty-state">
  <p class="empty-title">${esc(message)}</p>
  ${hint ? '<p class="empty-hint">' + esc(hint) + "</p>" : ""}
</div>`;
}
__name(emptyState, "emptyState");
var DIFFERENTIATORS = [
  {
    n: "01",
    title: "Direction",
    body: "Every program is a sequence, not a playlist. You always know what you are learning this week and why it comes before the next thing."
  },
  {
    n: "02",
    title: "Built, not watched",
    body: "Each module ends in something you have actually made. You finish with work you can show, not a folder of finished videos."
  },
  {
    n: "03",
    title: "Mentorship",
    body: "Live sessions and real feedback from people who have already shipped what you are trying to build."
  },
  {
    n: "04",
    title: "Community",
    body: "Learn beside other students at your level. Momentum is much easier to keep when you are not doing it alone."
  }
];
var STEPS = [
  { n: "01", title: "Explore", body: "Browse the catalog and open the course that matches where you are right now." },
  { n: "02", title: "Register", body: "Hit Register Now. You will be taken to a short Google Form to submit your details." },
  { n: "03", title: "Get confirmed", body: "Our team reviews registrations and sends you the joining details before the cohort starts." },
  { n: "04", title: "Learn and build", body: "Show up, ship the work, and finish with a project and a certificate." }
];
var FAQS = [
  {
    q: "Who are these courses for?",
    a: "Students, final-year undergraduates and early-career professionals. Most programs assume no prior experience and say so on the course page; where a prerequisite exists it is listed there."
  },
  {
    q: "How does registration work?",
    a: "Every course page has a Register Now button that opens a Google Form. Fill it in once and our team will follow up over email with the joining details."
  },
  {
    q: "Do I need to pay anything to register?",
    a: "The price for each program is shown on its own page. Registering through the form never charges you anything on the spot; if a program has a fee, our team explains the payment step in the follow-up email."
  },
  {
    q: "Are the sessions live or recorded?",
    a: "The mode is listed on each course page. Live programs run on a fixed weekly schedule, which is also shown there."
  },
  {
    q: "Do I get a certificate?",
    a: "Yes, on completion of the program requirements. Each course page lists exactly what is included."
  },
  {
    q: "What if I miss a cohort?",
    a: "Register anyway. Registrations stay on file and we will tell you when the next cohort opens."
  }
];
function homePage({ env, featured, stats }) {
  const body = `
<section class="hero">
  <div class="hero-glow" aria-hidden="true"></div>
  <div class="hero-fx" aria-hidden="true">
    <video class="fx-video" data-hero-video playsinline muted loop preload="none"></video>
    <canvas class="fx-shader" data-shader></canvas>
    <canvas class="fx-particles" data-particles></canvas>
  </div>
  <div class="hero-scrim" aria-hidden="true"></div>
  <div class="shell hero-inner">
    <span class="eyebrow eyebrow-lg">LumoraSpace Academy</span>
    <h1 class="hero-title">
      <span class="hero-line">Learn the thing.</span>
      <span class="hero-line hero-title-accent">Then actually build it.</span>
    </h1>
    <p class="hero-sub">
      Structured, mentor-led programs for students and early-career builders.
      Pick a course, register in a couple of minutes, and start shipping work you can show.
    </p>
    <div class="hero-actions">
      <a class="btn btn-primary btn-lg" href="/courses" data-magnetic>Browse courses <i aria-hidden="true">&rarr;</i></a>
      <a class="btn btn-ghost btn-lg" href="#how-it-works" data-magnetic>How it works</a>
    </div>
    <dl class="stat-strip">
      <div class="stat"><dt>Live courses</dt><dd data-count="${esc(String(stats.live || 0))}">0</dd></div>
      <div class="stat"><dt>Formats</dt><dd>Live &amp; guided</dd></div>
      <div class="stat"><dt>Registration</dt><dd>2 minutes</dd></div>
      <div class="stat"><dt>Certificate</dt><dd>On completion</dd></div>
    </dl>
  </div>
</section>

<section class="section" id="featured">
  <div class="shell">
    <header class="section-head" data-reveal>
      <span class="eyebrow">Course catalog</span>
      <h2 class="section-title">Programs open right now</h2>
      <p class="section-sub">Each one is a full path from the fundamentals to something finished and deployed.</p>
    </header>
    ${featured.length ? '<div class="course-grid" data-reveal-group>' + featured.map((c, i) => courseCard(c, i)).join("") + '</div><div class="section-foot" data-reveal><a class="btn btn-ghost" href="/courses" data-magnetic>See all courses <i aria-hidden="true">&rarr;</i></a></div>' : emptyState("No courses are published yet.", "New programs are added regularly \u2014 check back shortly.")}
  </div>
</section>

<section class="section section-alt">
  <div class="shell">
    <header class="section-head" data-reveal>
      <span class="eyebrow">The difference</span>
      <h2 class="section-title">Not another content catalog</h2>
      <p class="section-sub">Talent exists everywhere. Guidance does not. That gap is the whole reason this exists.</p>
    </header>
    <div class="num-grid" data-reveal-group>
      ${DIFFERENTIATORS.map(
    (d) => `
      <article class="num-card">
        <span class="num-card-index">${esc(d.n)} <i aria-hidden="true">//</i></span>
        <h3>${esc(d.title)}</h3>
        <p>${esc(d.body)}</p>
      </article>`
  ).join("")}
    </div>
  </div>
</section>

<section class="section" id="how-it-works">
  <div class="shell">
    <header class="section-head" data-reveal>
      <span class="eyebrow">How it works</span>
      <h2 class="section-title">From the catalog to your first session</h2>
      <p class="section-sub">Four steps, and only one of them needs anything from you.</p>
    </header>
    <ol class="step-list" data-reveal>
      ${STEPS.map(
    (s) => `
      <li class="step">
        <span class="step-index">${esc(s.n)}</span>
        <div class="step-body">
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.body)}</p>
        </div>
      </li>`
  ).join("")}
    </ol>
  </div>
</section>

<section class="section section-alt">
  <div class="shell">
    <header class="section-head" data-reveal>
      <span class="eyebrow">Questions</span>
      <h2 class="section-title">Before you register</h2>
    </header>
    <div class="faq" data-reveal>
      ${FAQS.map(
    (f) => `
      <details class="faq-item">
        <summary>${esc(f.q)}<i class="faq-chevron" aria-hidden="true"></i></summary>
        <div class="faq-answer"><p>${esc(f.a)}</p></div>
      </details>`
  ).join("")}
    </div>
  </div>
</section>

<section class="cta-band">
  <div class="hero-fx" aria-hidden="true"><canvas class="fx-particles" data-particles></canvas></div>
  <div class="shell cta-inner" data-reveal>
    <h2>Ready to stop scrolling roadmaps?</h2>
    <p>Open the catalog, pick the program that fits, and register today.</p>
    <a class="btn btn-primary btn-lg" href="/courses" data-magnetic>Browse courses <i aria-hidden="true">&rarr;</i></a>
  </div>
</section>`;
  return layout({
    title: "",
    description: "LumoraSpace Academy runs structured, mentor-led courses for students and early-career builders. Browse the catalog and register in minutes.",
    path: "/",
    env,
    body
  });
}
__name(homePage, "homePage");
function coursesPage({ env, courses, categories, activeCategory }) {
  const chips = [{ category: "", n: 0 }].concat(categories);
  const chipHtml = chips.map((c) => {
    const label = c.category || "All";
    const href = c.category ? "/courses?category=" + encodeURIComponent(c.category) : "/courses";
    const active = (activeCategory || "") === (c.category || "");
    return '<a class="chip' + (active ? " is-active" : "") + '" href="' + esc(href) + '"' + (active ? ' aria-current="true"' : "") + ">" + esc(label) + "</a>";
  }).join("");
  const body = `
<section class="page-head">
  <div class="shell">
    <span class="eyebrow eyebrow-lg">Course catalog</span>
    <h1 class="page-title">Every program, in one place</h1>
    <p class="page-sub">
      Structured learning with real outcomes. Open a course to see the full curriculum,
      schedule and what you finish with.
    </p>
  </div>
</section>

<section class="section section-tight">
  <div class="shell">
    ${categories.length > 1 ? '<div class="chip-row" data-reveal role="navigation" aria-label="Filter by category">' + chipHtml + "</div>" : ""}
    ${courses.length ? '<div class="course-grid" data-reveal-group>' + courses.map((c, i) => courseCard(c, i)).join("") + "</div>" : emptyState(
    activeCategory ? "No published courses in this category yet." : "No courses are published yet.",
    "New programs are added regularly \u2014 check back shortly."
  )}
  </div>
</section>`;
  return layout({
    title: activeCategory ? activeCategory + " courses" : "Courses",
    description: "Browse every course open for registration at LumoraSpace Academy.",
    path: "/courses",
    env,
    body
  });
}
__name(coursesPage, "coursesPage");
function coursePage({ env, course, related, preview = false }) {
  const highlights = jsonArray(course.highlights);
  const curriculum = jsonArray(course.curriculum);
  const tags = jsonArray(course.tags);
  const registerUrl = safeUrl(course.register_url);
  const img = safeUrl(course.image_url);
  const siteUrl = (env.SITE_URL || "https://edu.lumoraspace.in").replace(/\/$/, "");
  const facts = [
    ["Duration", course.duration],
    ["Level", course.level],
    ["Mode", course.mode],
    ["Schedule", course.schedule],
    ["Starts", course.start_label],
    ["Seats", course.seats_label]
  ].filter(([, v]) => v);
  const registerBlock = registerUrl ? `<a class="btn btn-primary btn-lg btn-block" href="${esc(registerUrl)}" target="_blank" rel="noopener noreferrer">
         Register Now <i aria-hidden="true">&rarr;</i>
       </a>
       <p class="register-note">Opens the registration form in a new tab.</p>` : `<button class="btn btn-primary btn-lg btn-block" type="button" disabled>Registration opening soon</button>
       <p class="register-note">This course is not accepting registrations yet.</p>`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary || course.description.slice(0, 300),
    url: siteUrl + "/courses/" + course.slug,
    provider: {
      "@type": "Organization",
      name: "LumoraSpace Academy",
      sameAs: env.PARENT_URL || "https://lumoraspace.in"
    }
  };
  const body = `
${preview ? '<div class="preview-banner">Draft preview \u2014 this course is not published yet. <a href="/admin">Back to admin</a></div>' : ""}
<section class="course-hero">
  <div class="shell">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a> <i aria-hidden="true">/</i>
      <a href="/courses">Courses</a> <i aria-hidden="true">/</i>
      <span>${esc(course.title)}</span>
    </nav>
    <div class="course-hero-grid">
      <div class="course-hero-main">
        <span class="eyebrow eyebrow-lg">${esc(course.category)}</span>
        <h1 class="page-title">${esc(course.title)}</h1>
        ${course.summary ? '<p class="course-lede">' + esc(course.summary) + "</p>" : ""}
        <div class="course-card-meta">${courseMeta(course)}</div>
        ${tags.length ? '<div class="tag-row">' + tags.map((t) => '<span class="tag">' + esc(t) + "</span>").join("") + "</div>" : ""}
      </div>
      ${img ? `<div class="course-hero-media"><img src="${esc(img)}" alt="" loading="lazy" decoding="async"></div>` : ""}
    </div>
  </div>
</section>

<section class="section section-tight">
  <div class="shell course-layout">
    <div class="course-main">
      ${course.description ? `<div class="prose" data-reveal>
             <h2 class="block-title">About this course</h2>
             ${paragraphs(course.description)}
           </div>` : ""}

      ${curriculum.length ? `<div class="block" data-reveal>
             <h2 class="block-title">What you will cover</h2>
             <ol class="curriculum">
               ${curriculum.map(
    (m, i) => `
               <li class="module">
                 <span class="module-index">${esc(String(i + 1).padStart(2, "0"))}</span>
                 <div class="module-body">
                   <h3>${esc(m.title)}</h3>
                   ${m.detail ? "<p>" + esc(m.detail) + "</p>" : ""}
                 </div>
               </li>`
  ).join("")}
             </ol>
           </div>` : ""}

      ${highlights.length ? `<div class="block" data-reveal>
             <h2 class="block-title">What is included</h2>
             <ul class="check-list">
               ${highlights.map((h) => '<li><i aria-hidden="true"></i><span>' + esc(h) + "</span></li>").join("")}
             </ul>
           </div>` : ""}
    </div>

    <aside class="course-aside" data-reveal>
      <div class="register-card">
        <div class="register-price">
          <span class="register-price-label">Programme fee</span>
          <strong>${esc(course.price_label || "Free")}</strong>
        </div>
        ${facts.length ? '<dl class="fact-list">' + facts.map(([k, v]) => "<div><dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd></div>").join("") + "</dl>" : ""}
        ${registerBlock}
        <a class="register-help" href="/contact">Have a question first?</a>
      </div>
    </aside>
  </div>
</section>

${related.length ? `<section class="section section-alt">
       <div class="shell">
         <header class="section-head">
           <span class="eyebrow">Keep exploring</span>
           <h2 class="section-title">Other programs</h2>
         </header>
         <div class="course-grid" data-reveal-group>${related.map((c, i) => courseCard(c, i)).join("")}</div>
       </div>
     </section>` : ""}`;
  return layout({
    title: course.title,
    description: course.summary || course.description.slice(0, 160),
    path: "/courses/" + course.slug,
    env,
    ogImage: img,
    head: '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, "\\u003c") + "<\/script>",
    body
  });
}
__name(coursePage, "coursePage");
function aboutPage({ env }) {
  const parentUrl = env.PARENT_URL || "https://lumoraspace.in";
  const body = `
<section class="page-head">
  <div class="shell">
    <span class="eyebrow eyebrow-lg">About</span>
    <h1 class="page-title">The Academy arm of LumoraSpace</h1>
    <p class="page-sub">
      LumoraSpace is a student growth ecosystem for ambitious builders.
      The Academy is where that turns into structured programs you can enrol in.
    </p>
  </div>
</section>

<section class="section section-tight">
  <div class="shell narrow">
    <div class="prose">
      <p class="lede">Most students do not lack talent. They lack direction.</p>
      <p>
        The internet has endless resources, and that is exactly the problem. Beginners struggle
        because they cannot tell what to learn next, which sources to trust, or how to stay
        consistent once the initial motivation fades.
      </p>
      <p>
        Every program here is built the opposite way. A fixed sequence, a mentor who has already
        done the work, a cohort moving at the same pace, and a deliverable at the end of every
        module. You finish with something built, not just something watched.
      </p>
      <p class="quote">&ldquo;Learning alone is a design flaw.&rdquo;</p>
      <p>
        The Academy sits alongside the wider LumoraSpace community, mentorship and hackathon
        programs. If you want the full picture, start at
        <a href="${esc(parentUrl)}">lumoraspace.in</a>.
      </p>
    </div>

    <div class="num-grid num-grid-2" data-reveal-group>
      ${DIFFERENTIATORS.map(
    (d) => `
      <article class="num-card">
        <span class="num-card-index">${esc(d.n)} <i aria-hidden="true">//</i></span>
        <h3>${esc(d.title)}</h3>
        <p>${esc(d.body)}</p>
      </article>`
  ).join("")}
    </div>
  </div>
</section>

<section class="cta-band">
  <div class="hero-fx" aria-hidden="true"><canvas class="fx-particles" data-particles></canvas></div>
  <div class="shell cta-inner" data-reveal>
    <h2>Find the program that fits</h2>
    <p>Open the catalog and see what is running right now.</p>
    <a class="btn btn-primary btn-lg" href="/courses" data-magnetic>Browse courses <i aria-hidden="true">&rarr;</i></a>
  </div>
</section>`;
  return layout({
    title: "About",
    description: "LumoraSpace Academy is the structured-programs arm of the LumoraSpace student growth ecosystem.",
    path: "/about",
    env,
    body
  });
}
__name(aboutPage, "aboutPage");
function contactPage({ env }) {
  const email = env.CONTACT_EMAIL || "hello@lumoraspace.in";
  const parentUrl = env.PARENT_URL || "https://lumoraspace.in";
  const body = `
<section class="page-head">
  <div class="shell">
    <span class="eyebrow eyebrow-lg">Contact</span>
    <h1 class="page-title">Talk to the Academy team</h1>
    <p class="page-sub">
      Questions about a course, a cohort date, or whether a program is right for you?
      Reach out and we will get back to you.
    </p>
  </div>
</section>

<section class="section section-tight">
  <div class="shell narrow">
    <div class="contact-grid" data-reveal-group>
      <a class="contact-card" href="mailto:${esc(email)}">
        <span class="eyebrow">Email</span>
        <strong>${esc(email)}</strong>
        <p>Best for course questions, cohort dates and anything that needs a considered reply.</p>
        <span class="link-arrow">Send an email <i aria-hidden="true">&rarr;</i></span>
      </a>
      <a class="contact-card" href="${esc(parentUrl)}">
        <span class="eyebrow">Community</span>
        <strong>lumoraspace.in</strong>
        <p>The wider ecosystem: community, mentorship, hackathons and builder programs.</p>
        <span class="link-arrow">Visit the main site <i aria-hidden="true">&rarr;</i></span>
      </a>
    </div>

    <div class="prose contact-note">
      <h2 class="block-title">Registering for a course</h2>
      <p>
        You do not need to email us to register. Open the course you want from the
        <a href="/courses">catalog</a> and use the <strong>Register Now</strong> button on that page.
        It takes you straight to the registration form for that specific program.
      </p>
    </div>
  </div>
</section>`;
  return layout({
    title: "Contact",
    description: "Get in touch with the LumoraSpace Academy team about courses, cohorts and registrations.",
    path: "/contact",
    env,
    body
  });
}
__name(contactPage, "contactPage");
function notFoundPage({ env, path = "/404" }) {
  const body = `
<section class="page-head error-head">
  <div class="shell">
    <span class="eyebrow eyebrow-lg">404</span>
    <h1 class="page-title">We could not find that page</h1>
    <p class="page-sub">The link may be out of date, or the course may have been unpublished.</p>
    <div class="hero-actions">
      <a class="btn btn-primary btn-lg" href="/courses">Browse courses</a>
      <a class="btn btn-ghost btn-lg" href="/">Go home</a>
    </div>
  </div>
</section>`;
  return layout({ title: "Page not found", path, env, body });
}
__name(notFoundPage, "notFoundPage");
function errorPage({ env, message }) {
  const body = `
<section class="page-head error-head">
  <div class="shell">
    <span class="eyebrow eyebrow-lg">Something went wrong</span>
    <h1 class="page-title">This page could not be loaded</h1>
    <p class="page-sub">${esc(message || "Please try again in a moment.")}</p>
    <div class="hero-actions">
      <a class="btn btn-primary btn-lg" href="/">Go home</a>
    </div>
  </div>
</section>`;
  return layout({ title: "Error", path: "/error", env, body });
}
__name(errorPage, "errorPage");

// src/index.js
var PUBLIC_CACHE = "public, max-age=0, s-maxage=60, stale-while-revalidate=300";
var NO_CACHE = "no-store";
var SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=(), interest-cohort=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    // Inline scripts are the pre-paint theme bootstrap and JSON-LD blocks.
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'"
  ].join("; ")
};
function htmlResponse(body, { status = 200, cache = PUBLIC_CACHE, headers = {} } = {}) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": cache,
      ...SECURITY_HEADERS,
      ...headers
    }
  });
}
__name(htmlResponse, "htmlResponse");
function withSecurity(response) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) if (!headers.has(k)) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
__name(withSecurity, "withSecurity");
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      return Response.redirect(url.origin + url.pathname.replace(/\/+$/, "") + url.search, 301);
    }
    try {
      const adminResponse = await handleAdmin(request, env, url);
      if (adminResponse) return withSecurity(adminResponse);
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", { status: 405, headers: SECURITY_HEADERS });
      }
      return await handlePublic(request, env, url);
    } catch (err) {
      console.error("unhandled error", err && err.stack ? err.stack : err);
      return htmlResponse(errorPage({ env, message: "" }), { status: 500, cache: NO_CACHE });
    }
  }
};
async function handlePublic(request, env, url) {
  const path = url.pathname;
  if (path === "/robots.txt") {
    const siteUrl = (env.SITE_URL || url.origin).replace(/\/$/, "");
    return new Response(
      ["User-agent: *", "Allow: /", "Disallow: /admin", "Disallow: /api/", "", "Sitemap: " + siteUrl + "/sitemap.xml", ""].join("\n"),
      { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": PUBLIC_CACHE, ...SECURITY_HEADERS } }
    );
  }
  if (path === "/sitemap.xml") return sitemap(env, url);
  if (!env.DB) {
    return htmlResponse(
      errorPage({ env, message: "The course database is not connected yet." }),
      { status: 503, cache: NO_CACHE }
    );
  }
  if (path === "/") {
    const [featured, stats] = await Promise.all([listFeatured(env.DB, 3), countCourses(env.DB)]);
    return htmlResponse(homePage({ env, featured, stats }));
  }
  if (path === "/courses") {
    const category = (url.searchParams.get("category") || "").slice(0, 60);
    const [courses, categories] = await Promise.all([
      listPublished(env.DB, { category }),
      listCategories(env.DB)
    ]);
    return htmlResponse(coursesPage({ env, courses, categories, activeCategory: category }));
  }
  if (path.startsWith("/courses/")) {
    const slug = decodeURIComponent(path.slice("/courses/".length)).slice(0, 120);
    if (!slug || slug.includes("/")) return notFound(env, path);
    let course = await getBySlug(env.DB, slug);
    let preview = false;
    if (!course && await isAuthenticated(request, env)) {
      course = await getBySlug(env.DB, slug, { includeDrafts: true });
      preview = Boolean(course);
    }
    if (!course) return notFound(env, path);
    const all = await listPublished(env.DB, { limit: 4 });
    const related = all.filter((c) => c.slug !== course.slug).slice(0, 3);
    return htmlResponse(coursePage({ env, course, related, preview }), {
      cache: preview ? NO_CACHE : PUBLIC_CACHE
    });
  }
  if (path === "/about") return htmlResponse(aboutPage({ env }));
  if (path === "/contact") return htmlResponse(contactPage({ env }));
  return notFound(env, path);
}
__name(handlePublic, "handlePublic");
function notFound(env, path) {
  return htmlResponse(notFoundPage({ env, path }), { status: 404, cache: NO_CACHE });
}
__name(notFound, "notFound");
async function sitemap(env, url) {
  const siteUrl = (env.SITE_URL || url.origin).replace(/\/$/, "");
  const staticPaths = ["/", "/courses", "/about", "/contact"];
  let courses = [];
  try {
    if (env.DB) courses = await listPublished(env.DB, { limit: 500 });
  } catch (err) {
    console.error("sitemap query failed", err);
  }
  const entries = staticPaths.map((p) => "  <url><loc>" + escXml(siteUrl + p) + "</loc><changefreq>weekly</changefreq></url>").concat(
    courses.map(
      (c) => "  <url><loc>" + escXml(siteUrl + "/courses/" + c.slug) + "</loc><lastmod>" + escXml(String(c.updated_at || "").slice(0, 10)) + "</lastmod><changefreq>weekly</changefreq></url>"
    )
  );
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries.join("\n") + "\n</urlset>\n";
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": PUBLIC_CACHE, ...SECURITY_HEADERS }
  });
}
__name(sitemap, "sitemap");
function escXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
__name(escXml, "escXml");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-FociJy/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-FociJy/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
