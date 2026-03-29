import { Hono } from 'hono';

export const dashboardRoutes = new Hono();

// GET /api/dashboard/summary — aggregated dashboard data
dashboardRoutes.get('/summary', async (c) => {
  const [
    modelCountRes,
    toolCountRes,
    codingToolCountRes,
    subRes,
    alertRes,
    topMoversRes,
    recentScoresRes,
  ] = await Promise.all([
    // Total active models
    c.env.DB.prepare('SELECT COUNT(*) as count FROM models WHERE is_active = 1').first(),

    // Total tools
    c.env.DB.prepare('SELECT COUNT(*) as count FROM tools').first(),

    // Total coding tools
    c.env.DB.prepare('SELECT COUNT(*) as count FROM coding_tools').first(),

    // Active subscriptions + spend
    c.env.DB.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(monthly_cost), 0) as total_spend
      FROM user_subscriptions WHERE status = 'active'
    `).first().catch(() => ({ count: 0, total_spend: 0 })),

    // Unread alerts
    c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM industry_alerts WHERE is_read = 0 AND is_dismissed = 0
    `).first().catch(() => ({ count: 0 })),

    // Ranking movers: models whose score changed significantly
    // Compare current composite scores vs stored previous scores
    c.env.DB.prepare(`
      SELECT m.name, m.slug, m.vendor,
        mcs.composite_score,
        mcs.previous_score,
        (mcs.composite_score - COALESCE(mcs.previous_score, mcs.composite_score)) as score_change
      FROM model_composite_scores mcs
      JOIN models m ON m.id = mcs.model_id
      WHERE m.is_active = 1
        AND mcs.previous_score IS NOT NULL
        AND ABS(mcs.composite_score - mcs.previous_score) >= 1.0
      ORDER BY ABS(mcs.composite_score - mcs.previous_score) DESC
      LIMIT 5
    `).all().catch(() => ({ results: [] })),

    // Recently scored models (last 7 days)
    c.env.DB.prepare(`
      SELECT COUNT(*) as count, MAX(updated_at) as last_update
      FROM model_composite_scores
      WHERE updated_at >= datetime('now', '-7 days')
    `).first().catch(() => ({ count: 0, last_update: null })),
  ]);

  return c.json({
    stats: {
      model_count: modelCountRes?.count || 0,
      tool_count: toolCountRes?.count || 0,
      coding_tool_count: codingToolCountRes?.count || 0,
      subscription_count: subRes?.count || 0,
      monthly_spend: subRes?.total_spend || 0,
      unread_alerts: alertRes?.count || 0,
    },
    ranking_movers: topMoversRes?.results || [],
    scoring: {
      models_scored_7d: recentScoresRes?.count || 0,
      last_score_update: recentScoresRes?.last_update || null,
    },
  });
});
