import assert from 'node:assert/strict';
import test from 'node:test';
import { rackets } from '../src/data/rackets.js';
import { strings } from '../src/data/strings.js';
import { estimateCustomization, simulateSetupChange } from '../src/lib/setupSimulator.js';

test('lower tension improves comfort and lowers string-bed stiffness estimate', () => {
  const racket = rackets.find((item) => item.name.includes('Blade 98 V9 (16x19)'));
  const string = strings.find((item) => item.name.includes('RPM Blast 125'));

  const simulation = simulateSetupChange({
    racket,
    string,
    baselineOptions: { tension: 54, playerHasPain: false },
    changeOptions: { tension: 48 },
  });

  assert.ok(simulation.deltas.effectiveComfort > 0);
  assert.ok(simulation.deltas.estimatedStringBedStiffness < 0);
});

test('added weight at 12 raises swingweight and stability while reducing maneuverability', () => {
  const racket = rackets[0];
  const customization = estimateCustomization(racket, {
    addedWeightGrams: 6,
    weightPlacement: '12',
  });

  assert.ok(customization.swingweightDelta > 0);
  assert.ok(customization.stabilityDelta > 0);
  assert.ok(customization.maneuverabilityDelta < 0);
});
