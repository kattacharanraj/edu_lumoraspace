/**
 * Server-rendered public pages.
 * Everything here is read-only: the only action a visitor can take is
 * following a course's registration link out to Google Forms.
 */

import { esc, layout, jsonArray, paragraphs, safeUrl } from './html.js';

/* ---------- small shared pieces ---------- */

function pill(text) {
  return text ? '<span class="pill">' + esc(text) + '</span>' : '';
}

function courseMeta(course) {
  return [pill(course.duration), pill(course.level), pill(course.mode)].filter(Boolean).join('');
}

/** Course card used on the home page and the catalog. */
function courseCard(course, index) {
  const tags = jsonArray(course.tags).slice(0, 3);
  const num = String(index + 1).padStart(2, '0');
  const img = safeUrl(course.image_url);
  return `
<article class="course-card">
  <a class="course-card-link" href="/courses/${esc(course.slug)}" aria-label="${esc(course.title)}">
    ${img
      ? `<div class="course-card-media"><img src="${esc(img)}" alt="" loading="lazy" decoding="async"></div>`
      : `<div class="course-card-media course-card-media--blank" aria-hidden="true"><span>${esc(num)}</span></div>`}
    <div class="course-card-body">
      <div class="course-card-top">
        <span class="eyebrow">${esc(course.category)}</span>
        ${course.featured ? '<span class="badge">Featured</span>' : ''}
      </div>
      <h3 class="course-card-title">${esc(course.title)}</h3>
      <p class="course-card-summary">${esc(course.summary)}</p>
      ${tags.length ? '<div class="tag-row">' + tags.map((t) => '<span class="tag">' + esc(t) + '</span>').join('') + '</div>' : ''}
      <div class="course-card-meta">${courseMeta(course)}</div>
      <div class="course-card-foot">
        <span class="price">${esc(course.price_label || 'Free')}</span>
        <span class="link-arrow">View course <i aria-hidden="true">&rarr;</i></span>
      </div>
    </div>
  </a>
</article>`;
}

function emptyState(message, hint) {
  return `
<div class="empty-state">
  <p class="empty-title">${esc(message)}</p>
  ${hint ? '<p class="empty-hint">' + esc(hint) + '</p>' : ''}
</div>`;
}

/* ---------- home ---------- */

const DIFFERENTIATORS = [
  {
    n: '01',
    title: 'Direction',
    body: 'Every program is a sequence, not a playlist. You always know what you are learning this week and why it comes before the next thing.',
  },
  {
    n: '02',
    title: 'Built, not watched',
    body: 'Each module ends in something you have actually made. You finish with work you can show, not a folder of finished videos.',
  },
  {
    n: '03',
    title: 'Mentorship',
    body: 'Live sessions and real feedback from people who have already shipped what you are trying to build.',
  },
  {
    n: '04',
    title: 'Community',
    body: 'Learn beside other students at your level. Momentum is much easier to keep when you are not doing it alone.',
  },
];

const STEPS = [
  { n: '01', title: 'Explore', body: 'Browse the catalog and open the course that matches where you are right now.' },
  { n: '02', title: 'Register', body: 'Hit Register Now. You will be taken to a short Google Form to submit your details.' },
  { n: '03', title: 'Get confirmed', body: 'Our team reviews registrations and sends you the joining details before the cohort starts.' },
  { n: '04', title: 'Learn and build', body: 'Show up, ship the work, and finish with a project and a certificate.' },
];

const FAQS = [
  {
    q: 'Who are these courses for?',
    a: 'Students, final-year undergraduates and early-career professionals. Most programs assume no prior experience and say so on the course page; where a prerequisite exists it is listed there.',
  },
  {
    q: 'How does registration work?',
    a: 'Every course page has a Register Now button that opens a Google Form. Fill it in once and our team will follow up over email with the joining details.',
  },
  {
    q: 'Do I need to pay anything to register?',
    a: 'The price for each program is shown on its own page. Registering through the form never charges you anything on the spot; if a program has a fee, our team explains the payment step in the follow-up email.',
  },
  {
    q: 'Are the sessions live or recorded?',
    a: 'The mode is listed on each course page. Live programs run on a fixed weekly schedule, which is also shown there.',
  },
  {
    q: 'Do I get a certificate?',
    a: 'Yes, on completion of the program requirements. Each course page lists exactly what is included.',
  },
  {
    q: 'What if I miss a cohort?',
    a: 'Register anyway. Registrations stay on file and we will tell you when the next cohort opens.',
  },
];

