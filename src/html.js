/**
 * Shared HTML helpers and the page shell.
 * Public pages are rendered on the server so course pages are indexable
 * and the first paint needs no JavaScript.
 */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape untrusted text for HTML text nodes and quoted attributes. */
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** Mark an already-safe HTML string so it is not escaped again. */
export function raw(value) {
  return { __raw: true, value: value === null || value === undefined ? '' : String(value) };
}

/**
 * Only allow links we are willing to send a student to.
 * Blocks javascript:, data: and other script-bearing schemes on admin input.
 */
export function safeUrl(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return s;
  return '';
}

/** Parse a JSON column, always returning an array. */
export function jsonArray(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Render newline-separated admin copy as paragraphs, escaping as we go. */
export function paragraphs(text) {
  return String(text || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => '<p>' + esc(block).replace(/\n/g, '<br>') + '</p>')
    .join('');
}

/* The brand mark. Ships as a transparent white PNG and is inverted by CSS
   for the light theme, so one asset serves both. */
export const BRAND_MARK =
  '<img class="mark brand-logo" src="/logo.png" alt="" width="170" height="256" decoding="async">';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Courses' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

/**
 * Full document shell: fonts, theme bootstrap, header, footer.
 * `path` drives the active nav state.
 */
export function layout({ title, description, path = '/', env = {}, body = '', head = '', ogImage = '' }) {
  const siteName = env.SITE_NAME || 'LumoraSpace Academy';
  const siteUrl = (env.SITE_URL || 'https://edu.lumoraspace.in').replace(/\/$/, '');
  const parentUrl = env.PARENT_URL || 'https://lumoraspace.in';
  const contactEmail = env.CONTACT_EMAIL || 'hello@lumoraspace.in';
  const fullTitle = title ? title + ' — ' + siteName : siteName;
  const desc =
    description ||
    'Structured, mentor-led courses for students and early-career builders. Explore the catalog and register in minutes.';
  const canonical = siteUrl + path;

  const nav = NAV_LINKS.map((l) => {
    const active = l.href === '/' ? path === '/' : path.startsWith(l.href);
    return (
      '<a class="nav-link' + (active ? ' is-active' : '') + '" href="' + esc(l.href) + '"' +
      (active ? ' aria-current="page"' : '') + '>' + esc(l.label) + '</a>'
    );
  }).join('');

  const mobileNav = NAV_LINKS.map(
    (l) => '<a href="' + esc(l.href) + '">' + esc(l.label) + '</a>'
  ).join('');

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
${ogImage ? '<meta property="og:image" content="' + esc(ogImage) + '">' : ''}
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
</script>
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
      <span>&copy; ${new Date().getFullYear()} LumoraSpace. All rights reserved.</span>
      <span class="footer-bottom-links"><a href="${esc(parentUrl)}">lumoraspace.in</a></span>
    </div>
  </div>
</footer>

<script src="/app.js" defer></script>
</body>
</html>`;
}
