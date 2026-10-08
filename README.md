# edu.lumoraspace.in — LumoraSpace Academy (v0)

A course catalog for LumoraSpace, deployed as a single Cloudflare Worker.

**What v0 does**

- Public, server-rendered course catalog matching the lumoraspace.in design system
- An admin console where you create a course, paste its **Google Form link**, and publish it
- The public **Register Now** button opens that form in a new tab

**What v0 deliberately does not do** — student accounts, sign-in, payments, or an
in-house registration form. Those are v1. Registrations live entirely in your Google
Sheet, exactly as they do today.

---

## Architecture

| Piece | Choice | Why |
|---|---|---|
| Runtime | One Cloudflare Worker | Single deploy, no origin server |
| Pages | Rendered on the server | Course pages are indexable; first paint needs no JS |
| Storage | Cloudflare D1 (SQLite) | Courses only — no personal data is stored anywhere |
| Assets | `public/` via the Workers assets binding | CSS, client JS and the favicon |
| Admin auth | Password secret + HMAC-signed cookie | One privileged role, so no user table needed |

```
src/index.js         routing, caching, security headers, robots + sitemap
src/pages.js         the public pages
src/admin.js         login screen, admin console, JSON API
src/db.js            D1 queries and input normalisation
src/auth.js          sessions, password check, sign-in throttling
src/html.js          escaping helpers and the page shell
public/              everything served: css, js, brand images, hero video
brand/               logo source art (not served)
scripts/             brand asset generator
migrations/          0001_init.sql (schema), 0002_seed.sql (sample courses)
```

---

## Deploying

### 1. Sign in to Cloudflare

```bash
npx wrangler login
```

### 2. Create the database

```bash
npm run db:create
```

Copy the printed `database_id` into `wrangler.toml`, replacing the placeholder.

### 3. Create the tables

```bash
npm run db:init      # schema
npm run db:seed      # optional: three sample courses
```

### 4. Set the two secrets

```bash
npx wrangler secret put ADMIN_PASSWORD    # the admin console password
npx wrangler secret put SESSION_SECRET    # 32+ random characters
```

Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Deploy

```bash
npm run deploy
```

`wrangler.toml` claims `edu.lumoraspace.in` as a custom domain. This works because
`lumoraspace.in` is already an active zone on your Cloudflare account — Wrangler
creates the DNS record for the subdomain itself. No manual CNAME needed.

---

## Running locally

```bash
cp .dev.vars.example .dev.vars   # then edit the two values
npm run db:init:local
npm run db:seed:local
npm run dev
```

Site at `http://localhost:8787`, admin at `http://localhost:8787/admin`.

`.dev.vars` is gitignored and is never used in production — deployed secrets come
only from `wrangler secret put`.

---

## Publishing a course

1. Go to `edu.lumoraspace.in/admin` and sign in.
2. **New course** → fill in the title, summary and description.
3. Paste the Google Form URL into **Google Form link**. This is exactly where the
   Register Now button sends students.
4. Add details, highlights and curriculum modules as needed.
5. Turn on **Published** and save — or save as a draft and hit **Publish** later.

A course cannot be published without a registration link; the console blocks it and
says so. **Preview** opens a draft in the real page layout while you are signed in.

Published pages are cached at the edge for 60 seconds, so a change goes live within
about a minute.

---

## Design system

Taken from lumoraspace.in so the subdomain matches the parent site.

| Token | Dark | Light |
|---|---|---|
| Background | `#050505` | `#ffffff` |
| Surface / card | `#141414` | `#f5f5f5` |
| Heading text | `#f5f5f5` | `#0a0a0a` |
| Body text | `#a8a8a8` | `#52525b` |
| Primary | `#d9d9d9` | `#0a0a0a` |
| Border | `rgba(255,255,255,.08)` | `rgba(10,10,10,.10)` |

Type: **Space Grotesk** headings, **Inter** body, **Cormorant Garamond** for accents.
Radius `1.25rem`.

**Theming** follows the browser and OS by default. The toggle in the header overrides
it and remembers the choice in `localStorage`; the OS is followed again until an
explicit choice is made. An inline script applies the saved theme before first paint,
so there is no flash.

**Responsive** from 320px up. Single column on phones, two at 600px, three at 900px,
with a sticky registration card on desktop. Safe-area insets are handled for iPhone
notches, `hover: none` devices drop hover-only affordances, and
`prefers-reduced-motion` is respected.

---

## Brand assets

| File | Purpose |
|---|---|
| `brand/logo-source.png` | The supplied master art, 1536×1024 with alpha. **Source only — never served.** |
| `public/logo.png` | Header and footer mark, 170×256 transparent |
| `public/favicon-32.png` | Browser tab, rounded dark tile |
| `public/favicon-180.png` | `apple-touch-icon`, square dark tile |
| `public/favicon-512.png` | Large icon / PWA, rounded dark tile |

The supplied art is a white glow on transparency, so **one file serves both themes**:
the light theme applies `filter: invert(1)` to turn it graphite. The favicons put the
mark on a `#050505` tile so it stays legible against any browser chrome.

To regenerate after replacing `brand/logo-source.png`:

```bash
npm run brand
```