export function homePage({ env, featured, stats }) {
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
    ${featured.length
      ? '<div class="course-grid" data-reveal-group>' + featured.map((c, i) => courseCard(c, i)).join('') + '</div>' +
        '<div class="section-foot" data-reveal><a class="btn btn-ghost" href="/courses" data-magnetic>See all courses <i aria-hidden="true">&rarr;</i></a></div>'
      : emptyState('No courses are published yet.', 'New programs are added regularly — check back shortly.')}
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
      ).join('')}
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
      ).join('')}
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
      ).join('')}
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
    title: '',
    description:
      'LumoraSpace Academy runs structured, mentor-led courses for students and early-career builders. Browse the catalog and register in minutes.',
    path: '/',
    env,
    body,
  });
}

/* ---------- catalog ---------- */

export function coursesPage({ env, courses, categories, activeCategory }) {
  const chips = [{ category: '', n: 0 }].concat(categories);
  const chipHtml = chips
    .map((c) => {
      const label = c.category || 'All';
      const href = c.category ? '/courses?category=' + encodeURIComponent(c.category) : '/courses';
      const active = (activeCategory || '') === (c.category || '');
      return (
        '<a class="chip' + (active ? ' is-active' : '') + '" href="' + esc(href) + '"' +
        (active ? ' aria-current="true"' : '') + '>' + esc(label) + '</a>'
      );
    })
    .join('');

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
    ${categories.length > 1 ? '<div class="chip-row" data-reveal role="navigation" aria-label="Filter by category">' + chipHtml + '</div>' : ''}
    ${courses.length
      ? '<div class="course-grid" data-reveal-group>' + courses.map((c, i) => courseCard(c, i)).join('') + '</div>'
      : emptyState(
          activeCategory ? 'No published courses in this category yet.' : 'No courses are published yet.',
          'New programs are added regularly — check back shortly.'
        )}
  </div>
</section>`;

  return layout({
    title: activeCategory ? activeCategory + ' courses' : 'Courses',
    description: 'Browse every course open for registration at LumoraSpace Academy.',
    path: '/courses',
    env,
    body,
  });
}

/* ---------- course detail ---------- */

export function coursePage({ env, course, related, preview = false }) {
  const highlights = jsonArray(course.highlights);
  const curriculum = jsonArray(course.curriculum);
  const tags = jsonArray(course.tags);
  const registerUrl = safeUrl(course.register_url);
  const img = safeUrl(course.image_url);
  const siteUrl = (env.SITE_URL || 'https://edu.lumoraspace.in').replace(/\/$/, '');

  const facts = [
    ['Duration', course.duration],
    ['Level', course.level],
    ['Mode', course.mode],
    ['Schedule', course.schedule],
    ['Starts', course.start_label],
    ['Seats', course.seats_label],
  ].filter(([, v]) => v);

  const registerBlock = registerUrl
    ? `<a class="btn btn-primary btn-lg btn-block" href="${esc(registerUrl)}" target="_blank" rel="noopener noreferrer">
         Register Now <i aria-hidden="true">&rarr;</i>
       </a>
       <p class="register-note">Opens the registration form in a new tab.</p>`
    : `<button class="btn btn-primary btn-lg btn-block" type="button" disabled>Registration opening soon</button>
       <p class="register-note">This course is not accepting registrations yet.</p>`;

  // Structured data so the course can surface in search results.
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.summary || course.description.slice(0, 300),
    url: siteUrl + '/courses/' + course.slug,
    provider: {
      '@type': 'Organization',
      name: 'LumoraSpace Academy',
      sameAs: env.PARENT_URL || 'https://lumoraspace.in',
    },
  };

  const body = `
${preview ? '<div class="preview-banner">Draft preview — this course is not published yet. <a href="/admin">Back to admin</a></div>' : ''}
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
        ${course.summary ? '<p class="course-lede">' + esc(course.summary) + '</p>' : ''}
        <div class="course-card-meta">${courseMeta(course)}</div>
        ${tags.length ? '<div class="tag-row">' + tags.map((t) => '<span class="tag">' + esc(t) + '</span>').join('') + '</div>' : ''}
      </div>
      ${img ? `<div class="course-hero-media"><img src="${esc(img)}" alt="" loading="lazy" decoding="async"></div>` : ''}
    </div>
  </div>
</section>

<section class="section section-tight">
  <div class="shell course-layout">
    <div class="course-main">
      ${course.description
        ? `<div class="prose" data-reveal>
             <h2 class="block-title">About this course</h2>
             ${paragraphs(course.description)}
           </div>`
        : ''}

      ${curriculum.length
        ? `<div class="block" data-reveal>
             <h2 class="block-title">What you will cover</h2>
             <ol class="curriculum">
               ${curriculum
                 .map(
                   (m, i) => `
               <li class="module">
                 <span class="module-index">${esc(String(i + 1).padStart(2, '0'))}</span>
                 <div class="module-body">
                   <h3>${esc(m.title)}</h3>
                   ${m.detail ? '<p>' + esc(m.detail) + '</p>' : ''}
                 </div>
               </li>`
                 )
                 .join('')}
             </ol>
           </div>`
        : ''}

      ${highlights.length
        ? `<div class="block" data-reveal>
             <h2 class="block-title">What is included</h2>
             <ul class="check-list">
               ${highlights.map((h) => '<li><i aria-hidden="true"></i><span>' + esc(h) + '</span></li>').join('')}
             </ul>
           </div>`
        : ''}
    </div>

    <aside class="course-aside" data-reveal>
      <div class="register-card">
        <div class="register-price">
          <span class="register-price-label">Programme fee</span>
          <strong>${esc(course.price_label || 'Free')}</strong>
        </div>
        ${facts.length
          ? '<dl class="fact-list">' +
            facts.map(([k, v]) => '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>').join('') +
            '</dl>'
          : ''}
        ${registerBlock}
        <a class="register-help" href="/contact">Have a question first?</a>
      </div>
    </aside>
  </div>
</section>

${related.length
  ? `<section class="section section-alt">
       <div class="shell">
         <header class="section-head">
           <span class="eyebrow">Keep exploring</span>
           <h2 class="section-title">Other programs</h2>
         </header>
         <div class="course-grid" data-reveal-group>${related.map((c, i) => courseCard(c, i)).join('')}</div>
       </div>
     </section>`
  : ''}`;

  return layout({
    title: course.title,
    description: course.summary || course.description.slice(0, 160),
    path: '/courses/' + course.slug,
    env,
    ogImage: img,
    head: '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>',
    body,
  });
}

/* ---------- about ---------- */

export function aboutPage({ env }) {
  const parentUrl = env.PARENT_URL || 'https://lumoraspace.in';
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
      ).join('')}
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
    title: 'About',
    description: 'LumoraSpace Academy is the structured-programs arm of the LumoraSpace student growth ecosystem.',
    path: '/about',
    env,
    body,
  });
}

/* ---------- contact ---------- */

export function contactPage({ env }) {
  const email = env.CONTACT_EMAIL || 'hello@lumoraspace.in';
  const parentUrl = env.PARENT_URL || 'https://lumoraspace.in';
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
    title: 'Contact',
    description: 'Get in touch with the LumoraSpace Academy team about courses, cohorts and registrations.',
    path: '/contact',
    env,
    body,
  });
}

/* ---------- errors ---------- */

export function notFoundPage({ env, path = '/404' }) {
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
  return layout({ title: 'Page not found', path, env, body });
}

export function errorPage({ env, message }) {
  const body = `
<section class="page-head error-head">
  <div class="shell">
    <span class="eyebrow eyebrow-lg">Something went wrong</span>
    <h1 class="page-title">This page could not be loaded</h1>
    <p class="page-sub">${esc(message || 'Please try again in a moment.')}</p>
    <div class="hero-actions">
      <a class="btn btn-primary btn-lg" href="/">Go home</a>
    </div>
  </div>
</section>`;
  return layout({ title: 'Error', path: '/error', env, body });
}
