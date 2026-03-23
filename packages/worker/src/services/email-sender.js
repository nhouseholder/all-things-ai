/**
 * Send an email digest via the Resend API.
 * Logs each send to the digest_log table.
 */
export async function sendDigestEmail(env, { subject, html }) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[EMAIL] RESEND_API_KEY not configured — skipping email send');
    return { success: false, reason: 'no_api_key' };
  }

  // Get recipient from user preferences
  const pref = await env.DB.prepare(
    `SELECT value FROM user_preferences WHERE key = 'digest_email'`
  ).first();

  if (!pref || !pref.value) {
    console.warn('[EMAIL] No digest_email configured in user_preferences — skipping email send');
    return { success: false, reason: 'no_recipient' };
  }

  const recipient = pref.value;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'All Things AI <digest@allthingsai.dev>',
        to: [recipient],
        subject,
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`[EMAIL] Resend API error (${response.status}):`, JSON.stringify(result));
      await logDigest(env, recipient, subject, 0, 'error');
      return { success: false, reason: 'api_error', detail: result };
    }

    console.log(`[EMAIL] Digest sent to ${recipient}, id: ${result.id}`);
    await logDigest(env, recipient, subject, 1, 'sent');
    return { success: true, id: result.id };
  } catch (err) {
    console.error('[EMAIL] Failed to send digest:', err.message);
    await logDigest(env, recipient, subject, 0, 'error');
    return { success: false, reason: 'network_error', detail: err.message };
  }
}

async function logDigest(env, recipient, subject, itemsCount, status) {
  await env.DB.prepare(
    `INSERT INTO digest_log (recipient, subject, items_count, status) VALUES (?, ?, ?, ?)`
  ).bind(recipient, subject, itemsCount, status).run();
}
