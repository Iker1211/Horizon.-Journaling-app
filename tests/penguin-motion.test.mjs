import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/utils/penguinMotion.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
}).outputText;
const { createPenguinMotion } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const limits = { x: 7, y: 2, lean: 0.08, headTurn: 0.1, headBob: 2, flipper: 0.16, step: 1 };

test('startup immediately begins a readable greeting without an initial pose jump', () => {
  for (const quiet of [false, true]) {
    const motion = createPenguinMotion(42);
    const first = motion.sample(1_000, quiet);
    assert.equal(first.x, 0);
    assert.equal(first.headTurn, 0);
    assert.equal(first.flipper, 0);
    const greeting = motion.sample(1_250, quiet);
    assert.ok(Math.abs(greeting.x) > 0.4);
    assert.ok(greeting.flipper > 0.04);
    assert.ok(Math.abs(greeting.headTurn) > 0.02);
  }
});

test('five-minute performances and attention requests stay within the original avatar stage', () => {
  for (const seed of [0, 1, 42, 2027, -5]) {
    const motion = createPenguinMotion(seed);
    for (let time = 0; time <= 300_000; time += 40) {
      const pose = motion.sample(time, Math.floor(time / 15_000) % 2 === 1);
      if (time % 5_000 === 0) motion.greet();
      for (const [key, limit] of Object.entries(limits)) {
        assert.ok(Number.isFinite(pose[key]) && Math.abs(pose[key]) <= limit, `${key} out of bounds at ${time}`);
      }
      assert.ok(pose.blink >= 0 && pose.blink <= 1);
      assert.ok(pose.breath >= 0 && pose.breath <= 1);
    }
  }
});

test('gesture boundaries, quiet changes, blinking and queued greetings remain temporally continuous', () => {
  const motion = createPenguinMotion(2027);
  let previous = motion.sample(0);
  const maximumDelta = { x: 0.04, y: 0.02, lean: 0.001, headTurn: 0.001, headBob: 0.02, flipper: 0.002, step: 0.015, blink: 0.025, breath: 0.001 };
  for (let time = 1; time <= 60_000; time++) {
    if (time === 10_321 || time === 10_322 || time === 25_000) motion.greet();
    const pose = motion.sample(time, time >= 8_000 && time < 21_000);
    for (const [key, delta] of Object.entries(maximumDelta)) {
      assert.ok(Math.abs(pose[key] - previous[key]) < delta, `${key} jumped at ${time}`);
    }
    previous = pose;
  }
});

test('suspension freezes every channel and resume does not replay elapsed background time', () => {
  const motion = createPenguinMotion(14);
  const control = createPenguinMotion(14);
  motion.sample(0);
  control.sample(0);
  const before = motion.sample(1_500);
  assert.deepEqual(before, control.sample(1_500));
  motion.suspend(1_500);
  motion.greet();
  assert.deepEqual(motion.sample(100_000), before);
  motion.resume(200_000);
  assert.deepEqual(motion.sample(200_000), before);
  assert.deepEqual(motion.sample(200_250), control.sample(1_750));
});

test('identical seeds reproduce choreography independently of sampling frequency', () => {
  let differences = 0;
  for (const seed of [0, 7, 98, 2027]) {
    const dense = createPenguinMotion(seed);
    const sparse = createPenguinMotion(seed);
    const other = createPenguinMotion(75);
    dense.sample(0);
    sparse.sample(0);
    other.sample(0);
    for (let time = 20; time <= 180_000; time += 20) {
      const pose = dense.sample(time);
      if (time % 1_340 === 0) {
        assert.deepEqual(sparse.sample(time), pose);
        if (JSON.stringify(other.sample(time)) !== JSON.stringify(pose)) differences++;
      }
    }
  }
  assert.ok(differences > 100);
});

test('quiet mode eases down discretionary gestures while preserving breathing and blinks', () => {
  const active = createPenguinMotion(15);
  const quiet = createPenguinMotion(15);
  let activeEnergy = 0;
  let quietEnergy = 0;
  let minBreath = 1;
  let maxBreath = 0;
  let blinkSeen = false;
  for (let time = 0; time <= 180_000; time += 40) {
    const a = active.sample(time);
    const q = quiet.sample(time, true);
    activeEnergy += Math.abs(a.x) + Math.abs(a.headTurn) + Math.abs(a.flipper);
    quietEnergy += Math.abs(q.x) + Math.abs(q.headTurn) + Math.abs(q.flipper);
    minBreath = Math.min(minBreath, q.breath);
    maxBreath = Math.max(maxBreath, q.breath);
    blinkSeen ||= q.blink > 0.9;
  }
  assert.ok(quietEnergy < activeEnergy * 0.7);
  assert.ok(quietEnergy > activeEnergy * 0.15, 'quiet remains alive rather than frozen');
  assert.ok(maxBreath - minBreath > 0.25);
  assert.ok(blinkSeen);
});

test('blinks occur at irregular intervals, close smoothly, and fully reopen', () => {
  const motion = createPenguinMotion(9);
  const closures = [];
  let previous = 0;
  let reopened = false;
  for (let time = 0; time <= 90_000; time += 5) {
    const blink = motion.sample(time).blink;
    if (blink >= 0.99 && previous < 0.99) closures.push(time);
    if (closures.length && blink === 0) reopened = true;
    assert.ok(Math.abs(blink - previous) < 0.1);
    previous = blink;
  }
  assert.ok(closures.length >= 10 && closures.length <= 35);
  const intervals = closures.slice(1).map((time, index) => time - closures[index]);
  assert.ok(new Set(intervals).size > 4);
  assert.ok(reopened);
});

test('attention starts from the resting pose and repeated calls do not restart the greeting', () => {
  const motion = createPenguinMotion(8);
  const control = createPenguinMotion(8);
  let restingAt = 0;
  for (let time = 0; time <= 25_000; time += 20) {
    const pose = motion.sample(time);
    control.sample(time);
    if (time >= 10_000 && pose.headTurn === 0 && pose.flipper === 0 && pose.x === 0) {
      restingAt = time;
      break;
    }
  }
  assert.ok(restingAt > 0);
  const before = motion.sample(restingAt);
  motion.greet();
  assert.deepEqual(motion.sample(restingAt), before);
  const greeting = motion.sample(restingAt + 500);
  assert.ok(greeting.flipper > 0.05);
  motion.greet();
  assert.deepEqual(motion.sample(restingAt + 500), greeting);
});

test('invalid and backwards times cannot corrupt or rewind a pose, and long gaps do not catch up', () => {
  const motion = createPenguinMotion(Number.NaN);
  motion.sample(0);
  const before = motion.sample(1_000);
  assert.deepEqual(motion.sample(900), before);
  assert.deepEqual(motion.sample(Number.NaN), before);
  assert.deepEqual(motion.sample(Infinity), before);
  assert.deepEqual(motion.sample(100_000), before);
  assert.notDeepEqual(motion.sample(100_250), before);
});
