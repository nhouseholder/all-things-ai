import assert from 'node:assert/strict';
import test from 'node:test';

import { TRUST_RANK, selectBestFacts, buildVendorUpdate, FACT_COLUMNS } from './vendor-facts.js';

test('TRUST_RANK orders tiers correctly', () => {
  assert.ok(TRUST_RANK.gold > TRUST_RANK.silver);
  assert.ok(TRUST_RANK.silver > TRUST_RANK.bronze);
  assert.ok(TRUST_RANK.bronze > TRUST_RANK.unverified);
});

test('selectBestFacts picks higher-trust source over bronze regardless of recency', () => {
  const facts = [
    { fact_type: 'total_funding_usd', value_number: 1000000000, source_trust: 'bronze', observed_at: 2000 },
    { fact_type: 'total_funding_usd', value_number: 1300000000, source_trust: 'gold',   observed_at: 1000 },
  ];
  const best = selectBestFacts(facts);
  assert.equal(best.get('total_funding_usd').value_number, 1300000000);
  assert.equal(best.get('total_funding_usd').source_trust, 'gold');
});

test('selectBestFacts breaks ties by recency when trust is equal', () => {
  const facts = [
    { fact_type: 'employee_count', value_number: 150, source_trust: 'silver', observed_at: 1000 },
    { fact_type: 'employee_count', value_number: 200, source_trust: 'silver', observed_at: 2000 },
  ];
  const best = selectBestFacts(facts);
  assert.equal(best.get('employee_count').value_number, 200);
});

test('selectBestFacts ignores unknown fact_type and null values', () => {
  const facts = [
    { fact_type: 'made_up',        value_number: 999,  source_trust: 'gold',   observed_at: 1 },
    { fact_type: 'employee_count', value_number: null, source_trust: 'gold',   observed_at: 1 },
    { fact_type: 'employee_count', value_number: 42,   source_trust: 'bronze', observed_at: 1 },
  ];
  const best = selectBestFacts(facts);
  assert.ok(!best.has('made_up'));
  assert.equal(best.get('employee_count').value_number, 42);
});

test('buildVendorUpdate emits SET clause and uses lowest observed trust', () => {
  const best = new Map([
    ['total_funding_usd', { fact_type: 'total_funding_usd', value_number: 1300000000, source_trust: 'gold',   observed_at: 2000 }],
    ['employee_count',    { fact_type: 'employee_count',    value_number: 200,        source_trust: 'bronze', observed_at: 1500 }],
  ]);
  const update = buildVendorUpdate(best);
  // lowest-trust among selected facts should win (so the chip reflects the weakest link)
  assert.ok(update.setClause.includes('source_trust = ?'));
  const trustIdx = update.setClause.split(', ').findIndex((c) => c === 'source_trust = ?');
  // walk the flat values array and find the corresponding value
  const valuesByCol = update.setClause.split(', ').map((clause, i) => [clause.split(' = ')[0], update.values[i]]);
  const trustVal = valuesByCol.find(([col]) => col === 'source_trust')[1];
  assert.equal(trustVal, 'bronze');
  assert.ok(update.setClause.includes('total_funding_usd = ?'));
  assert.ok(update.setClause.includes('employee_count = ?'));
});

test('buildVendorUpdate returns null for empty selection', () => {
  assert.equal(buildVendorUpdate(new Map()), null);
});

test('FACT_COLUMNS maps every schema column that should be promoted', () => {
  const required = ['employee_count', 'total_funding_usd', 'latest_valuation_usd', 'rnd_commitment_usd'];
  for (const k of required) {
    assert.ok(FACT_COLUMNS[k], `missing FACT_COLUMNS entry for ${k}`);
  }
});
