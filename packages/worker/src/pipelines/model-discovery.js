import { extractModelCandidatesFromText, ingestModelCandidate } from '../services/model-intake.js';

/**
 * Scans recent news items for model release announcements and routes
 * discoveries into the shared intake pipeline.
 */
export async function discoverNewModels(env) {
  // 1. Fetch recent news items tagged as model releases (last 48h)
  const { results: newsItems } = await env.DB.prepare(`
    SELECT id, title, summary, source, content_url, published_at
    FROM news_items
    WHERE published_at > datetime('now', '-48 hours')
      AND (relevance_tags LIKE '%model-release%'
        OR relevance_tags LIKE '%new-model%'
        OR title LIKE '%launches%'
        OR title LIKE '%announces%'
        OR title LIKE '%releases%'
        OR title LIKE '%introduces%')
    ORDER BY published_at DESC
    LIMIT 50
  `).all();

  if (newsItems.length === 0) {
    console.log('[DISCOVERY] No recent model-release news items found');
    return { discovered: 0 };
  }

  let discovered = 0;
  let autoPublished = 0;

  for (const item of newsItems) {
    const text = `${item.title} ${item.summary || ''}`;
    const candidates = extractModelCandidatesFromText(text);

    for (const candidate of candidates) {
      const result = await ingestModelCandidate(env, {
        ...candidate,
        sourceKey: item.source,
        sourceLabel: item.source,
        sourceUrl: item.content_url || null,
        contentUrl: item.content_url || null,
        discoverySource: item.source,
        discoveryUrl: item.content_url || null,
        signalType: 'news',
        title: item.title,
        summary: item.summary || null,
        metadata: {
          news_item_id: item.id,
          published_at: item.published_at,
          source: item.source,
        },
      });

      if (result.outcome === 'queued' || result.outcome === 'auto-published') {
        discovered++;
        console.log(`[DISCOVERY] New model candidate: "${candidate.name}" from ${item.source}`);
      }
      if (result.outcome === 'auto-published') {
        autoPublished++;
      }
    }
  }

  console.log(`[DISCOVERY] Scanned ${newsItems.length} items, discovered ${discovered} new candidates (${autoPublished} auto-published)`);
  return { discovered, autoPublished, scanned: newsItems.length };
}
