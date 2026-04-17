// Vendor fact store + promotion engine.
//
// Scrapers (or manual admin adds) write rows into `vendor_facts` — one row per
// (vendor_slug, fact_type, source_url). The promotion step picks the
// highest-trust value per (vendor_slug, fact_type) and writes it into the
// corresponding column on `vendors`. Ties broken by `observed_at` (most recent wins).

export const TRUST_RANK = {
  gold: 4,
  silver: 3,
  bronze: 2,
  unverified: 1,
};

// fact_type -> (column on vendors table, value selector)
export const FACT_COLUMNS = {
  employee_count:       { col: 'employee_count',       pick: 'value_number' },
  ai_headcount:         { col: 'ai_headcount',         pick: 'value_number' },
  total_funding_usd:    { col: 'total_funding_usd',    pick: 'value_number' },
  latest_valuation_usd: { col: 'latest_valuation_usd', pick: 'value_number' },
  rnd_commitment_usd:   { col: 'rnd_commitment_usd',   pick: 'value_number' },
  hq_city:              { col: 'hq_city',              pick: 'value_text' },
  hq_country:           { col: 'hq_country',           pick: 'value_text' },
  status:               { col: 'status',               pick: 'value_text' },
  parent_company:       { col: 'parent_company',       pick: 'value_text' },
  founded_year:         { col: 'founded_year',         pick: 'value_number' },
  investors_json:       { col: 'investors_json',       pick: 'value_text' },
  description:          { col: 'description',          pick: 'value_text' },
};

/**
 * Pure reducer: given a list of observed facts for a single vendor, return a
 * map of fact_type -> chosen row. Highest trust wins; ties broken by recency.
 * Facts with unknown fact_type or both value fields null are ignored.
 */
export function selectBestFacts(facts) {
  const best = new Map();
  for (const f of facts || []) {
    const meta = FACT_COLUMNS[f.fact_type];
    if (!meta) continue;
    const val = f[meta.pick];
    if (val == null || val === '') continue;
    const trust = TRUST_RANK[f.source_trust] ?? 0;
    const observedAt = f.observed_at || 0;

    const incumbent = best.get(f.fact_type);
    if (!incumbent) {
      best.set(f.fact_type, f);
      continue;
    }
    const incTrust = TRUST_RANK[incumbent.source_trust] ?? 0;
    const incObserved = incumbent.observed_at || 0;
    if (trust > incTrust || (trust === incTrust && observedAt > incObserved)) {
      best.set(f.fact_type, f);
    }
  }
  return best;
}

/**
 * Build the UPDATE payload for a vendors row from a selected-facts map.
 * Returns null if nothing to update.
 */
export function buildVendorUpdate(selectedByType) {
  const cols = [];
  const vals = [];
  let overallTrust = null;
  let latestObserved = 0;

  for (const [type, row] of selectedByType.entries()) {
    const meta = FACT_COLUMNS[type];
    if (!meta) continue;
    cols.push(`${meta.col} = ?`);
    vals.push(row[meta.pick]);
    const rank = TRUST_RANK[row.source_trust] ?? 0;
    if (overallTrust == null || rank < (TRUST_RANK[overallTrust] ?? 0)) {
      overallTrust = row.source_trust;
    }
    if ((row.observed_at || 0) > latestObserved) latestObserved = row.observed_at || 0;
  }

  if (cols.length === 0) return null;
  if (overallTrust) {
    cols.push('source_trust = ?');
    vals.push(overallTrust);
  }
  if (latestObserved) {
    cols.push('last_updated = ?');
    vals.push(latestObserved);
  }
  return { setClause: cols.join(', '), values: vals };
}

/**
 * Write an observation into vendor_facts. Idempotent on
 * (vendor_slug, fact_type, source_url).
 */
export async function recordFact(env, { vendor_slug, fact_type, value_text = null, value_number = null, source_url, source_trust = 'unverified' }) {
  if (!vendor_slug || !fact_type || !source_url) return;
  if (value_text == null && value_number == null) return;
  if (!FACT_COLUMNS[fact_type]) return;
  await env.DB.prepare(`
    INSERT INTO vendor_facts (vendor_slug, fact_type, value_text, value_number, source_url, source_trust, observed_at)
    VALUES (?, ?, ?, ?, ?, ?, strftime('%s','now'))
    ON CONFLICT(vendor_slug, fact_type, source_url) DO UPDATE SET
      value_text = excluded.value_text,
      value_number = excluded.value_number,
      source_trust = excluded.source_trust,
      observed_at = excluded.observed_at
  `).bind(vendor_slug, fact_type, value_text, value_number, source_url, source_trust).run();
}

/**
 * Promote the highest-trust facts per vendor into the vendors row.
 * Call after a scrape run.
 */
export async function promoteVendorFacts(env) {
  const { results: slugs } = await env.DB
    .prepare('SELECT DISTINCT vendor_slug FROM vendor_facts')
    .all();

  let updated = 0;
  for (const { vendor_slug } of slugs || []) {
    const { results: facts } = await env.DB
      .prepare('SELECT fact_type, value_text, value_number, source_trust, observed_at FROM vendor_facts WHERE vendor_slug = ?')
      .bind(vendor_slug)
      .all();
    const best = selectBestFacts(facts || []);
    const update = buildVendorUpdate(best);
    if (!update) continue;
    await env.DB
      .prepare(`UPDATE vendors SET ${update.setClause} WHERE slug = ?`)
      .bind(...update.values, vendor_slug)
      .run();
    updated++;
  }
  return { vendors_updated: updated };
}
