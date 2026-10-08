/**
 * edu.lumoraspace.in — Worker entry point.
 *
 * v0 scope: a public, server-rendered course catalog plus a password-gated
 * admin console. Registration is a redirect to a Google Form that the admin
 * pastes when publishing the course. No student accounts, no payments.
 */

import { handleAdmin } from './admin.js';
import {
  homePage, coursesPage, coursePage, aboutPage, contactPage, notFoundPage, errorPage,
} from './pages.js';
import { listPublished, listFeatured, getBySlug, listCategories, countCourses } from './db.js';
import { isAuthenticated } from './auth.js';

/* Cached at the edge briefly so a burst of traffic does not hit D1 for every
   view, while a publish still goes live within a minute. */
const PUBLIC_CACHE = 'public, max-age=0, s-maxage=60, stale-while-revalidate=300';
const NO_CACHE = 'no-store';

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), interest-cohort=()',
  'Content-Security-Policy': [
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
    "object-src 'none'",
  ].join('; '),
};

function htmlResponse(body, { status = 200, cache = PUBLIC_CACHE, headers = {} } = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': cache,
      ...SECURITY_HEADERS,
      ...headers,
    },
  });
}

function withSecurity(response) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) if (!headers.has(k)) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Normalise: strip a trailing slash so /courses/ and /courses are one page.
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      return Response.redirect(url.origin + url.pathname.replace(/\/+$/, '') + url.search, 301);
    }

    try {
      const adminResponse = await handleAdmin(request, env, url);
      if (adminResponse) return withSecurity(adminResponse);

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method not allowed', { status: 405, headers: SECURITY_HEADERS });
      }

      return await handlePublic(request, env, url);
    } catch (err) {
      console.error('unhandled error', err && err.stack ? err.stack : err);
      return htmlResponse(errorPage({ env, message: '' }), { status: 500, cache: NO_CACHE });
    }
  },
};

async function handlePublic(request, env, url) {
  const path = url.pathname;

  if (path === '/robots.txt') {
    const siteUrl = (env.SITE_URL || url.origin).replace(/\/$/, '');
    return new Response(
      ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', '', 'Sitemap: ' + siteUrl + '/sitemap.xml', ''].join('\n'),
      { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': PUBLIC_CACHE, ...SECURITY_HEADERS } }
    );
  }

  if (path === '/sitemap.xml') return sitemap(env, url);

  if (!env.DB) {
    return htmlResponse(
      errorPage({ env, message: 'The course database is not connected yet.' }),
      { status: 503, cache: NO_CACHE }
    );
  }

  if (path === '/') {
    const [featured, stats] = await Promise.all([listFeatured(env.DB, 3), countCourses(env.DB)]);
    return htmlResponse(homePage({ env, featured, stats }));
  }

  if (path === '/courses') {
    const category = (url.searchParams.get('category') || '').slice(0, 60);
    const [courses, categories] = await Promise.all([
      listPublished(env.DB, { category }),
      listCategories(env.DB),
    ]);
    return htmlResponse(coursesPage({ env, courses, categories, activeCategory: category }));
  }

  if (path.startsWith('/courses/')) {
    const slug = decodeURIComponent(path.slice('/courses/'.length)).slice(0, 120);
    if (!slug || slug.includes('/')) return notFound(env, path);

    let course = await getBySlug(env.DB, slug);
    let preview = false;

    // Signed-in admins can open a draft to check it before publishing.
    if (!course && (await isAuthenticated(request, env))) {
      course = await getBySlug(env.DB, slug, { includeDrafts: true });
      preview = Boolean(course);
    }
    if (!course) return notFound(env, path);

    const all = await listPublished(env.DB, { limit: 4 });
    const related = all.filter((c) => c.slug !== course.slug).slice(0, 3);

    return htmlResponse(coursePage({ env, course, related, preview }), {
      cache: preview ? NO_CACHE : PUBLIC_CACHE,
    });
  }

  if (path === '/about') return htmlResponse(aboutPage({ env }));
  if (path === '/contact') return htmlResponse(contactPage({ env }));

  return notFound(env, path);
}

function notFound(env, path) {
  return htmlResponse(notFoundPage({ env, path }), { status: 404, cache: NO_CACHE });
}

async function sitemap(env, url) {
  const siteUrl = (env.SITE_URL || url.origin).replace(/\/$/, '');
  const staticPaths = ['/', '/courses', '/about', '/contact'];
  let courses = [];
  try {
    if (env.DB) courses = await listPublished(env.DB, { limit: 500 });
  } catch (err) {
    console.error('sitemap query failed', err);
  }

  const entries = staticPaths
    .map((p) => '  <url><loc>' + escXml(siteUrl + p) + '</loc><changefreq>weekly</changefreq></url>')
    .concat(
      courses.map(
        (c) =>
          '  <url><loc>' + escXml(siteUrl + '/courses/' + c.slug) + '</loc>' +
          '<lastmod>' + escXml(String(c.updated_at || '').slice(0, 10)) + '</lastmod>' +
          '<changefreq>weekly</changefreq></url>'
      )
    );

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries.join('\n') +
    '\n</urlset>\n';

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': PUBLIC_CACHE, ...SECURITY_HEADERS },
  });
}

function escXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
