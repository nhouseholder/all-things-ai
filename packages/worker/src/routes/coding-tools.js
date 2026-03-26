import { Hono } from 'hono';

export const codingToolsRoutes = new Hono();

// GET /api/coding-tools — list with filters
codingToolsRoutes.get('/', async (c) => {
  const { category, platform, tag, search, sort = 'featured', page = '1', limit = '50' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = 'SELECT ct.* FROM coding_tools ct WHERE ct.is_active = 1';
  const params = [];

  if (category) {
    query += ' AND ct.category = ?';
    params.push(category);
  }
  if (platform) {
    query += ' AND (ct.platform = ? OR ct.platform = ?)';
    params.push(platform, 'universal');
  }
  if (tag) {
    query += ' AND ct.id IN (SELECT tool_id FROM coding_tool_tags WHERE tag = ?)';
    params.push(tag);
  }
  if (search) {
    query += ' AND (ct.name LIKE ? OR ct.description LIKE ? OR ct.short_description LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  // Sort
  switch (sort) {
    case 'stars': query += ' ORDER BY ct.stars DESC NULLS LAST, ct.is_featured DESC'; break;
    case 'name': query += ' ORDER BY ct.name ASC'; break;
    case 'newest': query += ' ORDER BY ct.created_at DESC'; break;
    default: query += ' ORDER BY ct.is_featured DESC, ct.stars DESC NULLS LAST, ct.name ASC';
  }

  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  // Parse JSON fields
  const tools = results.map(parseJsonFields);

  // Get tags for each tool
  if (tools.length > 0) {
    const ids = tools.map(t => t.id);
    const placeholders = ids.map(() => '?').join(',');
    const { results: allTags } = await c.env.DB.prepare(
      `SELECT tool_id, tag FROM coding_tool_tags WHERE tool_id IN (${placeholders})`
    ).bind(...ids).all();

    const tagMap = {};
    for (const t of allTags) {
      if (!tagMap[t.tool_id]) tagMap[t.tool_id] = [];
      tagMap[t.tool_id].push(t.tag);
    }
    for (const tool of tools) {
      tool.tags = tagMap[tool.id] || [];
    }
  }

  // Count
  let countQuery = 'SELECT COUNT(*) as total FROM coding_tools ct WHERE ct.is_active = 1';
  const countParams = [];
  if (category) { countQuery += ' AND ct.category = ?'; countParams.push(category); }
  if (platform) { countQuery += ' AND (ct.platform = ? OR ct.platform = ?)'; countParams.push(platform, 'universal'); }
  if (tag) { countQuery += ' AND ct.id IN (SELECT tool_id FROM coding_tool_tags WHERE tag = ?)'; countParams.push(tag); }
  if (search) {
    countQuery += ' AND (ct.name LIKE ? OR ct.description LIKE ? OR ct.short_description LIKE ?)';
    const term = `%${search}%`;
    countParams.push(term, term, term);
  }
  const { results: countRes } = await c.env.DB.prepare(countQuery).bind(...countParams).all();

  return c.json({ tools, total: countRes[0]?.total || 0, page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/coding-tools/rankings — plugins ranked by composite score
codingToolsRoutes.get('/rankings', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT ct.id, ct.name, ct.slug, ct.category, ct.platform, ct.stars,
           ct.community_rating, ct.setup_complexity, ct.has_docs,
           pcs.composite_score, pcs.stars_score, pcs.freshness_score,
           pcs.compatibility_score, pcs.community_score, pcs.simplicity_score,
           pcs.docs_score, pcs.updated_at
    FROM plugin_composite_scores pcs
    JOIN coding_tools ct ON ct.id = pcs.plugin_id AND ct.is_active = 1
    ORDER BY pcs.composite_score DESC
  `).all();
  return c.json({ rankings: results, updated_at: results[0]?.updated_at || null });
});

// GET /api/coding-tools/categories — category counts
codingToolsRoutes.get('/categories', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT category, COUNT(*) as count FROM coding_tools WHERE is_active = 1 GROUP BY category ORDER BY count DESC'
  ).all();
  return c.json({ categories: results });
});

// GET /api/coding-tools/tags — all tags with counts
codingToolsRoutes.get('/tags', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT ctt.tag, COUNT(*) as count
    FROM coding_tool_tags ctt
    JOIN coding_tools ct ON ct.id = ctt.tool_id AND ct.is_active = 1
    GROUP BY ctt.tag ORDER BY count DESC LIMIT 50
  `).all();
  return c.json({ tags: results });
});

// POST /api/coding-tools/recommend — rule-based recommendation
codingToolsRoutes.post('/recommend', async (c) => {
  const body = await c.req.json();
  const { description = '', languages = [], frameworks = [], platform = '', use_cases = [] } = body;

  // Get all active tools with tags
  const { results: tools } = await c.env.DB.prepare(
    'SELECT * FROM coding_tools WHERE is_active = 1'
  ).all();

  const { results: allTags } = await c.env.DB.prepare(
    'SELECT tool_id, tag FROM coding_tool_tags'
  ).all();

  const tagMap = {};
  for (const t of allTags) {
    if (!tagMap[t.tool_id]) tagMap[t.tool_id] = [];
    tagMap[t.tool_id].push(t.tag);
  }

  // Extract keywords from description
  const descWords = description.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  // Score each tool
  const scored = tools.map(tool => {
    const t = parseJsonFields(tool);
    t.tags = tagMap[t.id] || [];
    let score = 0;
    const reasons = [];

    // Language match (+3 each)
    const toolLangs = (t.languages || []).map(l => l.toLowerCase());
    for (const lang of languages) {
      if (toolLangs.includes(lang.toLowerCase())) {
        score += 3;
        reasons.push(`Supports ${lang}`);
      }
    }

    // Framework match (+3 each)
    const toolFrameworks = (t.frameworks || []).map(f => f.toLowerCase());
    for (const fw of frameworks) {
      if (toolFrameworks.includes(fw.toLowerCase())) {
        score += 3;
        reasons.push(`Works with ${fw}`);
      }
    }

    // Use case match (+5 each)
    const toolUseCases = (t.use_cases || []).map(u => u.toLowerCase());
    for (const uc of use_cases) {
      if (toolUseCases.includes(uc.toLowerCase())) {
        score += 5;
        reasons.push(`Great for ${uc}`);
      }
    }

    // Tag match (+2 each)
    for (const tag of t.tags) {
      if (descWords.includes(tag) || languages.map(l => l.toLowerCase()).includes(tag) ||
          frameworks.map(f => f.toLowerCase()).includes(tag) || use_cases.map(u => u.toLowerCase()).includes(tag)) {
        score += 2;
      }
    }

    // Platform match (+3)
    if (platform && (t.platform === platform || t.platform === 'universal')) {
      score += 3;
      if (t.platform === platform) reasons.push(`Made for ${platform}`);
    }

    // Featured bonus (+2)
    if (t.is_featured) score += 2;

    // Stars bonus (+1 per 1000, capped at 5)
    if (t.stars) score += Math.min(5, Math.floor(t.stars / 1000));

    // Description keyword match (+1 each)
    const toolDesc = `${t.name} ${t.description} ${t.short_description || ''}`.toLowerCase();
    for (const word of descWords) {
      if (toolDesc.includes(word) && word.length > 3) {
        score += 1;
      }
    }

    return { tool: t, score, match_reasons: reasons.slice(0, 5) };
  });

  // Sort by score, return top 15
  scored.sort((a, b) => b.score - a.score);
  const recommendations = scored.filter(s => s.score > 0).slice(0, 15);

  return c.json({ recommendations, total_tools: tools.length });
});

// GET /api/coding-tools/:slug — single tool detail
codingToolsRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const tool = await c.env.DB.prepare('SELECT * FROM coding_tools WHERE slug = ? AND is_active = 1').bind(slug).first();
  if (!tool) return c.json({ error: 'Tool not found' }, 404);

  const parsed = parseJsonFields(tool);

  const { results: tags } = await c.env.DB.prepare(
    'SELECT tag FROM coding_tool_tags WHERE tool_id = ?'
  ).bind(tool.id).all();
  parsed.tags = tags.map(t => t.tag);

  return c.json(parsed);
});

// Helper: parse JSON string fields
function parseJsonFields(tool) {
  const jsonFields = ['languages', 'frameworks', 'use_cases', 'requires'];
  const parsed = { ...tool };
  for (const field of jsonFields) {
    if (parsed[field] && typeof parsed[field] === 'string') {
      try { parsed[field] = JSON.parse(parsed[field]); } catch { parsed[field] = []; }
    } else if (!parsed[field]) {
      parsed[field] = [];
    }
  }
  return parsed;
}
