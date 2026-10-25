import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/utils/penguinMotion.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
}).outputText;
const { createCompanionPresenceMotion } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const state = (cue = 'available', confirmation = 0, overrides = {}) => ({ presence: { cue, confirmation }, quiet: false, suppressed: false, ...overrides });
const motion = (seed = 42, character = 'penguin', initial = state()) => createCompanionPresenceMotion(seed, character, initial.presence);
const limits = { x: 7, y: 2, lean: 0.08, headTurn: 0.1, headBob: 2, flipper: 0.16, step: 1 };
const still = pose => {
  for (const channel of ['x', 'lean', 'headTurn', 'flipper', 'step']) assert.equal(pose[channel], 0, `${channel} should be resting`);
};

test('an old successful-save counter on mount never acknowledges an earlier operation', () => {
  const saved = motion(42, 'penguin', state('saved', 8));
  const control = motion(42, 'penguin', state('focus', 8));
  for (let now = 0; now <= 5_000; now += 20) {
    assert.deepEqual(saved.sample(now, state('saved', 8)), control.sample(now, state('focus', 8)));
  }
});

test('a confirmed save gives one 1.2-second nod, without a wave or restart on repeated renders', () => {
  const saved = motion(), control = motion();
  saved.sample(0, state()); control.sample(0, state());
  saved.sample(1_000, state('saved', 1)); control.sample(1_000, state('saved'));
  const nod = saved.sample(1_600, state('saved', 1));
  const neutral = control.sample(1_600, state('saved'));
  assert.ok(nod.headBob - neutral.headBob > 0.7);
  assert.equal(nod.flipper, 0);
  assert.equal(nod.step, 0);
  assert.deepEqual(saved.sample(1_600, state('saved', 1)), nod);
  assert.deepEqual(saved.sample(2_200, state('saved', 1)), control.sample(2_200, state('saved')));
  assert.deepEqual(saved.sample(3_000, state('saved', 1)), control.sample(3_000, state('saved')));
});

test('rapid confirmations are consumed instead of forming a queue', () => {
  const saved = motion(), control = motion();
  saved.sample(0, state()); control.sample(0, state());
  saved.sample(1_000, state('saved', 1)); control.sample(1_000, state('saved'));
  saved.sample(3_000, state('saved', 2)); control.sample(3_000, state('saved'));
  assert.deepEqual(saved.sample(3_600, state('saved', 2)), control.sample(3_600, state('saved')));
  assert.deepEqual(saved.sample(9_200, state('saved', 2)), control.sample(9_200, state('saved')));
  saved.sample(10_000, state('saved', 3));
  assert.ok(saved.sample(10_600, state('saved', 3)).headBob - control.sample(10_600, state('saved')).headBob > 0.7);
});

test('failure, saving and focus outrank confirmation and do not reveal it later', () => {
  for (const cue of ['error', 'saving', 'focus']) {
    const saved = motion(), control = motion();
    saved.sample(0, state()); control.sample(0, state());
    saved.sample(1_000, state(cue, 1)); control.sample(1_000, state(cue));
    assert.deepEqual(saved.sample(1_600, state(cue, 1)), control.sample(1_600, state(cue)));
    saved.greet();
    saved.sample(2_000, state('saved', 1)); control.sample(2_000, state('saved'));
    assert.deepEqual(saved.sample(2_600, state('saved', 1)), control.sample(2_600, state('saved')));
  }
});

test('focus, recent input and open keyboard discard a successful-save gesture', () => {
  const saved = motion(), control = motion();
  saved.sample(0, state()); control.sample(0, state());
  saved.sample(1_000, state('saved', 1, { quiet: true }));
  control.sample(1_000, state('saved', 0, { quiet: true }));
  saved.sample(3_000, state('saved', 1)); control.sample(3_000, state('saved'));
  assert.deepEqual(saved.sample(3_600, state('saved', 1)), control.sample(3_600, state('saved')));
});

test('hidden, paused and reduced-motion policy consumes a confirmation without deferred replay', () => {
  // All three browser policies map to the same explicit engine suppression bit.
  for (const reason of ['hidden', 'paused', 'reduced']) {
    const saved = motion(), control = motion();
    saved.sample(0, state()); control.sample(0, state());
    saved.sample(1_000, state('saved', 1, { suppressed: true }));
    control.sample(1_000, state('saved', 0, { suppressed: true }));
    saved.suspend(1_000); control.suspend(1_000);
    assert.deepEqual(saved.sample(100_000, state('saved', 1, { suppressed: true })), control.sample(100_000, state('saved', 0, { suppressed: true })), reason);
    saved.resume(100_000); control.resume(100_000);
    assert.deepEqual(saved.sample(100_600, state('saved', 1)), control.sample(100_600, state('saved')), reason);
  }
});

