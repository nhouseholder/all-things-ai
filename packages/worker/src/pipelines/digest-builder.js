import { sendDigestEmail } from '../services/email-sender.js';

/**
 * Build a weekly digest email from recommendations, price changes,
 * and top news — then send it via Resend.
 */
export async function buildAndSendDigest(env) {
  const recommendations = await env.DB.prepare(`
    SELECT type, title, body, priority, related_tool_id, related_model_id, related_news_id
    FROM recommendations
    WHERE is_dismissed = 0
    ORDER BY priority DESC
    LIMIT 5
  `).all();

  const news = await env.DB.prepare(`
    SELECT title, source, summary, content_url, relevance_score, published_at
    FROM news_items
    WHERE published_at >= datetime('now', '-7 days')
    ORDER BY relevance_score DESC
    LIMIT 10
  `).all();

  const priceChanges = await env.DB.prepare(`
    SELECT pc.old_price, pc.new_price, pc.change_type, pc.detected_at,
           t.name AS tool_name, pp.plan_name
    FROM price_changes pc
    JOIN tools t ON t.id = pc.tool_id
    JOIN pricing_plans pp ON pp.id = pc.plan_id
    WHERE pc.detected_at >= datetime('now', '-7 days')
    ORDER BY pc.detected_at DESC
  `).all();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dateRange = `${formatDate(weekAgo)} — ${formatDate(now)}`;
  const subject = `All Things AI — Weekly Digest (${formatDate(now)})`;

  const html = buildHTML({
    dateRange,
    recommendations: recommendations.results,
    priceChanges: priceChanges.results,
    news: news.results,
  });

  const totalItems = recommendations.results.length + news.results.length + priceChanges.results.length;

  if (totalItems === 0) {
    console.log('[DIGEST] No content to include — skipping digest');
    return;
  }

  await sendDigestEmail(env, { subject, html });
  console.log(`[DIGEST] Built digest with ${recommendations.results.length} recs, ${priceChanges.results.length} price changes, ${news.results.length} news items`);
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHTML({ dateRange, recommendations, priceChanges, news }) {
  const recSection = recommendations.length > 0 ? `
    <tr>
      <td style="padding: 0 24px;">
        <h2 style="color: #3b82f6; font-size: 20px; margin: 32px 0 16px 0; border-bottom: 1px solid #2a2a4a; padding-bottom: 8px;">
          Top Recommendations
        </h2>
        ${recommendations.map(rec => `
          <div style="background: #2a2a4a; border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid ${recColor(rec.type)};">
            <div style="font-size: 11px; text-transform: uppercase; color: ${recColor(rec.type)}; letter-spacing: 0.5px; margin-bottom: 4px;">
              ${formatRecType(rec.type)}
            </div>
            <div style="font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 8px;">
              ${escapeHtml(rec.title)}
            </div>
            <div style="font-size: 14px; color: #c0c0d0; line-height: 1.5;">
              ${escapeHtml(rec.body)}
            </div>
          </div>
        `).join('')}
      </td>
    </tr>
  ` : '';

  const priceSection = priceChanges.length > 0 ? `
    <tr>
      <td style="padding: 0 24px;">
        <h2 style="color: #3b82f6; font-size: 20px; margin: 32px 0 16px 0; border-bottom: 1px solid #2a2a4a; padding-bottom: 8px;">
          Price Changes
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #2a2a4a;">
            <th style="text-align: left; padding: 8px; color: #9090a0; font-size: 12px; font-weight: 600;">Tool</th>
            <th style="text-align: left; padding: 8px; color: #9090a0; font-size: 12px; font-weight: 600;">Plan</th>
            <th style="text-align: right; padding: 8px; color: #9090a0; font-size: 12px; font-weight: 600;">Old</th>
            <th style="text-align: right; padding: 8px; color: #9090a0; font-size: 12px; font-weight: 600;">New</th>
            <th style="text-align: right; padding: 8px; color: #9090a0; font-size: 12px; font-weight: 600;">Change</th>
          </tr>
          ${priceChanges.map(pc => {
            const diff = pc.new_price - pc.old_price;
            const isDecrease = pc.change_type === 'decrease';
            const changeColor = isDecrease ? '#22c55e' : '#ef4444';
            const arrow = isDecrease ? '&#9660;' : '&#9650;';
            return `
              <tr style="border-bottom: 1px solid #1f1f3a;">
                <td style="padding: 8px; color: #ffffff; font-size: 14px;">${escapeHtml(pc.tool_name)}</td>
                <td style="padding: 8px; color: #c0c0d0; font-size: 14px;">${escapeHtml(pc.plan_name)}</td>
                <td style="padding: 8px; color: #9090a0; font-size: 14px; text-align: right;">$${pc.old_price}</td>
                <td style="padding: 8px; color: #ffffff; font-size: 14px; text-align: right; font-weight: 600;">$${pc.new_price}</td>
                <td style="padding: 8px; color: ${changeColor}; font-size: 14px; text-align: right; font-weight: 600;">
                  ${arrow} $${Math.abs(diff).toFixed(2)}
                </td>
              </tr>
            `;
          }).join('')}
        </table>
      </td>
    </tr>
  ` : '';

  const newsSection = news.length > 0 ? `
    <tr>
      <td style="padding: 0 24px;">
        <h2 style="color: #3b82f6; font-size: 20px; margin: 32px 0 16px 0; border-bottom: 1px solid #2a2a4a; padding-bottom: 8px;">
          Top AI News This Week
        </h2>
        ${news.map(item => {
          const snippet = item.summary
            ? escapeHtml(item.summary.slice(0, 200) + (item.summary.length > 200 ? '...' : ''))
            : '';
          const sourceName = formatSourceName(item.source);
          return `
            <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #1f1f3a;">
              <a href="${escapeHtml(item.content_url)}" style="color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; line-height: 1.4;">
                ${escapeHtml(item.title)}
              </a>
              <div style="font-size: 12px; color: #7070a0; margin-top: 4px;">
                ${sourceName} &middot; Score: ${item.relevance_score}/100
              </div>
              ${snippet ? `<div style="font-size: 13px; color: #a0a0b0; margin-top: 6px; line-height: 1.5;">${snippet}</div>` : ''}
            </div>
          `;
        }).join('')}
      </td>
    </tr>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #111122; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0;" align="center">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #1a1a2e; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f, #1a1a2e); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 4px 0; font-weight: 700;">
                All Things AI
              </h1>
              <div style="color: #3b82f6; font-size: 14px; font-weight: 500;">
                Weekly Digest
              </div>
              <div style="color: #7070a0; font-size: 12px; margin-top: 8px;">
                ${escapeHtml(dateRange)}
              </div>
            </td>
          </tr>

          ${recSection}
          ${priceSection}
          ${newsSection}

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; text-align: center; border-top: 1px solid #2a2a4a;">
              <div style="color: #5050a0; font-size: 12px;">
                Powered by All Things AI
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function recColor(type) {
  const colors = {
    price_drop: '#22c55e',
    price_increase: '#ef4444',
    cheaper_alternative: '#f59e0b',
    model_upgrade: '#8b5cf6',
    new_tool: '#3b82f6',
    high_news: '#06b6d4',
  };
  return colors[type] || '#3b82f6';
}

function formatRecType(type) {
  const labels = {
    price_drop: 'Price Drop',
    price_increase: 'Price Increase',
    cheaper_alternative: 'Save Money',
    model_upgrade: 'Model Upgrade',
    new_tool: 'New Tool',
    high_news: 'Trending',
  };
  return labels[type] || type;
}

function formatSourceName(source) {
  if (!source) return 'Unknown';
  return source
    .replace(/^rss:/, '')
    .replace(/^reddit:/, 'r/')
    .replace(/^hn$/, 'Hacker News')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
