import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPlanRecords,
  isCatalogVisiblePlan,
  isCodingSubscriptionPlan,
} from './plan-catalog.js';

test('buildPlanRecords exposes comparison metadata and reference pricing labels', () => {
  const plans = buildPlanRecords(
    [{
      id: 101,
      tool_name: 'Qwen',
      plan_name: 'Code Pro',
      price_monthly: null,
      features: JSON.stringify({
        features: ['Qwen Studio', 'Web Dev'],
        comparison: {
          track: 'coding-subscription',
          hidden_from_catalog: true,
          pricing_confidence: 'reference',
          reference_price_label: '$50/mo reference',
          reference_price_monthly: 50,
          flagship_model: 'Qwen 3.5 Plus',
        },
      }),
      models_included: JSON.stringify(['qwen-3.5-plus']),
      reviews: JSON.stringify([{ source: 'docs', satisfaction: 74 }]),
    }],
    {
      'qwen-3.5-plus': {
        slug: 'qwen-3.5-plus',
        name: 'Qwen 3.5 Plus',
        vendor: 'Alibaba',
        input_price_per_mtok: null,
        output_price_per_mtok: null,
      },
    },
    []
  );

  assert.equal(plans.length, 1);
  assert.equal(plans[0].comparison.track, 'coding-subscription');
  assert.equal(plans[0].catalog_hidden, true);
  assert.equal(plans[0].pricing_status, 'reference');
  assert.equal(plans[0].price_display, '$50/mo reference');
  assert.equal(plans[0].price_anchor, 50);
  assert.equal(plans[0].model_pricing[0].slug, 'qwen-3.5-plus');
  assert.equal(plans[0].reviews.length, 1);
});

test('buildPlanRecords prefers plan-specific availability rows and preserves sort order', () => {
  const plans = buildPlanRecords(
    [{
      id: 202,
      tool_name: 'MiniMax',
      plan_name: 'Token Plan',
      price_monthly: null,
      features: JSON.stringify({ comparison: { track: 'coding-subscription' } }),
      models_included: JSON.stringify(['minimax-m2-7', 'minimax-m2-5-highspeed']),
      reviews: '[]',
    }],
    {},
    [
      {
        plan_id: 202,
        slug: 'minimax-m2-5-highspeed',
        name: 'MiniMax M2.5 High-Speed',
        vendor: 'MiniMax',
        input_price_per_mtok: null,
        output_price_per_mtok: null,
        access_level: 'full',
        credits_per_request: 4,
        cost_notes: null,
      },
      {
        plan_id: 202,
        slug: 'minimax-m2-7',
        name: 'MiniMax M2.7',
        vendor: 'MiniMax',
        input_price_per_mtok: null,
        output_price_per_mtok: null,
        access_level: 'full',
        credits_per_request: 1,
        cost_notes: null,
      },
    ]
  );

  assert.equal(plans[0].model_pricing[0].slug, 'minimax-m2-7');
  assert.equal(plans[0].model_pricing[1].slug, 'minimax-m2-5-highspeed');
  assert.equal(isCodingSubscriptionPlan(plans[0]), true);
  assert.equal(isCatalogVisiblePlan(plans[0]), true);
});