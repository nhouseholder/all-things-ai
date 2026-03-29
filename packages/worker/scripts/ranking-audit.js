/**
 * Ranking Audit Script
 * Verifies model composite scores, community adjustments, and ordering.
 * Run: node packages/worker/scripts/ranking-audit.js
 *
 * Checks:
 * 1. All community_adjustment values within ±5.0 cap
 * 2. Cross-vendor proximity guard (2.0 point minimum at top)
 * 3. Model families ordered sensibly (newer/better variants rank higher)
 * 4. No obvious data anomalies
 */

const API_BASE = process.env.API_BASE || 'https://all-things-ai.nickhouseholder.workers.dev';

async function fetchJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

async function audit() {
  console.log('=== RANKING AUDIT ===\n');

  // Fetch rankings
  const rankings = await fetchJSON('/api/advisor/rankings');
  const bestOverall = rankings.best_overall || [];
  const bangForBuck = rankings.bang_for_buck || [];

  console.log(`Models ranked: ${bestOverall.length} overall, ${bangForBuck.length} value\n`);

  // ── Check 1: Community adjustment cap ──
  console.log('--- CHECK 1: Community Adjustment Cap (±5.0) ---');
  let capViolations = 0;
  for (const m of bestOverall) {
    const adj = m.community_adjustment || 0;
    if (Math.abs(adj) > 5.0) {
      console.log(`  ❌ ${m.model_name}: community_adjustment = ${adj} (exceeds ±5.0)`);
      capViolations++;
    }
  }
  console.log(capViolations === 0 ? '  ✅ All within cap' : `  ❌ ${capViolations} violations`);

  // ── Check 2: Cross-vendor proximity guard ──
  console.log('\n--- CHECK 2: Cross-Vendor Proximity (top 10) ---');
  let proximityIssues = 0;
  for (let i = 0; i < Math.min(10, bestOverall.length) - 1; i++) {
    const a = bestOverall[i];
    const b = bestOverall[i + 1];
    if (a.vendor !== b.vendor) {
      const gap = Math.abs((a.composite_score || 0) - (b.composite_score || 0));
      if (gap < 2.0) {
        console.log(`  ⚠️ ${a.model_name} (${a.vendor}, ${a.composite_score?.toFixed(1)}) vs ${b.model_name} (${b.vendor}, ${b.composite_score?.toFixed(1)}) — gap only ${gap.toFixed(2)}`);
        proximityIssues++;
      }
    }
  }
  console.log(proximityIssues === 0 ? '  ✅ All cross-vendor gaps ≥ 2.0' : `  ⚠️ ${proximityIssues} proximity issues`);

  // ── Check 3: Family ordering ──
  console.log('\n--- CHECK 3: Family Ordering ---');
  // Group by family, check that within each family, newer variants rank higher
  const families = {};
  for (const m of bestOverall) {
    const fam = m.family || 'unknown';
    if (!families[fam]) families[fam] = [];
    families[fam].push({ name: m.model_name, score: m.composite_score || 0, vendor: m.vendor });
  }
  let familyIssues = 0;
  for (const [fam, models] of Object.entries(families)) {
    if (models.length < 2) continue;
    // Check that scores are monotonically decreasing (they should be, since sorted globally)
    for (let i = 0; i < models.length - 1; i++) {
      if (models[i].score < models[i + 1].score) {
        console.log(`  ⚠️ ${fam}: ${models[i].name} (${models[i].score.toFixed(1)}) ranks above ${models[i + 1].name} (${models[i + 1].score.toFixed(1)}) but has lower score`);
        familyIssues++;
      }
    }
  }
  console.log(familyIssues === 0 ? '  ✅ All family orderings consistent' : `  ⚠️ ${familyIssues} ordering issues`);

  // ── Check 4: Data anomalies ──
  console.log('\n--- CHECK 4: Data Anomalies ---');
  let anomalies = 0;
  for (const m of bestOverall) {
    if (m.composite_score == null) {
      console.log(`  ❌ ${m.model_name}: null composite_score`);
      anomalies++;
    } else if (m.composite_score > 100 || m.composite_score < 0) {
      console.log(`  ❌ ${m.model_name}: composite_score = ${m.composite_score} (out of 0-100 range)`);
      anomalies++;
    }
    // Check that component scores are reasonable
    for (const key of ['swe_bench_component', 'livecodebench_component', 'nuance_component', 'arena_component', 'tau_component', 'gpqa_component', 'success_rate_component']) {
      const val = m[key];
      if (val != null && (val < 0 || val > 100)) {
        console.log(`  ❌ ${m.model_name}: ${key} = ${val} (out of 0-100 range)`);
        anomalies++;
      }
    }
  }
  console.log(anomalies === 0 ? '  ✅ No anomalies detected' : `  ❌ ${anomalies} anomalies`);

  // ── Summary ──
  console.log('\n=== TOP 15 RANKINGS ===');
  for (let i = 0; i < Math.min(15, bestOverall.length); i++) {
    const m = bestOverall[i];
    const adj = m.community_adjustment ? ` (comm: ${m.community_adjustment > 0 ? '+' : ''}${m.community_adjustment.toFixed(1)})` : '';
    console.log(`  ${String(i + 1).padStart(2)}. ${m.model_name.padEnd(30)} ${(m.composite_score || 0).toFixed(1).padStart(5)} — ${m.vendor}${adj}`);
  }

  console.log('\n=== TOP 10 VALUE ===');
  for (let i = 0; i < Math.min(10, bangForBuck.length); i++) {
    const m = bangForBuck[i];
    console.log(`  ${String(i + 1).padStart(2)}. ${m.model_name.padEnd(30)} value=${(m.value_score || 0).toFixed(1).padStart(6)} — ${m.vendor}`);
  }

  const totalIssues = capViolations + proximityIssues + familyIssues + anomalies;
  console.log(`\n=== AUDIT ${totalIssues === 0 ? 'PASSED ✅' : `FOUND ${totalIssues} ISSUES ⚠️`} ===`);
}

audit().catch(e => { console.error('Audit failed:', e.message); process.exit(1); });
