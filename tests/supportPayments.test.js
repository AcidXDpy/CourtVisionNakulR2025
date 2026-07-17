import assert from 'node:assert/strict';
import test from 'node:test';
import { supportTiers, supportTiersById } from '../src/data/supportTiers.js';

test('support tiers have stable checkout-safe ids and dollar labels', () => {
  assert.equal(supportTiers.length, 4);

  const ids = new Set();
  supportTiers.forEach((tier) => {
    assert.match(tier.id, /^[a-z0-9-]+$/);
    assert.ok(tier.amountCents >= 1000);
    assert.equal(tier.amountCents % 100, 0);
    assert.equal(tier.amountLabel, `$${tier.amountCents / 100}`);
    assert.ok(tier.title);
    assert.ok(tier.description.includes('GearVision') || tier.description.length > 40);
    ids.add(tier.id);
  });

  assert.equal(ids.size, supportTiers.length);
});

test('support tier lookup mirrors the tier array exactly', () => {
  supportTiers.forEach((tier) => {
    assert.equal(supportTiersById[tier.id], tier);
  });
});
