/* Admin console client.
   Talks to /api/admin/courses. All course text is inserted with textContent,
   never innerHTML, so nothing typed into the editor can execute here. */
(function () {
  'use strict';

  /* ---------- theme (admin pages do not load app.js) ---------- */
  var root = document.documentElement;
  var STORAGE_KEY = 'ls-theme';

  function systemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  var themeToggles = document.querySelectorAll('[data-theme-toggle]');
  for (var i = 0; i < themeToggles.length; i++) {
    themeToggles[i].addEventListener('click', function () {
      var next = (root.getAttribute('data-theme') || systemTheme()) === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {}
      var metas = document.querySelectorAll('meta[name="theme-color"]');
      for (var m = 0; m < metas.length; m++) {
        metas[m].setAttribute('content', next === 'dark' ? '#050505' : '#ffffff');
      }
    });
  }

  var list = document.getElementById('courseList');
  if (!list) return; // login page

  /* ---------- elements ---------- */
  var editor = document.getElementById('editor');
  var form = document.getElementById('courseForm');
  var editorTitle = document.getElementById('editorTitle');
  var modulesBox = document.getElementById('modules');
  var formError = form.querySelector('[data-form-error]');
  var saveBtn = document.querySelector('[data-save]');
  var toastEl = document.getElementById('toast');
  var slugPreview = document.querySelector('[data-slug-preview]');

  var state = { courses: [], editingId: null, saving: false };
  var toastTimer = null;
  var lastFocused = null;

  /* ---------- helpers ---------- */

  function toast(message, isError) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.toggle('is-error', Boolean(isError));
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.hidden = true;
    }, isError ? 5200 : 2800);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
  }

  function parseList(value) {
    try {
      var arr = JSON.parse(value || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  async function api(path, options) {
    var res = await fetch(path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, options));
    if (res.status === 401) {
      window.location.href = '/admin/login';
      throw new Error('Session expired.');
    }
    var data = null;
    try {
      data = await res.json();
    } catch (e) {}
    if (!res.ok) throw new Error((data && data.error) || 'Request failed (' + res.status + ').');
    return data || {};
  }

  function applyStats(stats) {
    if (!stats) return;
    var total = document.querySelector('[data-stat-total]');
    var live = document.querySelector('[data-stat-live]');
    var draft = document.querySelector('[data-stat-draft]');
    if (total) total.textContent = String(stats.total || 0);
    if (live) live.textContent = String(stats.live || 0);
    if (draft) draft.textContent = String((stats.total || 0) - (stats.live || 0));
  }

  /* ---------- list ---------- */

  function render() {
    list.innerHTML = '';
    list.setAttribute('aria-busy', 'false');

    if (!state.courses.length) {
      var empty = el('p', 'admin-empty', 'No courses yet. Create your first one with “New course”.');
      list.appendChild(empty);
      return;
    }

    state.courses.forEach(function (course) {
      var row = el('div', 'admin-row');

      var main = el('div', 'admin-row-main');
      var top = el('div', 'admin-row-top');
      top.appendChild(el('span', 'admin-row-title', course.title));
      var status = el('span', 'status' + (course.published ? ' is-live' : ''), course.published ? 'Published' : 'Draft');
      top.appendChild(status);
      if (course.featured) top.appendChild(el('span', 'badge', 'Featured'));
      main.appendChild(top);
      main.appendChild(el('span', 'admin-row-slug', '/courses/' + course.slug));
      if (course.summary) main.appendChild(el('p', 'admin-row-summary', course.summary));
      if (!course.register_url) {
        main.appendChild(el('span', 'admin-row-warn', 'No registration link yet — cannot be published.'));
      }
      row.appendChild(main);

      var actions = el('div', 'admin-row-actions');

      var view = el('a', 'btn btn-ghost btn-sm', course.published ? 'View' : 'Preview');
      view.href = '/courses/' + course.slug;
      view.target = '_blank';
      view.rel = 'noopener';
      actions.appendChild(view);

      var edit = el('button', 'btn btn-ghost btn-sm', 'Edit');
      edit.type = 'button';
      edit.addEventListener('click', function () {
        openEditor(course);
      });
      actions.appendChild(edit);

      var pub = el('button', 'btn btn-sm ' + (course.published ? 'btn-ghost' : 'btn-primary'), course.published ? 'Unpublish' : 'Publish');
      pub.type = 'button';
      pub.addEventListener('click', function () {
        togglePublish(course, pub);
      });
      actions.appendChild(pub);

      var del = el('button', 'btn btn-danger btn-sm', 'Delete');
      del.type = 'button';
      del.addEventListener('click', function () {
        removeCourse(course);
      });
      actions.appendChild(del);

      row.appendChild(actions);
      list.appendChild(row);
    });
  }

  async function load() {
    try {
      var data = await api('/api/admin/courses');
      state.courses = data.courses || [];
      applyStats(data.stats);
      render();
    } catch (err) {
      list.setAttribute('aria-busy', 'false');
      list.innerHTML = '';
      list.appendChild(el('p', 'admin-empty', err.message));
    }
  }

  /* ---------- module repeater ---------- */

  function addModule(module) {
    var wrap = el('div', 'module-editor');

    var head = el('div', 'module-editor-head');
    head.appendChild(el('span', 'module-editor-label', 'Module ' + (modulesBox.children.length + 1)));
    var remove = el('button', 'module-remove', 'Remove');
    remove.type = 'button';
    remove.addEventListener('click', function () {
      wrap.remove();
      renumberModules();
    });
    head.appendChild(remove);
    wrap.appendChild(head);

    var title = document.createElement('input');
    title.className = 'input';
    title.setAttribute('data-module-title', '');
    title.placeholder = 'Module title';
    title.maxLength = 160;
    title.value = (module && module.title) || '';
    wrap.appendChild(title);

    var detail = document.createElement('textarea');
    detail.className = 'input';
    detail.setAttribute('data-module-detail', '');
    detail.rows = 2;
    detail.placeholder = 'What this module covers (optional)';
    detail.value = (module && module.detail) || '';
    wrap.appendChild(detail);

    modulesBox.appendChild(wrap);
    return title;
  }

  function renumberModules() {
    var labels = modulesBox.querySelectorAll('.module-editor-label');
    for (var i = 0; i < labels.length; i++) labels[i].textContent = 'Module ' + (i + 1);
  }

  function readModules() {
    var out = [];
    var editors = modulesBox.querySelectorAll('.module-editor');
    for (var i = 0; i < editors.length; i++) {
      var title = editors[i].querySelector('[data-module-title]').value.trim();
      var detail = editors[i].querySelector('[data-module-detail]').value.trim();
      if (title) out.push({ title: title, detail: detail });
    }
    return out;
  }

  /* ---------- editor ---------- */

  function openEditor(course) {
    lastFocused = document.activeElement;
    state.editingId = course ? course.id : null;
    editorTitle.textContent = course ? 'Edit course' : 'New course';
    formError.hidden = true;
    formError.textContent = '';
    form.reset();
    modulesBox.innerHTML = '';

    var f = form.elements;
    if (course) {
      f.title.value = course.title || '';
      f.slug.value = course.slug || '';
      f.summary.value = course.summary || '';
      f.description.value = course.description || '';
      f.register_url.value = course.register_url || '';
      f.category.value = course.category || '';
      f.level.value = course.level || '';
      f.mode.value = course.mode || '';
      f.duration.value = course.duration || '';
      f.schedule.value = course.schedule || '';
      f.price_label.value = course.price_label || '';
      f.start_label.value = course.start_label || '';
      f.seats_label.value = course.seats_label || '';
      f.image_url.value = course.image_url || '';
      f.tags.value = parseList(course.tags).join(', ');
      f.highlights.value = parseList(course.highlights).join('\n');
      f.published.checked = Boolean(course.published);
      f.featured.checked = Boolean(course.featured);
      f.sort_order.value = course.sort_order != null ? course.sort_order : 0;
      parseList(course.curriculum).forEach(addModule);
    } else {
      f.sort_order.value = state.courses.length * 10 + 10;
      addModule();
    }

    updateSlugPreview();
    editor.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      f.title.focus();
    }, 60);
  }

  function closeEditor() {
    editor.hidden = true;
    document.body.style.overflow = '';
    state.editingId = null;
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function updateSlugPreview() {
    if (!slugPreview) return;
    var f = form.elements;
    var value = slugify(f.slug.value || f.title.value) || 'your-slug';
    slugPreview.textContent = value;
  }

  form.elements.title.addEventListener('input', updateSlugPreview);
  form.elements.slug.addEventListener('input', updateSlugPreview);

  function collect() {
    var f = form.elements;
    return {
      title: f.title.value.trim(),
      slug: f.slug.value.trim(),
      summary: f.summary.value.trim(),
      description: f.description.value,
      register_url: f.register_url.value.trim(),
      category: f.category.value.trim(),
      level: f.level.value.trim(),
      mode: f.mode.value.trim(),
      duration: f.duration.value.trim(),
      schedule: f.schedule.value.trim(),
      price_label: f.price_label.value.trim(),
      start_label: f.start_label.value.trim(),
      seats_label: f.seats_label.value.trim(),
      image_url: f.image_url.value.trim(),
      tags: f.tags.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean),
      highlights: f.highlights.value.split('\n').map(function (t) { return t.trim(); }).filter(Boolean),
      curriculum: readModules(),
      published: f.published.checked,
      featured: f.featured.checked,
      sort_order: Number(f.sort_order.value) || 0,
    };
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (state.saving) return;

    var payload = collect();
    if (!payload.title) {
      formError.textContent = 'Give the course a title first.';
      formError.hidden = false;
      form.elements.title.focus();
      return;
    }

    state.saving = true;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    formError.hidden = true;

    try {
      var editing = state.editingId;
      var data = editing
        ? await api('/api/admin/courses/' + editing, { method: 'PUT', body: JSON.stringify(payload) })
        : await api('/api/admin/courses', { method: 'POST', body: JSON.stringify(payload) });

      if (editing) {
        state.courses = state.courses.map(function (c) {
          return c.id === editing ? data.course : c;
        });
      } else {
        state.courses.unshift(data.course);
      }
      applyStats(data.stats);
      render();
      closeEditor();
      toast(editing ? 'Course updated.' : 'Course created.');
    } catch (err) {
      formError.textContent = err.message;
      formError.hidden = false;
      formError.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } finally {
      state.saving = false;
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save course';
    }
  });

  /* ---------- row actions ---------- */

  async function togglePublish(course, button) {
    var next = !course.published;
    button.disabled = true;
    try {
      var data = await api('/api/admin/courses/' + course.id + '/publish', {
        method: 'POST',
        body: JSON.stringify({ published: next }),
      });
      state.courses = state.courses.map(function (c) {
        return c.id === course.id ? data.course : c;
      });
      applyStats(data.stats);
      render();
      toast(next ? 'Course published — it is live now.' : 'Course unpublished.');
    } catch (err) {
      button.disabled = false;
      toast(err.message, true);
    }
  }

  async function removeCourse(course) {
    if (!window.confirm('Delete “' + course.title + '”? This cannot be undone.')) return;
    try {
      var data = await api('/api/admin/courses/' + course.id, { method: 'DELETE' });
      state.courses = state.courses.filter(function (c) {
        return c.id !== course.id;
      });
      applyStats(data.stats);
      render();
      toast('Course deleted.');
    } catch (err) {
      toast(err.message, true);
    }
  }

  /* ---------- wiring ---------- */

  var newBtn = document.querySelector('[data-new-course]');
  if (newBtn) {
    newBtn.addEventListener('click', function () {
      openEditor(null);
    });
  }

  var addModuleBtn = document.querySelector('[data-add-module]');
  if (addModuleBtn) {
    addModuleBtn.addEventListener('click', function () {
      var input = addModule();
      input.focus();
    });
  }

  var closers = document.querySelectorAll('[data-close-editor]');
  for (var c = 0; c < closers.length; c++) closers[c].addEventListener('click', closeEditor);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !editor.hidden) closeEditor();
  });

  load();
})();
