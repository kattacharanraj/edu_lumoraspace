/* ============================================================
   LumoraSpace Academy — public site behaviour.

   Layer 1 (always on):  theme, mobile menu, sticky header.
   Layer 2 (motion):     reveals, counters, smooth accordion.
   Layer 3 (heavy):      WebGL shader, particles, tilt, magnetism,
                         custom cursor — desktop pointers only.

   Everything degrades: the pages are fully readable and usable
   with this file blocked. One rAF loop drives all animation and
   it stops entirely when the tab is hidden.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var STORAGE_KEY = 'ls-theme';

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = window.matchMedia('(pointer: fine)');
  var mqDark = window.matchMedia('(prefers-color-scheme: dark)');

  var reduced = mqReduce.matches;
  /* Heavy effects need a real pointer, a reasonable viewport, and consent. */
  var richOk = mqFine.matches && !reduced && window.innerWidth >= 900;

  function on(mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn);
  }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* Element rects are cached and refreshed on scroll/resize. Reading them
     inside the render loop would force a synchronous layout every frame. */
  var rectWatchers = [];

  function watchRect(el) {
    var o = { el: el, rect: el.getBoundingClientRect() };
    rectWatchers.push(o);
    return o;
  }

  function refreshRects() {
    for (var i = 0; i < rectWatchers.length; i++) {
      rectWatchers[i].rect = rectWatchers[i].el.getBoundingClientRect();
    }
  }

  window.addEventListener('resize', refreshRects);

  /* ---------------------------------------------------------
     Shared animation loop
     --------------------------------------------------------- */

  var tickers = [];
  var looping = false;

  function addTicker(fn) { tickers.push(fn); startLoop(); }

  function startLoop() {
    if (looping || !tickers.length) return;
    looping = true;
    requestAnimationFrame(step);
  }

  function step(ts) {
    if (!looping) return;
    for (var i = 0; i < tickers.length; i++) tickers[i](ts);
    requestAnimationFrame(step);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) looping = false;
    else startLoop();
  });

  /* ---------------------------------------------------------
     Theme
     --------------------------------------------------------- */

  var themeListeners = [];
  function onThemeChange(fn) { themeListeners.push(fn); }
  function emitTheme() {
    for (var i = 0; i < themeListeners.length; i++) themeListeners[i](isDark());
  }

  function systemTheme() { return mqDark.matches ? 'dark' : 'light'; }

  function storedTheme() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch (e) { return null; }
  }

  function isDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : systemTheme() === 'dark';
  }

  function syncMetaThemeColor(theme) {
    var metas = $$('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      metas[i].setAttribute('content', theme === 'dark' ? '#050505' : '#ffffff');
    }
  }

  syncMetaThemeColor(storedTheme() || systemTheme());

  $$('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      syncMetaThemeColor(next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
      emitTheme();
    });
  });

  /* Follow the OS while the visitor has not made an explicit choice. */
  on(mqDark, function (e) {
    if (storedTheme()) return;
    root.removeAttribute('data-theme');
    syncMetaThemeColor(e.matches ? 'dark' : 'light');
    emitTheme();
  });

  /* Read a design token as {r,g,b} so canvas layers match the theme. */
  function tokenRgb(name, fallback) {
    var raw = getComputedStyle(document.body).getPropertyValue(name).trim();
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(raw);
    if (!m) return fallback;
    var h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  /* ---------------------------------------------------------
     Page entrance

     .motion is what actually arms the reveal styles. It is set here, and
     only here, so that if this file fails to load the inline failsafe in
     the head still shows the page with every section plainly visible.
     --------------------------------------------------------- */

  root.classList.add('motion');
  requestAnimationFrame(function () { root.classList.add('is-ready'); });

  /* ---------------------------------------------------------
     Mobile menu
     --------------------------------------------------------- */

  var burger = $('[data-menu-toggle]');
  var menu = document.getElementById('mobileMenu');

  function setMenu(open) {
    if (!burger || !menu) return;
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
  }

  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); }
    });
    var mqDesktop = window.matchMedia('(min-width: 900px)');
    on(mqDesktop, function (e) { if (e.matches) setMenu(false); });
  }

  /* ---------------------------------------------------------
     Sticky header + scroll progress
     --------------------------------------------------------- */

  var header = document.getElementById('siteHeader');
  var progress = document.getElementById('scrollProgress');
  var scrollQueued = false;

  function onScroll() {
    if (header) header.classList.toggle('is-stuck', window.scrollY > 8);
    if (progress && !reduced) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 40 ? clamp(window.scrollY / max, 0, 1) : 0;
      progress.style.transform = 'scaleX(' + pct + ')';
      progress.classList.toggle('is-on', pct > 0.002);
    }
    refreshRects();
    scrollQueued = false;
  }

  onScroll();
  window.addEventListener('scroll', function () {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* ---------------------------------------------------------
     Scroll reveal + counters
     --------------------------------------------------------- */

  var revealTargets = $$('[data-reveal], [data-reveal-group]');

  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (!isFinite(target)) return;
    if (reduced || target === 0) { el.textContent = String(target); return; }
    var start = performance.now();
    var dur = 900;
    addTicker(function tick(ts) {
      var p = clamp((ts - start) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p >= 1) {
        var idx = tickers.indexOf(tick);
        if (idx > -1) tickers.splice(idx, 1);
      }
    });
  }

  if ('IntersectionObserver' in window && revealTargets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
  }

  var counters = $$('[data-count]');
  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          cio.unobserve(entry.target);
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
    } else {
      counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
    }
  }

  /* ---------------------------------------------------------
     Smooth FAQ accordion
     --------------------------------------------------------- */

  if (!reduced && typeof Element !== 'undefined' && Element.prototype.animate) {
    $$('.faq-item').forEach(function (item) {
      var summary = $('summary', item);
      var answer = $('.faq-answer', item);
      if (!summary || !answer) return;
      var busy = false;

      summary.addEventListener('click', function (e) {
        e.preventDefault();
        if (busy) return;
        busy = true;
        answer.style.overflow = 'hidden';

        if (item.open) {
          var h = answer.offsetHeight;
          var closing = answer.animate(
            [{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
            { duration: 260, easing: 'cubic-bezier(0.22,0.61,0.36,1)' }
          );
          closing.onfinish = function () {
            item.open = false;
            answer.style.overflow = '';
            busy = false;
          };
        } else {
          item.open = true;
          var target = answer.offsetHeight;
          var opening = answer.animate(
            [{ height: '0px', opacity: 0 }, { height: target + 'px', opacity: 1 }],
            { duration: 320, easing: 'cubic-bezier(0.22,0.61,0.36,1)' }
          );
          opening.onfinish = function () {
            answer.style.overflow = '';
            busy = false;
          };
        }
      });
    });
  }

  /* ---------------------------------------------------------
     Hero background video

     Sits above the desktop gate because tablets should get it too.
     The src is attached from here, never in the HTML, so devices we
     skip download nothing at all.
     --------------------------------------------------------- */

  var videoAttempting = false;
  var videoFailedCbs = [];

  /* Runs fn only if the hero video is not going to play. */
  function ifNoHeroVideo(fn) {
    if (!videoAttempting) fn();
    else videoFailedCbs.push(fn);
  }

  function heroVideoFailed() {
    if (!videoAttempting) return;
    videoAttempting = false;
    var cbs = videoFailedCbs.splice(0);
    for (var i = 0; i < cbs.length; i++) cbs[i]();
  }

  (function heroVideo() {
    var video = $('[data-hero-video]');
    if (!video) return;

    var conn = navigator.connection || navigator.webkitConnection || null;
    var saveData = !!(conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')));

    /* Phones keep the 3.6 MB. Raise/lower this one number to change that. */
    var MIN_WIDTH = 640;

    if (reduced || saveData || window.innerWidth < MIN_WIDTH) {
      video.remove();
      return;
    }

    videoAttempting = true;

    /* Genuine failure (decode error, or autoplay refused): drop the element so
       the browser stops fetching it, then let the shader take over.
       Deliberately not wired to 'stalled', which fires on merely slow networks. */
    function giveUp() {
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
        video.remove();
      } catch (e) {}
      heroVideoFailed();
    }

    video.addEventListener('playing', function () {
      video.classList.add('is-on');
    });
    video.addEventListener('error', giveUp);

    video.preload = 'auto';
    video.src = '/silk_flow_bg.mp4';
    video.load();

    var p = video.play();
    if (p && p.catch) p.catch(giveUp);

    /* Stop decoding once the hero is off screen or the tab is hidden. */
    function resume() {
      if (document.hidden || !video.paused || !video.isConnected) return;
      var pr = video.play();
      if (pr && pr.catch) pr.catch(function () {});
    }

    if ('IntersectionObserver' in window) {
      var onScreen = true;
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen) resume();
        else video.pause();
      }, { threshold: 0.01 }).observe(video);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) video.pause();
      else resume();
    });
  })();

  /* ---------------------------------------------------------
     Everything below is desktop-pointer only
     --------------------------------------------------------- */

  if (!richOk) return;

  /* ---------- magnetic buttons ---------- */

  $$('[data-magnetic]').forEach(function (el) {
    var pull = 0.28;
    var radius = 90;

    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      var dist = Math.sqrt(dx * dx + dy * dy);
      var falloff = clamp(1 - dist / (Math.max(r.width, r.height) / 2 + radius), 0, 1);
      el.classList.add('is-magnetic');
      el.style.setProperty('--mgx', (dx * pull * falloff).toFixed(2) + 'px');
      el.style.setProperty('--mgy', (dy * pull * falloff).toFixed(2) + 'px');
    });

    el.addEventListener('mouseleave', function () {
      el.classList.remove('is-magnetic');
      el.style.setProperty('--mgx', '0px');
      el.style.setProperty('--mgy', '0px');
    });
  });

  /* ---------- course card tilt + spotlight ---------- */

  $$('.course-card').forEach(function (card) {
    var maxTilt = 5;

    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      card.classList.add('is-tilting');
      card.style.setProperty('--sx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--sy', (py * 100).toFixed(1) + '%');
      card.style.setProperty('--tiltY', ((px - 0.5) * maxTilt * 2).toFixed(2) + 'deg');
      card.style.setProperty('--tiltX', ((0.5 - py) * maxTilt * 2).toFixed(2) + 'deg');
      card.style.setProperty('--lift', '-5px');
    });

    card.addEventListener('mouseleave', function () {
      card.classList.remove('is-tilting');
      card.style.setProperty('--tiltX', '0deg');
      card.style.setProperty('--tiltY', '0deg');
      card.style.setProperty('--lift', '0px');
    });
  });

  /* ---------- custom cursor ---------- */

  (function cursor() {
    var dot = $('[data-cursor-dot]');
    var ring = $('[data-cursor-ring]');
    if (!dot || !ring) return;

    root.classList.add('custom-cursor');

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;
    var shown = false;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      if (!shown) {
        shown = true;
        document.body.classList.add('cursor-on');
      }
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      shown = false;
      document.body.classList.remove('cursor-on');
    });
    document.addEventListener('mouseenter', function () {
      shown = true;
      document.body.classList.add('cursor-on');
    });

    document.addEventListener('mousedown', function () { document.body.classList.add('cursor-down'); });
    document.addEventListener('mouseup', function () { document.body.classList.remove('cursor-down'); });

    /* Grow the ring over anything clickable. */
    var HOVER_SEL = 'a, button, summary, .course-card, .chip, input, textarea, select, [role="button"]';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(HOVER_SEL)) document.body.classList.add('cursor-hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(HOVER_SEL)) document.body.classList.remove('cursor-hover');
    });

    addTicker(function () {
      /* The dot is exact; the ring trails with easing. */
      rx = lerp(rx, mx, 0.18);
      ry = lerp(ry, my, 0.18);
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      ring.style.transform = 'translate3d(' + rx.toFixed(2) + 'px,' + ry.toFixed(2) + 'px,0)';
    });
  })();

  /* ---------- shared pointer position for canvas layers ---------- */

  var pointer = { x: 0.5, y: 0.5 };
  document.addEventListener('mousemove', function (e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  }, { passive: true });

  /* Only animate a canvas while it is actually on screen. */
  function whenVisible(el, onChange) {
    if (!('IntersectionObserver' in window)) { onChange(true); return; }
    new IntersectionObserver(function (entries) {
      onChange(entries[0].isIntersecting);
    }, { threshold: 0.01 }).observe(el);
  }

  function sizeCanvas(canvas, r) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(r.width * dpr));
    var h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return { w: w, h: h, dpr: dpr, rect: r };
  }

  /* ---------- particle field ---------- */

  $$('[data-particles]').forEach(function (canvas) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var dots = [];
    var boxRef = watchRect(canvas);
    var dims = { w: 0, h: 0, dpr: 1, rect: boxRef.rect };
    var active = false;
    var rgb = tokenRgb('--text', { r: 245, g: 245, b: 245 });

    onThemeChange(function () { rgb = tokenRgb('--text', rgb); });

    function build() {
      boxRef.rect = canvas.getBoundingClientRect();
      dims = sizeCanvas(canvas, boxRef.rect);
      var cssW = dims.rect.width;
      var cssH = dims.rect.height;
      var count = clamp(Math.round(cssW / 26), 18, 54);
      dots = [];
      for (var i = 0; i < count; i++) {
        dots.push({
          x: Math.random() * cssW,
          y: Math.random() * cssH,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: 0.7 + Math.random() * 1.4,
        });
      }
    }

    build();
    if (window.ResizeObserver) new ResizeObserver(build).observe(canvas);
    else window.addEventListener('resize', build);

    whenVisible(canvas, function (vis) { active = vis; });

    addTicker(function () {
      if (!active || !dots.length) return;
      var box = boxRef.rect;
      var cssW = box.width;
      var cssH = box.height;
      if (!cssW || !cssH) return;

      ctx.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      /* pointer position in canvas-local CSS pixels */
      var pxLocal = pointer.x - box.left;
      var pyLocal = pointer.y - box.top;
      var near = pxLocal >= -120 && pxLocal <= cssW + 120 && pyLocal >= -120 && pyLocal <= cssH + 120;

      var i, j, d, a;

      for (i = 0; i < dots.length; i++) {
        var p = dots[i];
        p.x += p.vx;
        p.y += p.vy;

        /* drift back in rather than teleporting at the edges */
        if (p.x < -20) p.x = cssW + 20;
        if (p.x > cssW + 20) p.x = -20;
        if (p.y < -20) p.y = cssH + 20;
        if (p.y > cssH + 20) p.y = -20;

        if (near) {
          var ddx = pxLocal - p.x;
          var ddy = pyLocal - p.y;
          var dist2 = ddx * ddx + ddy * ddy;
          if (dist2 < 26000 && dist2 > 1) {
            var f = 0.00018;
            p.vx += ddx * f;
            p.vy += ddy * f;
          }
        }

        /* keep drift gentle */
        p.vx = clamp(p.vx, -0.5, 0.5) * 0.995;
        p.vy = clamp(p.vy, -0.5, 0.5) * 0.995;
      }

      /* links */
      ctx.lineWidth = 1;
      for (i = 0; i < dots.length; i++) {
        for (j = i + 1; j < dots.length; j++) {
          var dx = dots[i].x - dots[j].x;
          var dy = dots[i].y - dots[j].y;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d > 118) continue;
          a = (1 - d / 118) * 0.16;
          ctx.strokeStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + a.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.stroke();
        }
      }

      /* dots */
      for (i = 0; i < dots.length; i++) {
        ctx.fillStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.30)';
        ctx.beginPath();
        ctx.arc(dots[i].x, dots[i].y, dots[i].r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    canvas.classList.add('is-on');
  });

  /* ---------- WebGL aurora shader ---------- */

  function shaderLayer() {
    var canvas = $('[data-shader]');
    if (!canvas) return;

    var gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: 'low-power',
    });
    /* No WebGL? The CSS .hero-glow radial stays as the fallback. */
    if (!gl) return;

    var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';

    var FRAG = [
      'precision mediump float;',
      'uniform vec2 u_res;',
      'uniform float u_time;',
      'uniform vec2 u_mouse;',
      'uniform float u_dark;',
      'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
      'float noise(vec2 p){',
      '  vec2 i=floor(p);vec2 f=fract(p);',
      '  vec2 u=f*f*(3.0-2.0*f);',
      '  float a=hash(i),b=hash(i+vec2(1.0,0.0)),c=hash(i+vec2(0.0,1.0)),d=hash(i+vec2(1.0,1.0));',
      '  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);',
      '}',
      'float fbm(vec2 p){',
      '  float v=0.0;float a=0.5;',
      '  for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=0.5;}',
      '  return v;',
      '}',
      'void main(){',
      '  vec2 uv=gl_FragCoord.xy/u_res;',
      '  float ar=u_res.x/max(u_res.y,1.0);',
      '  vec2 p=vec2(uv.x*ar,uv.y);',
      '  float t=u_time*0.035;',
      '  vec2 q=vec2(fbm(p*1.7+t),fbm(p*1.7+vec2(3.4,1.7)-t));',
      '  float f=fbm(p*2.1+q*1.5+t*0.55);',
      '  vec2 m=vec2(u_mouse.x*ar,u_mouse.y);',
      '  float glow=smoothstep(0.5,0.0,distance(p,m));',
      '  float v=smoothstep(0.34,0.86,f)+glow*0.4;',
      '  float edge=smoothstep(1.05,0.28,length(uv-0.5)*1.75);',
      '  float a=clamp(v,0.0,1.0)*edge*0.19;',
      '  vec3 col=mix(vec3(0.02),vec3(1.0),u_dark);',
      '  gl_FragColor=vec4(col,a);',
      '}',
    ].join('\n');

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    /* one oversized triangle covers the viewport */
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    var uRes = gl.getUniformLocation(prog, 'u_res');
    var uTime = gl.getUniformLocation(prog, 'u_time');
    var uMouse = gl.getUniformLocation(prog, 'u_mouse');
    var uDark = gl.getUniformLocation(prog, 'u_dark');

    var dark = isDark() ? 1 : 0;
    onThemeChange(function (d) { dark = d ? 1 : 0; });

    var active = false;
    var boxRef = watchRect(canvas);
    whenVisible(canvas, function (vis) { active = vis; });

    var mouse = { x: 0.5, y: 0.5 };
    var t0 = performance.now();

    /* The shader is decorative and cheap; half-rate is plenty. */
    var frame = 0;

    addTicker(function (ts) {
      if (!active) return;
      frame++;
      if (frame % 2) return;

      var box = boxRef.rect;
      if (!box.width || !box.height) return;
      var dims = sizeCanvas(canvas, box);

      /* ease the mouse toward the pointer, flipped into GL space */
      var tx = clamp((pointer.x - box.left) / box.width, -0.5, 1.5);
      var ty = 1 - clamp((pointer.y - box.top) / box.height, -0.5, 1.5);
      mouse.x = lerp(mouse.x, tx, 0.05);
      mouse.y = lerp(mouse.y, ty, 0.05);

      gl.viewport(0, 0, dims.w, dims.h);
      gl.uniform2f(uRes, dims.w, dims.h);
      gl.uniform1f(uTime, (ts - t0) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uDark, dark);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });

    canvas.classList.add('is-on');
  }

  /* The supplied clip is the intended hero background; the generated shader
     only stands in when that clip cannot play. */
  ifNoHeroVideo(shaderLayer);
})();
