/**
 * Admin surface: a password-gated console for creating, editing and
 * publishing courses. The console itself is a small client-side app that
 * talks to the JSON API below; only the login screen is server-rendered.
 */

import { esc, BRAND_MARK } from './html.js';
import {
  listAll, getById, createCourse, updateCourse, deleteCourse,
  setPublished, countCourses, ValidationError,
} from './db.js';
import {
  isAuthenticated, createSessionCookie, clearSessionCookie, passwordMatches,
  clientIp, checkLoginRate, recordLoginFailure, clearLoginFailures, sameOrigin,
} from './auth.js';

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });

const noStoreHtml = (body, status = 200, headers = {}) =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow',
      ...headers,
    },
  });

/* ---------- login screen ---------- */

function loginPage({ error = '', notice = '' } = {}) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Admin sign in — LumoraSpace Academy</title>
<meta name="theme-color" content="#050505" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/favicon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap">
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/admin.css">
<script>(function(){try{var t=localStorage.getItem('ls-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();</script>
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
    ${error ? '<p class="form-error" role="alert">' + esc(error) + '</p>' : ''}
    ${notice ? '<p class="form-notice">' + esc(notice) + '</p>' : ''}
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

/* ---------- console shell ---------- */

function consolePage({ stats }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Course admin — LumoraSpace Academy</title>
<meta name="theme-color" content="#050505" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/favicon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap">
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/admin.css">
<script>(function(){try{var t=localStorage.getItem('ls-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();</script>
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
    <p class="admin-loading">Loading courses…</p>
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

<script src="/admin.js" defer></script>
</body>
</html>`;
}

/* ---------- routing ---------- */

/**
 * Handles every /admin and /api/admin route.
 * Returns null when the path is not ours, so the public router can take over.
 */
export async function handleAdmin(request, env, url) {
  const path = url.pathname;
  const isApi = path.startsWith('/api/admin');
  if (!path.startsWith('/admin') && !isApi) return null;

  const secure = url.protocol === 'https:';

  if (!env.DB) {
    return isApi
      ? json({ error: 'Database is not bound. Set database_id in wrangler.toml.' }, 500)
      : noStoreHtml(loginPage({ error: 'Database is not connected yet. Check wrangler.toml.' }), 500);
  }

  /* --- sign in --- */
  const isRead = request.method === 'GET' || request.method === 'HEAD';

  if (path === '/admin/login') {
    if (isRead) {
      if (await isAuthenticated(request, env)) return Response.redirect(url.origin + '/admin', 302);
      return noStoreHtml(loginPage());
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    if (!sameOrigin(request)) return noStoreHtml(loginPage({ error: 'Request blocked.' }), 403);

    const ip = clientIp(request);
    const rate = await checkLoginRate(env.DB, ip);
    if (!rate.allowed) {
      const mins = Math.ceil(rate.retryAfterSec / 60);
      return noStoreHtml(
        loginPage({ error: 'Too many attempts. Try again in about ' + mins + ' minute' + (mins === 1 ? '' : 's') + '.' }),
        429,
        { 'Retry-After': String(rate.retryAfterSec) }
      );
    }

    const form = await request.formData();
    const password = String(form.get('password') || '');
    let ok = false;
    try {
      ok = passwordMatches(env, password);
    } catch (err) {
      return noStoreHtml(loginPage({ error: err.message }), 500);
    }

    if (!ok) {
      await recordLoginFailure(env.DB, ip);
      return noStoreHtml(loginPage({ error: 'Incorrect password.' }), 401);
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
      headers: { Location: '/admin', 'Set-Cookie': cookie, 'Cache-Control': 'no-store' },
    });
  }

  /* --- sign out --- */
  if (path === '/admin/logout' && request.method === 'POST') {
    return new Response(null, {
      status: 303,
      headers: { Location: '/admin/login', 'Set-Cookie': clearSessionCookie({ secure }), 'Cache-Control': 'no-store' },
    });
  }

  /* --- everything past here needs a session --- */
  const authed = await isAuthenticated(request, env);
  if (!authed) {
    if (isApi) return json({ error: 'Not signed in.' }, 401);
    return new Response(null, { status: 302, headers: { Location: '/admin/login', 'Cache-Control': 'no-store' } });
  }

  if (isApi) {
    if (!isRead && !sameOrigin(request)) return json({ error: 'Request blocked.' }, 403);
    return handleApi(request, env, url);
  }

  if (path === '/admin' || path === '/admin/') {
    if (!isRead) return new Response('Method not allowed', { status: 405 });
    const stats = await countCourses(env.DB);
    return noStoreHtml(consolePage({ stats }));
  }

  return new Response(null, { status: 302, headers: { Location: '/admin', 'Cache-Control': 'no-store' } });
}

/* ---------- JSON API ---------- */

async function handleApi(request, env, url) {
  const segments = url.pathname.replace(/^\/api\/admin\/?/, '').split('/').filter(Boolean);
  const db = env.DB;

  try {
    if (segments[0] !== 'courses') return json({ error: 'Unknown endpoint.' }, 404);

    // /api/admin/courses
    if (segments.length === 1) {
      if (request.method === 'GET') {
        const [courses, stats] = await Promise.all([listAll(db), countCourses(db)]);
        return json({ courses, stats });
      }
      if (request.method === 'POST') {
        const course = await createCourse(db, await readJson(request));
        const stats = await countCourses(db);
        return json({ course, stats }, 201);
      }
      return json({ error: 'Method not allowed' }, 405);
    }

    const id = Number(segments[1]);
    if (!Number.isInteger(id) || id <= 0) return json({ error: 'Invalid course id.' }, 400);

    // /api/admin/courses/:id/publish
    if (segments[2] === 'publish' && request.method === 'POST') {
      const body = await readJson(request);
      const course = await setPublished(db, id, Boolean(body.published));
      if (!course) return json({ error: 'Course not found.' }, 404);
      const stats = await countCourses(db);
      return json({ course, stats });
    }

    if (segments.length !== 2) return json({ error: 'Unknown endpoint.' }, 404);

    if (request.method === 'GET') {
      const course = await getById(db, id);
      return course ? json({ course }) : json({ error: 'Course not found.' }, 404);
    }
    if (request.method === 'PUT' || request.method === 'PATCH') {
      const course = await updateCourse(db, id, await readJson(request));
      if (!course) return json({ error: 'Course not found.' }, 404);
      const stats = await countCourses(db);
      return json({ course, stats });
    }
    if (request.method === 'DELETE') {
      const removed = await deleteCourse(db, id);
      if (!removed) return json({ error: 'Course not found.' }, 404);
      const stats = await countCourses(db);
      return json({ ok: true, stats });
    }
    return json({ error: 'Method not allowed' }, 405);
  } catch (err) {
    if (err instanceof ValidationError) return json({ error: err.message }, 400);
    console.error('admin api error', err);
    return json({ error: 'Something went wrong saving that. Please try again.' }, 500);
  }
}

async function readJson(request) {
  const text = await request.text();
  if (text.length > 200_000) throw new ValidationError('That course is too large to save.');
  try {
    const data = JSON.parse(text || '{}');
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('bad shape');
    return data;
  } catch {
    throw new ValidationError('Could not read the submitted data.');
  }
}
