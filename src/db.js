/**
 * D1 access for courses. Every field the admin can set is normalised here,
 * so the render layer and the API both see the same shape.
 */

import { safeUrl } from './html.js';

const COLUMNS = [
  'slug', 'title', 'summary', 'description', 'category', 'level', 'mode',
  'duration', 'schedule', 'price_label', 'start_label', 'seats_label',
  'image_url', 'highlights', 'curriculum', 'tags', 'register_url',
  'published', 'featured', 'sort_order',
];

const MAX = {
  slug: 120, title: 140, summary: 320, description: 20000, category: 60,
  level: 60, mode: 60, duration: 60, schedule: 120, price_label: 40,
  start_label: 80, seats_label: 80, image_url: 600, register_url: 600,
};

export function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function str(value, limit) {
  return String(value === null || value === undefined ? '' : value).trim().slice(0, limit || 500);
}

/** Accepts an array or a newline-separated textarea value. */
function toList(value, limit = 24, itemLimit = 300) {
  let items = [];
  if (Array.isArray(value)) items = value;
  else if (typeof value === 'string') items = value.split('\n');
  return items
    .map((v) => (typeof v === 'string' ? v.trim() : v))
    .filter((v) => (typeof v === 'string' ? v.length > 0 : Boolean(v)))
    .slice(0, limit)
    .map((v) => (typeof v === 'string' ? v.slice(0, itemLimit) : v));
}

/** Curriculum entries are {title, detail}; tolerate plain strings too. */
function toCurriculum(value) {
  const items = Array.isArray(value) ? value : [];
  return items
    .slice(0, 30)
    .map((item) => {
      if (typeof item === 'string') return { title: item.trim().slice(0, 160), detail: '' };
      return {
        title: str(item && item.title, 160),
        detail: str(item && item.detail, 600),
      };
    })
    .filter((item) => item.title);
}

/**
 * Turn raw admin input into a row we can safely store and render.
 * Throws on the two things we genuinely cannot render without.
 */
export function normalizeCourse(input = {}) {
  const title = str(input.title, MAX.title);
  if (!title) throw new ValidationError('Title is required.');

  const slug = slugify(input.slug || title);
  if (!slug) throw new ValidationError('Could not build a URL slug from that title. Add a slug manually.');

  const registerUrl = safeUrl(str(input.register_url, MAX.register_url));
  if (input.register_url && !registerUrl) {
    throw new ValidationError('The registration link must be a full https:// URL.');
  }

  const imageUrl = safeUrl(str(input.image_url, MAX.image_url));
  if (input.image_url && !imageUrl) {
    throw new ValidationError('The image link must be a full https:// URL.');
  }

  const published = truthy(input.published);
  if (published && !registerUrl) {
    throw new ValidationError('Add the Google Form registration link before publishing this course.');
  }

  return {
    slug,
    title,
    summary: str(input.summary, MAX.summary),
    description: str(input.description, MAX.description),
    category: str(input.category, MAX.category) || 'General',
    level: str(input.level, MAX.level) || 'Beginner',
    mode: str(input.mode, MAX.mode) || 'Online',
    duration: str(input.duration, MAX.duration),
    schedule: str(input.schedule, MAX.schedule),
    price_label: str(input.price_label, MAX.price_label) || 'Free',
    start_label: str(input.start_label, MAX.start_label),
    seats_label: str(input.seats_label, MAX.seats_label),
    image_url: imageUrl,
    highlights: JSON.stringify(toList(input.highlights)),
    curriculum: JSON.stringify(toCurriculum(input.curriculum)),
    tags: JSON.stringify(toList(input.tags, 16, 40)),
    register_url: registerUrl,
    published: published ? 1 : 0,
    featured: truthy(input.featured) ? 1 : 0,
    sort_order: Number.isFinite(Number(input.sort_order)) ? Math.trunc(Number(input.sort_order)) : 0,
  };
}

