import { Hono } from 'hono';

export const vendorsRoutes = new Hono();

const VENDOR_COLS = `
  id, slug, name, legal_name, hq_country, hq_city, founded_year, status,
  parent_company, ticker, employee_count, ai_headcount, total_funding_usd,
  latest_valuation_usd, rnd_commitment_usd, investors_json, description,
  website_url, source_url, source_trust, last_updated
`;

function parseInvestors(row) {
  if (!row) return row;
  let investors = [];
  if (row.investors_json) {
    try { investors = JSON.parse(row.investors_json); } catch { investors = []; }
  }
  return { ...row, investors };
}

// GET /api/vendors — list with optional filters
vendorsRoutes.get('/', async (c) => {
  const country = c.req.query('country');
  const status = c.req.query('status');
  const sort = c.req.query('sort') || 'funding'; // funding | valuation | employees | name

  const where = [];
  const params = [];
  if (country) { where.push('hq_country = ?'); params.push(country.toUpperCase()); }
  if (status)  { where.push('status = ?');     params.push(status); }

  const orderBy = {
    funding:   'COALESCE(total_funding_usd, 0) DESC',
    valuation: 'COALESCE(latest_valuation_usd, 0) DESC',
    employees: 'COALESCE(employee_count, 0) DESC',
    name:      'name ASC',
  }[sort] || 'COALESCE(total_funding_usd, 0) DESC';

  const sql = `SELECT ${VENDOR_COLS} FROM vendors
               ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY ${orderBy}`;
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ vendors: (results || []).map(parseInvestors) });
});

// GET /api/vendors/compare?slugs=moonshot-ai,minimax,zhipu-ai
vendorsRoutes.get('/compare', async (c) => {
  const raw = c.req.query('slugs') || '';
  const slugs = raw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 6);
  if (slugs.length === 0) return c.json({ vendors: [] });

  const placeholders = slugs.map(() => '?').join(',');
  const { results } = await c.env.DB
    .prepare(`SELECT ${VENDOR_COLS} FROM vendors WHERE slug IN (${placeholders})`)
    .bind(...slugs)
    .all();
  // preserve requested order
  const bySlug = new Map((results || []).map((r) => [r.slug, r]));
  const ordered = slugs.map((s) => bySlug.get(s)).filter(Boolean).map(parseInvestors);
  return c.json({ vendors: ordered });
});

// GET /api/vendors/:slug — detail + linked models + recent news
vendorsRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const vendor = await c.env.DB
    .prepare(`SELECT ${VENDOR_COLS} FROM vendors WHERE slug = ?`)
    .bind(slug)
    .first();
  if (!vendor) return c.json({ error: 'Not found' }, 404);

  const { results: models } = await c.env.DB
    .prepare(`SELECT m.id, m.slug, m.name, m.family, m.context_window,
                     m.input_price_per_mtok, m.output_price_per_mtok,
                     mcs.composite_score, m.release_date
              FROM models m
              LEFT JOIN model_composite_scores mcs ON mcs.model_id = m.id
              WHERE m.vendor = ? AND m.is_active = 1
              ORDER BY COALESCE(mcs.composite_score, 0) DESC
              LIMIT 50`)
    .bind(slug)
    .all();

  const { results: news } = await c.env.DB
    .prepare(`SELECT id, title, summary, source, source_url, event_type, importance, detected_at
              FROM industry_alerts
              WHERE vendor_slug = ? AND is_dismissed = 0
              ORDER BY detected_at DESC
              LIMIT 20`)
    .bind(slug)
    .all();

  const { results: facts } = await c.env.DB
    .prepare(`SELECT fact_type, value_text, value_number, source_url, source_trust, observed_at
              FROM vendor_facts
              WHERE vendor_slug = ?
              ORDER BY observed_at DESC
              LIMIT 100`)
    .bind(slug)
    .all();

  return c.json({
    vendor: parseInvestors(vendor),
    models: models || [],
    news: news || [],
    facts: facts || [],
  });
});
