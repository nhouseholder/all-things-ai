/**
 * Task Cost Calculator
 * Recomputes cost_per_task_estimate and time_value_per_task
 * for all rows in model_task_estimates.
 */

const DEVELOPER_HOURLY_RATE = 75;

export async function computeTaskCosts(env) {
  // Join model_task_estimates with models (token pricing) and task_profiles (token counts)
  const { results: estimates } = await env.DB.prepare(`
    SELECT
      mte.id,
      mte.avg_messages_to_complete,
      mte.avg_minutes_to_complete,
      m.input_price_per_mtok,
      m.output_price_per_mtok,
      tp.avg_input_tokens,
      tp.avg_output_tokens
    FROM model_task_estimates mte
    JOIN models m ON m.id = mte.model_id
    JOIN task_profiles tp ON tp.id = mte.task_profile_id
    WHERE m.input_price_per_mtok IS NOT NULL
      AND m.output_price_per_mtok IS NOT NULL
      AND tp.avg_input_tokens IS NOT NULL
      AND tp.avg_output_tokens IS NOT NULL
  `).all();

  if (!estimates.length) {
    console.log('[TASK-COST] No estimates to recompute');
    return;
  }

  const updateStmt = env.DB.prepare(
    'UPDATE model_task_estimates SET cost_per_task_estimate = ?, time_value_per_task = ? WHERE id = ?'
  );

  const batch = [];

  for (const est of estimates) {
    const costPerTask = est.avg_messages_to_complete * (
      est.avg_input_tokens * est.input_price_per_mtok +
      est.avg_output_tokens * est.output_price_per_mtok
    ) / 1_000_000;

    const timeValue = est.avg_minutes_to_complete * (DEVELOPER_HOURLY_RATE / 60);

    batch.push(updateStmt.bind(
      Number(costPerTask.toFixed(6)),
      Number(timeValue.toFixed(2)),
      est.id
    ));
  }

  if (batch.length) {
    await env.DB.batch(batch);
  }

  console.log(`[TASK-COST] Recomputed costs for ${batch.length} estimates`);
}
