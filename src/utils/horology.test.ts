import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WATCH_MODELS,
  CASE_FINISHES,
  calculateConfiguredPrice,
  formatChfPrice,
  computeScrollChoreography,
  computeLayerOffsets,
  calculateWatchKinematics,
  validateEngravingText,
  calculateVaultSummary,
  validateCommissionForm,
} from './horology';

test('calculateConfiguredPrice combines model base price with finish delta', () => {
  const tourbillonRose = calculateConfiguredPrice('tourbillon-souverain', 'rose-gold');
  assert.equal(tourbillonRose, 148000);

  const tourbillonPlatinum = calculateConfiguredPrice('tourbillon-souverain', 'platinum-950');
  assert.equal(tourbillonPlatinum, 162500);

  const squeletteTitanium = calculateConfiguredPrice('squelette-royal', 'grade5-titanium');
  assert.equal(squeletteTitanium, 158000);
});

test('formatChfPrice formats Swiss Franc amounts with thousands separator', () => {
  assert.equal(formatChfPrice(148000), 'CHF 148,000');
  assert.equal(formatChfPrice(162500), 'CHF 162,500');
});

test('computeScrollChoreography interpolates smoothly from hero to exploded calibre and back', () => {
  const start = computeScrollChoreography(0);
  assert.equal(start.activeChapter, 0);
  assert.equal(start.targetExplode, 0);

  // At 1/3 scroll (Chapter 1: Exploded Calibre Anatomy)
  const calibreChapter = computeScrollChoreography(1 / 3);
  assert.equal(calibreChapter.activeChapter, 1);
  assert.ok(calibreChapter.targetExplode > 0.85, 'Calibre chapter should trigger exploded state');

  // At end of scroll (Chapter 3: Collection & Heritage)
  const end = computeScrollChoreography(1);
  assert.equal(end.activeChapter, 3);
  assert.equal(end.targetExplode, 0);
});

test('computeLayerOffsets preserves strict monotonic Z ordering across assembled and exploded states', () => {
  const assembled = computeLayerOffsets(0);
  assert.ok(assembled.crystalZ > assembled.bezelZ);
  assert.ok(assembled.bezelZ > assembled.handsZ);
  assert.ok(assembled.handsZ > assembled.dialZ);
  assert.ok(assembled.dialZ > assembled.tourbillonZ);
  assert.ok(assembled.tourbillonZ > assembled.geartrainZ);
  assert.ok(assembled.geartrainZ > assembled.mainplateZ);
  assert.ok(assembled.mainplateZ > assembled.casebackZ);

  const exploded = computeLayerOffsets(1);
  assert.ok(exploded.crystalZ - exploded.casebackZ > 3.5, 'Exploded span should exceed 3.5 units');
  assert.ok(exploded.crystalZ > exploded.handsZ);
  assert.ok(exploded.handsZ > exploded.dialZ);
  assert.ok(exploded.dialZ > exploded.tourbillonZ);
  assert.ok(exploded.tourbillonZ > exploded.geartrainZ);
  assert.ok(exploded.geartrainZ > exploded.mainplateZ);
  assert.ok(exploded.mainplateZ > exploded.casebackZ);
});

test('calculateWatchKinematics computes 10:10 base pose and full tourbillon rotation after 60s', () => {
  const t0 = calculateWatchKinematics(0, 1);
  assert.equal(t0.tourbillonAngle, 0);
  // At 15s, tourbillon rotates 90 degrees (-PI / 2)
  const t15 = calculateWatchKinematics(15, 1);
  assert.ok(Math.abs(t15.tourbillonAngle - (-Math.PI / 2)) < 1e-6);
});

test('validateEngravingText enforces 24 character limit', () => {
  const ok = validateEngravingText('A. VANDERBILT · 2026');
  assert.equal(ok.valid, true);

  const tooLong = validateEngravingText('ABCDEFGHIJKLMNOPQRSTUVWXYZ12345');
  assert.equal(tooLong.valid, false);
  assert.equal(tooLong.sanitized.length, 24);
});

test('calculateVaultSummary and validateCommissionForm validate private commission flows', () => {
  const summary = calculateVaultSummary([
    {
      id: '1',
      modelId: 'tourbillon-souverain',
      finishId: 'rose-gold',
      engravingText: 'GENEVE',
      quantity: 2,
      unitPriceChf: 148000,
    },
  ]);
  assert.equal(summary.totalQuantity, 2);
  assert.equal(summary.totalChf, 296000);

  const invalidErrors = validateCommissionForm({
    fullName: '',
    email: 'invalid-email',
    phone: '123',
    salonCity: '',
    notes: '',
  });
  assert.ok(invalidErrors.fullName);
  assert.ok(invalidErrors.email);
  assert.ok(invalidErrors.phone);
  assert.ok(invalidErrors.salonCity);

  const validErrors = validateCommissionForm({
    fullName: 'Henri de Montfort',
    email: 'henri@montfort.ch',
    phone: '+41 22 819 00 00',
    salonCity: 'Geneva — Rue du Rhône Flagship',
    notes: 'Private viewing requested',
  });
  assert.equal(Object.keys(validErrors).length, 0);
});

test('catalog integrity ensures all models and finishes are valid', () => {
  assert.equal(WATCH_MODELS.length, 3);
  assert.equal(CASE_FINISHES.length, 4);
});