function truthy(v) {
  return v === true || v === 1 || v === '1' || v === 'on' || v === 'true';
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

/* ---------- reads ---------- */

export async function listPublished(db, { category = '', limit = 200 } = {}) {
  const where = category ? 'WHERE published = 1 AND category = ?' : 'WHERE published = 1';
  const sql =
    'SELECT * FROM courses ' + where + ' ORDER BY featured DESC, sort_order ASC, id DESC LIMIT ?';
  const stmt = category ? db.prepare(sql).bind(category, limit) : db.prepare(sql).bind(limit);
  const { results } = await stmt.all();
  return results || [];
}

export async function listFeatured(db, limit = 3) {
  const { results } = await db
    .prepare(
      'SELECT * FROM courses WHERE published = 1 ORDER BY featured DESC, sort_order ASC, id DESC LIMIT ?'
    )
    .bind(limit)
    .all();
  return results || [];
}

export async function listAll(db) {
  const { results } = await db
    .prepare('SELECT * FROM courses ORDER BY published DESC, sort_order ASC, id DESC')
    .all();
  return results || [];
}

export async function getBySlug(db, slug, { includeDrafts = false } = {}) {
  const sql = includeDrafts
    ? 'SELECT * FROM courses WHERE slug = ?'
    : 'SELECT * FROM courses WHERE slug = ? AND published = 1';
  return db.prepare(sql).bind(slug).first();
}

export async function getById(db, id) {
  return db.prepare('SELECT * FROM courses WHERE id = ?').bind(Number(id)).first();
}

export async function listCategories(db) {
  const { results } = await db
    .prepare('SELECT category, COUNT(*) AS n FROM courses WHERE published = 1 GROUP BY category ORDER BY n DESC, category ASC')
    .all();
  return results || [];
}

export async function countCourses(db) {
  const row = await db
    .prepare('SELECT COUNT(*) AS total, SUM(published) AS live FROM courses')
    .first();
  return { total: row?.total || 0, live: row?.live || 0 };
}

/* ---------- writes ---------- */

export async function createCourse(db, input) {
  const row = normalizeCourse(input);
  row.slug = await uniqueSlug(db, row.slug, null);
  const placeholders = COLUMNS.map(() => '?').join(', ');
  const values = COLUMNS.map((c) => row[c]);
  const res = await db
    .prepare('INSERT INTO courses (' + COLUMNS.join(', ') + ') VALUES (' + placeholders + ')')
    .bind(...values)
    .run();
  return getById(db, res.meta.last_row_id);
}

export async function updateCourse(db, id, input) {
  const existing = await getById(db, id);
  if (!existing) return null;
  const row = normalizeCourse(input);
  row.slug = await uniqueSlug(db, row.slug, Number(id));
  const assignments = COLUMNS.map((c) => c + ' = ?').join(', ');
  const values = COLUMNS.map((c) => row[c]);
  await db
    .prepare('UPDATE courses SET ' + assignments + ", updated_at = datetime('now') WHERE id = ?")
    .bind(...values, Number(id))
    .run();
  return getById(db, id);
}

export async function setPublished(db, id, published) {
  const existing = await getById(db, id);
  if (!existing) return null;
  if (published && !existing.register_url) {
    throw new ValidationError('Add the Google Form registration link before publishing this course.');
  }
  await db
    .prepare("UPDATE courses SET published = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(published ? 1 : 0, Number(id))
    .run();
  return getById(db, id);
}

export async function deleteCourse(db, id) {
  const res = await db.prepare('DELETE FROM courses WHERE id = ?').bind(Number(id)).run();
  return res.meta.changes > 0;
}

/** Append -2, -3 ... until the slug is free (ignoring the row being edited). */
async function uniqueSlug(db, base, ignoreId) {
  let candidate = base;
  for (let n = 2; n < 200; n++) {
    const row = await db.prepare('SELECT id FROM courses WHERE slug = ?').bind(candidate).first();
    if (!row || (ignoreId !== null && row.id === ignoreId)) return candidate;
    candidate = base.slice(0, 110) + '-' + n;
  }
  return base + '-' + Date.now();
}