test('entering concentration retires a welcome continuously within 650 ms', () => {
  const focused = motion(91, 'otter', state('welcome'));
  const ambient = motion(91, 'otter', state('focus'));
  focused.sample(0, state('welcome')); ambient.sample(0, state('focus'));
  const before = focused.sample(600, state('welcome'));
  assert.ok(before.flipper > 0.05);
  const boundary = focused.sample(600, state('focus'));
  assert.deepEqual(boundary, before);
  let previous = boundary;
  for (let now = 601; now <= 1_250; now++) {
    const pose = focused.sample(now, state('focus'));
    assert.ok(Math.abs(pose.flipper - previous.flipper) < 0.002);
    assert.ok(Math.abs(pose.headTurn - previous.headTurn) < 0.002);
    previous = pose;
  }
  still(previous);
  assert.deepEqual(previous, ambient.sample(1_250, state('focus')));
});

test('concentration remains alive without walks, waves or attention gestures', () => {
  for (const cue of ['focus', 'saving', 'error']) {
    const focused = motion();
    let minBreath = 1, maxBreath = 0, blinkSeen = false;
    for (let now = 0; now <= 90_000; now += 40) {
      const pose = focused.sample(now, state(cue));
      focused.greet();
      still(pose);
      minBreath = Math.min(minBreath, pose.breath);
      maxBreath = Math.max(maxBreath, pose.breath);
      blinkSeen ||= pose.blink > 0.9;
    }
    assert.ok(maxBreath - minBreath > 0.25);
    assert.ok(blinkSeen);
  }
});

test('welcome has a 90-second cooldown and no deferred greeting after writing', () => {
  const companion = motion(42, 'penguin', state('welcome'));
  companion.sample(0, state('welcome'));
  assert.ok(companion.sample(600, state('welcome')).flipper > 0.04);
  companion.sample(3_000, state('available'));
  companion.sample(4_000, state('welcome'));
  assert.equal(companion.sample(4_600, state('welcome')).flipper, 0);
  companion.sample(5_000, state('focus'));
  companion.sample(100_000, state('welcome', 0, { quiet: true }));
  assert.equal(companion.sample(101_000, state('welcome')).flipper, 0);
  companion.sample(102_000, state('available'));
  companion.sample(103_000, state('welcome'));
  assert.ok(companion.sample(103_600, state('welcome')).flipper > 0.04);
});

test('discretionary movement is sparse, small and reproducible at different frame frequencies', () => {
  for (const character of ['otter', 'yak', 'pterodactyl', 'bear', 'penguin']) {
    const dense = motion(2027, character), sparse = motion(2027, character);
    dense.sample(0, state()); sparse.sample(0, state());
    let starts = 0, previouslyMoving = false;
    for (let now = 20; now <= 180_000; now += 20) {
      const pose = dense.sample(now, state());
      const moving = Math.abs(pose.headTurn) > 0.00001;
      if (moving && !previouslyMoving) starts++;
      previouslyMoving = moving;
      assert.equal(pose.flipper, 0);
      assert.equal(pose.step, 0);
      assert.ok(Math.abs(pose.x) < 0.5 && Math.abs(pose.headTurn) <= 0.055);
      if (now % 1_000 === 0) assert.deepEqual(sparse.sample(now, state()), pose);
    }
    assert.ok(starts >= 10 && starts <= 18, `${character}: ${starts} gestures in three minutes`);
  }
});

test('all personalities stay inside the authored stage through cues, interruptions and slow frames', () => {
  for (const character of ['otter', 'yak', 'pterodactyl', 'bear', 'penguin']) {
    const companion = motion(14, character, state('welcome'));
    const cues = ['welcome', 'available', 'saved', 'error', 'saving', 'focus'];
    for (let now = 0; now <= 180_000; now += 40) {
      const pose = companion.sample(now, state(cues[Math.floor(now / 9_000) % cues.length], Math.floor(now / 10_000)));
      for (const [channel, limit] of Object.entries(limits)) assert.ok(Number.isFinite(pose[channel]) && Math.abs(pose[channel]) <= limit);
      assert.ok(pose.blink >= 0 && pose.blink <= 1);
      assert.ok(pose.breath >= 0 && pose.breath <= 1);
    }
    const before = companion.sample(181_000, state('focus'));
    assert.deepEqual(companion.sample(180_000, state('focus')), before);
    assert.deepEqual(companion.sample(Number.NaN, state('focus')), before);
    assert.deepEqual(companion.sample(Infinity, state('focus')), before);
  }
});