That runs `scripts/build-brand.js`, which crops to the mark's alpha bounding box,
area-resamples, and composites the tiles. It uses a small built-in PNG codec
(`scripts/png.js`), so there is **no ImageMagick, ffmpeg or native image dependency** —
it runs anywhere Node runs.

---

## Hero background video

`public/silk_flow_bg.mp4` — 848×480, H.264, 20s loop, no audio track, 3.6 MB.

It is the hero background on capable devices. Because it is 3.6 MB, **the `src` is
attached by JavaScript, never in the HTML**, so devices that are skipped download
nothing at all.

**It loads when all of these hold:**

- viewport ≥ 640px (phones are skipped — change `MIN_WIDTH` in `public/app.js`)
- no `prefers-reduced-motion: reduce`
- no Save-Data header and not a 2G connection

**If it cannot play** — autoplay refused, decode error — the element is removed to stop
the download and the WebGL shader takes over as the fallback. The two never run at once.

The clip pauses when the hero scrolls off screen and when the tab is hidden.

Two knobs in `public/styles.css`:

- `--hero-video-opacity` — `0.5` dark / `0.26` light. Raise for a bolder hero.
- `.fx-video { filter: blur(1px) saturate(0); }` — `saturate(0)` locks it to the
  black/white/graphite palette. Drop it to keep the clip's original colour.

`.hero-scrim` sits above the video and fades it into the page background so the
headline keeps its contrast and the clip has no hard rectangular edge.

---

## Motion layer

Written by hand — no three.js, no GSAP, no particles.js. The whole thing costs
**8.8 KB of CSS and 7.0 KB of JS gzipped**, and one `requestAnimationFrame` loop
drives every animation on the page.

| Effect | Where | Notes |
|---|---|---|
| Hero video | Hero background | The supplied silk-flow clip, gated by device and connection |
| WebGL aurora shader | Hero fallback | fbm noise, drifts toward the pointer; only runs when the video cannot |
| Particle field | Hero + CTA band | 18-54 drifting dots with proximity links, gently attracted to the cursor |
| Custom cursor | Site-wide | Exact dot plus a ring that trails with easing and grows over anything clickable |
| Card tilt + spotlight | Course cards | 5° perspective tilt with a radial highlight tracking the pointer |
| Magnetic buttons | Primary CTAs | Pull toward the cursor with distance falloff |
| Scroll reveal | Every section | IntersectionObserver, staggered across grid children |
| Shine sweep | All buttons | Gradient wipe on hover |
| Scroll progress | Top of viewport | 2px bar |
| Counter | "Live courses" stat | Counts up on entry |
| Smooth accordion | FAQ | Height animated via Web Animations API |

### How it stays fast

- **One rAF loop.** All animation registers a ticker on a single loop, which stops
  completely on `visibilitychange` when the tab is hidden.
- **No layout thrash.** Element rects are cached and refreshed on scroll/resize, never
  read inside the render loop.
- **Off-screen canvases idle.** Each canvas has an IntersectionObserver; when it scrolls
  out of view its ticker returns immediately.
- **DPR capped at 2**, so a 4K or Retina display does not quadruple the fill cost.

### Capability gates

The heavy layer (shader, particles, cursor, tilt, magnetism) requires **all** of
`pointer: fine`, no `prefers-reduced-motion`, and a viewport of at least 900px. Phones
and tablets get the design and the reveals, and never pay for the canvas work — it is
switched off in both CSS and JS, so nothing is even allocated.

`prefers-reduced-motion: reduce` disables the entire motion layer and forces every
revealed element to its final visible state.

### Failure behaviour

Content visibility never depends on the effects running:

| Scenario | Result |
|---|---|
| JavaScript disabled | Page renders normally, fully readable |
| `app.js` blocked or fails | Inline head script reveals the page after load; all sections plainly visible |
| Video blocked or fails | Element removed, WebGL shader takes over |
| WebGL unavailable too | Both skipped, CSS radial glow remains |
| `IntersectionObserver` missing | Everything is revealed immediately |

The reveal styles are gated on a `.motion` class that **only `app.js` sets**, so a
blocked script can never leave a section stuck at `opacity: 0`.

---

## Security and load

- Sign-in is throttled per IP: 5 failed attempts triggers a 15-minute lockout
- Session cookies are `HttpOnly`, `Secure`, `SameSite=Lax`, and expire after 8 hours
- Password and cookie signature comparisons are constant-time
- Admin writes are rejected if the `Origin` header is cross-site
- Every value the admin types is escaped on output; links are scheme-checked, so a
  pasted `javascript:` URL cannot become a button
- `/admin` and `/api/` are excluded in `robots.txt` and sent with `noindex`
- CSP, `nosniff`, `frame-ancestors 'none'` and a referrer policy on every response
- Public pages are edge-cached for 60s, so traffic spikes do not hit D1 per view

**Known hardening left for v1:** the CSP allows `'unsafe-inline'` for scripts because
of the pre-paint theme bootstrap and the JSON-LD blocks. Moving those to nonces is the
next step if you want a strict policy.

---

## Roadmap to v1

Not built yet, but the schema and routing leave room for it:

- Google and email sign-in for students (no 2FA, per the brief)
- In-house registration replacing the Google Form redirect
- Payment gateway
- A student dashboard: current enrollments, history, and payments
