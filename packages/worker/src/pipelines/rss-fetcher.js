import { XMLParser } from 'fast-xml-parser';
import { RSS_FEEDS } from '../config/sources.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['item', 'entry'].includes(name),
});

/**
 * Normalize an RSS/Atom item into a consistent shape.
 * Handles RSS 2.0 <item> and Atom <entry> formats.
 */
function normalizeItem(item) {
  // Title — plain string or object with #text
  const title = typeof item.title === 'object' ? item.title['#text'] || '' : item.title || '';

  // Link — Atom uses <link href="...">, RSS uses <link> as a string
  let link = '';
  if (item.link) {
    if (typeof item.link === 'string') {
      link = item.link;
    } else if (Array.isArray(item.link)) {
      const alt = item.link.find((l) => l['@_rel'] === 'alternate') || item.link[0];
      link = alt['@_href'] || '';
    } else if (typeof item.link === 'object') {
      link = item.link['@_href'] || '';
    }
  }

  // Description / summary
  const rawDesc =
    item.description ||
    item.summary ||
    (typeof item.content === 'string' ? item.content : item.content?.['#text']) ||
    '';
  const description = typeof rawDesc === 'string' ? rawDesc : String(rawDesc);

  // Published date
  const pubDate = item.pubDate || item.published || item.updated || item['dc:date'] || '';

  // Author
  const author =
    item.author?.name ||
    item['dc:creator'] ||
    (typeof item.author === 'string' ? item.author : null) ||
    null;

  return { title: title.trim(), link, description, pubDate, author };
}

/**
 * Strip HTML tags from a string for clean summaries.
 */
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Extract items from parsed XML, handling RSS 2.0 and Atom formats.
 */
function extractItems(parsed) {
  // RSS 2.0: rss.channel.item
  if (parsed.rss?.channel?.item) {
    return parsed.rss.channel.item;
  }
  // Atom: feed.entry
  if (parsed.feed?.entry) {
    return parsed.feed.entry;
  }
  // Some feeds nest channel directly
  if (parsed.channel?.item) {
    return parsed.channel.item;
  }
  // RDF format (older RSS 1.0)
  if (parsed['rdf:RDF']?.item) {
    return parsed['rdf:RDF'].item;
  }
  return [];
}

/**
 * Fetch and ingest all configured RSS feeds into D1.
 * Uses ETag-based caching via KV to avoid re-processing unchanged feeds.
 */
export async function fetchAllRSS(env) {
  const now = new Date().toISOString();
  let totalNew = 0;
  let feedsProcessed = 0;

  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      try {
        // Check ETag cache
        const cachedEtag = await env.CACHE.get(`rss:${feed.slug}:etag`);
        const headers = { 'User-Agent': 'AllThingsAI/1.0' };
        if (cachedEtag) {
          headers['If-None-Match'] = cachedEtag;
        }

        const resp = await fetch(feed.url, { headers });

        // 304 Not Modified — feed hasn't changed
        if (resp.status === 304) {
          console.log(`[RSS] ${feed.slug}: not modified (etag hit)`);
          return { slug: feed.slug, newItems: 0, skipped: true };
        }

        if (!resp.ok) {
          console.error(`[RSS] ${feed.slug}: HTTP ${resp.status}`);
          return { slug: feed.slug, newItems: 0, error: `HTTP ${resp.status}` };
        }

        const xml = await resp.text();
        const parsed = parser.parse(xml);
        const rawItems = extractItems(parsed);

        if (!rawItems || rawItems.length === 0) {
          console.log(`[RSS] ${feed.slug}: no items found in feed`);
          return { slug: feed.slug, newItems: 0 };
        }

        let newCount = 0;

        for (const raw of rawItems) {
          try {
            const item = normalizeItem(raw);

            if (!item.title || !item.link) {
              continue;
            }

            const cleanSummary = stripHtml(item.description).slice(0, 500);
            const publishedAt = item.pubDate
              ? new Date(item.pubDate).toISOString()
              : now;

            const result = await env.DB.prepare(
              `INSERT OR IGNORE INTO news_items (source, source_url, title, summary, content_url, published_at, fetched_at, author)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            )
              .bind(
                feed.slug,
                item.link,
                item.title,
                cleanSummary || null,
                item.link,
                publishedAt,
                now,
                item.author
              )
              .run();

            if (result.meta?.changes > 0) {
              newCount++;
            }
          } catch (itemErr) {
            console.error(`[RSS] ${feed.slug}: item insert error:`, itemErr.message);
          }
        }

        // Store ETag for next run
        const etag = resp.headers.get('etag');
        if (etag) {
          await env.CACHE.put(`rss:${feed.slug}:etag`, etag, { expirationTtl: 1800 });
        }

        return { slug: feed.slug, newItems: newCount };
      } catch (feedErr) {
        console.error(`[RSS] ${feed.slug}: feed error:`, feedErr.message);
        return { slug: feed.slug, newItems: 0, error: feedErr.message };
      }
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled') {
      totalNew += r.value.newItems;
      if (!r.value.skipped) {
        feedsProcessed++;
      }
    }
  }

  console.log(`[RSS] Fetched ${totalNew} new items from ${feedsProcessed} feeds`);
  return { totalNew, feedsProcessed };
}
