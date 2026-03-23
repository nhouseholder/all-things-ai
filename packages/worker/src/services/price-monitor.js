/**
 * Process detected price changes and generate alerts/recommendations.
 * Called by the pricing scraper after detecting changes.
 */
export async function checkPriceChanges(env) {
  // Get recent price changes that haven't been turned into recommendations yet
  const changes = await env.DB.prepare(`
    SELECT pc.id, pc.tool_id, pc.plan_id, pc.old_price, pc.new_price, pc.change_type,
           t.name AS tool_name, pp.plan_name
    FROM price_changes pc
    JOIN tools t ON t.id = pc.tool_id
    JOIN pricing_plans pp ON pp.id = pc.plan_id
    WHERE pc.detected_at >= datetime('now', '-1 day')
  `).all();

  if (!changes.results.length) {
    console.log('[PRICE-MONITOR] No recent price changes detected');
    return;
  }

  // Get active subscriptions to check which changes affect the user
  const subscriptions = await env.DB.prepare(`
    SELECT tool_id, plan_id, monthly_cost FROM user_subscriptions WHERE is_active = 1
  `).all();
  const subscribedToolIds = new Set(subscriptions.results.map(s => s.tool_id));

  let alertCount = 0;

  for (const change of changes.results) {
    const isSubscribed = subscribedToolIds.has(change.tool_id);

    if (isSubscribed && change.change_type === 'decrease') {
      const savings = (change.old_price - change.new_price).toFixed(2);
      await env.DB.prepare(`
        INSERT INTO recommendations (type, title, body, priority, related_tool_id)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'price_drop',
        `${change.tool_name} price dropped to $${change.new_price}/mo`,
        `Great news — ${change.tool_name} ${change.plan_name} just dropped from $${change.old_price}/mo to $${change.new_price}/mo. You're saving $${savings}/mo automatically on your current subscription.`,
        90,
        change.tool_id
      ).run();
      alertCount++;

      console.log(`[PRICE-MONITOR] Price drop alert: ${change.tool_name} ${change.plan_name} $${change.old_price} -> $${change.new_price}`);
    }

    if (isSubscribed && change.change_type === 'increase') {
      const increase = (change.new_price - change.old_price).toFixed(2);
      await env.DB.prepare(`
        INSERT INTO recommendations (type, title, body, priority, related_tool_id)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'price_increase',
        `${change.tool_name} price increased to $${change.new_price}/mo`,
        `Heads up — ${change.tool_name} ${change.plan_name} went from $${change.old_price}/mo to $${change.new_price}/mo, a $${increase}/mo increase. You might want to review alternatives or lock in an annual plan if available.`,
        85,
        change.tool_id
      ).run();
      alertCount++;

      console.log(`[PRICE-MONITOR] Price increase alert: ${change.tool_name} ${change.plan_name} $${change.old_price} -> $${change.new_price}`);
    }

    // Log all changes regardless of subscription status
    if (!isSubscribed) {
      console.log(`[PRICE-MONITOR] Noted: ${change.tool_name} ${change.plan_name} ${change.change_type} $${change.old_price} -> $${change.new_price} (not subscribed)`);
    }
  }

  console.log(`[PRICE-MONITOR] Processed ${changes.results.length} price changes, created ${alertCount} alerts`);
}
