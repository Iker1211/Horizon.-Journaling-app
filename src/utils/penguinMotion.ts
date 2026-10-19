/** Small deformations of the original avatar, never a replacement character. */
export type PenguinMotionPose = {
  x: number;
  y: number;
  lean: number;
  headTurn: number;
  headBob: number;
  flipper: number;
  step: number;
  blink: number;
  breath: number;
};

type Gesture = 'greet' | 'look' | 'nod' | 'flipper' | 'walk' | 'shift';
type Action = { kind: Gesture; start: number; duration: number; direction: number };
const TAU = Math.PI * 2;
const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));
const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

function seededRandom(seed: number) {
  let randomState = seed >>> 0;
  return () => {
    randomState += 0x6d2b79f5;
    let value = randomState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded, timer-free choreography. All time is active monotonic milliseconds. */
export function createPenguinMotion(seed = 0x48525a4e) {
  const normalizedSeed = Number.isFinite(seed) ? seed : 0x48525a4e;
  const random = seededRandom(normalizedSeed);
  // Separate schedules must not consume each other's randomness on a slow frame.
  const blinkRandom = seededRandom(normalizedSeed ^ 0x626c696e);
  const between = (min: number, max: number) => min + random() * (max - min);
  const blinkBetween = (min: number, max: number) => min + blinkRandom() * (max - min);
  const breathPhase = between(0, TAU);
  const breathPeriod = between(4_300, 5_600);
  const pause = (quiet: boolean) => quiet ? between(2_500, 5_500) : between(1_300, 3_200);
  const makeAction = (kind: Gesture, start: number): Action => ({
    kind, start,
    duration: kind === 'greet' ? 2_300 : kind === 'walk' ? between(2_700, 3_600) : between(2_000, 3_100),
    direction: random() < 0.5 ? -1 : 1,
  });
  const chooseGesture = (): Gesture => {
    const choice = random();
    return choice < 0.25 ? 'look' : choice < 0.44 ? 'nod' : choice < 0.65 ? 'flipper' : choice < 0.88 ? 'walk' : 'shift';
  };

  let initialized = false;
  let lastTime = 0;
  let activeTime = 0;
  let suspended = false;
  let quiet = false;
  let quietLevel = 0;
  let action: Action | null = makeAction('greet', 0);
  let nextActionAt = Infinity;
  let greetingPending = false;
  let lastGreeting = 0;
  let blinkAt = blinkBetween(1_900, 3_700);
  let doubleBlink = blinkRandom() < 0.15;

  const validTime = (time: number) => Number.isFinite(time) ? time : lastTime;

  function initialize(nowMs: number, initiallyQuiet = quiet) {
    if (initialized) return;
    lastTime = validTime(nowMs);
    quiet = initiallyQuiet;
    quietLevel = initiallyQuiet ? 1 : 0;
    initialized = true;
  }

  function schedule() {
    // Schedule from the previous boundary, independently of render frequency.
    while (true) {
      if (action) {
        const end = action.start + action.duration;
        if (activeTime < end) break;
        action = null;
        nextActionAt = end + (greetingPending ? 0 : pause(quiet));
      }
      if (activeTime < nextActionAt) break;
      if (greetingPending) {
        action = makeAction('greet', nextActionAt);
        lastGreeting = nextActionAt;
        greetingPending = false;
      } else action = makeAction(chooseGesture(), nextActionAt);
      nextActionAt = Infinity;
    }
    while (activeTime >= blinkAt + (doubleBlink ? 595 : 245)) {
      blinkAt += (doubleBlink ? 595 : 245) + blinkBetween(2_800, 6_800);
      doubleBlink = blinkRandom() < 0.15;
    }
  }

  function advance(nowMs: number) {
    initialize(nowMs);
    const now = Math.max(lastTime, validTime(nowMs));
    const elapsed = now - lastTime;
    lastTime = now;
    // A missed visibility event cannot cause an entire minute of catch-up.
    if (suspended || elapsed > 60_000) return;
    activeTime += elapsed;
    quietLevel += ((quiet ? 1 : 0) - quietLevel) * (1 - Math.exp(-elapsed / 900));
    schedule();
  }

  function eyelid(elapsed: number) {
    if (elapsed < 0 || elapsed >= 245) return 0;
    if (elapsed < 80) return smooth(elapsed / 80);
    if (elapsed < 105) return 1;
    return 1 - smooth((elapsed - 105) / 140);
  }

  function snapshot(): PenguinMotionPose {
    const breathing = Math.sin(activeTime * TAU / breathPeriod + breathPhase);
    const pose: PenguinMotionPose = {
      x: 0,
      y: breathing * 0.24,
      lean: Math.sin(activeTime * TAU / 9_100 + breathPhase) * 0.003,
      headTurn: 0,
      headBob: breathing * 0.16,
      flipper: 0,
      step: 0,
      blink: Math.max(eyelid(activeTime - blinkAt), doubleBlink ? eyelid(activeTime - blinkAt - 350) : 0),
      breath: 0.5 + breathing * 0.16 * (1 - quietLevel * 0.15),
    };
    const gain = 1 - quietLevel * 0.4;
    if (action) {
      const progress = (activeTime - action.start) / action.duration;
      const envelope = smooth(progress / 0.22) * smooth((1 - progress) / 0.3) * gain;
      const lean = action.direction * envelope;
      switch (action.kind) {
        case 'greet':
          pose.x += lean * 1.6;
          pose.y -= envelope * 0.4;
          pose.lean -= lean * 0.045;
          pose.headTurn += lean * 0.075;
          pose.headBob -= envelope * 1.4;
          pose.flipper += envelope * (0.108 + 0.032 * Math.sin(progress * TAU * 2));
          break;
        case 'look':
          pose.x -= lean * 1.2;
          pose.lean -= lean * 0.018;
          pose.headTurn += lean * 0.1;
          pose.headBob += envelope * 0.3;
          break;
        case 'nod':
          pose.lean += lean * 0.025;
          pose.headTurn += lean * 0.045;
          pose.headBob += Math.sin(progress * TAU * 1.4) * envelope * 1.5;
          break;
        case 'flipper':
          pose.x -= lean * 0.9;
          pose.lean -= lean * 0.036;
          pose.headTurn += lean * 0.05;
          pose.headBob -= envelope * 1.1;
          pose.flipper += envelope * (0.1 + 0.05 * Math.sin(progress * TAU * 2));
          break;
        case 'walk': {
          const step = Math.sin(progress * TAU * 2);
          pose.x += action.direction * Math.sin(progress * Math.PI) * envelope * 6;
          pose.y -= (1 - Math.cos(progress * TAU * 2)) * envelope * 0.65;
          pose.lean += step * envelope * 0.065;
          pose.headTurn -= lean * 0.06;
          pose.headBob += step * envelope * 0.7;
          pose.flipper += step * envelope * 0.12;
          pose.step += step * envelope;
          break;
        }
        case 'shift':
          pose.x += action.direction * Math.sin(progress * Math.PI) * envelope * 3;
          pose.lean -= lean * 0.055;
          pose.headTurn += lean * 0.025;
          pose.flipper += envelope * 0.035;
          pose.step += Math.sin(progress * TAU) * envelope * 0.3;
          break;
      }
    }
    pose.x = clamp(pose.x, 7);
    pose.y = clamp(pose.y, 2);
    pose.lean = clamp(pose.lean, 0.08);
    pose.headTurn = clamp(pose.headTurn, 0.1);
    pose.headBob = clamp(pose.headBob, 2);
    pose.flipper = clamp(pose.flipper, 0.16);
    pose.step = clamp(pose.step, 1);
    return pose;
  }

  return {
    sample(nowMs: number, nextQuiet = false): PenguinMotionPose {
      initialize(nowMs, nextQuiet);
      advance(nowMs);
      quiet = nextQuiet;
      return snapshot();
    },
    suspend(nowMs: number) {
      advance(nowMs);
      suspended = true;
    },
    resume(nowMs: number) {
      initialize(nowMs);
      lastTime = Math.max(lastTime, validTime(nowMs));
      suspended = false;
    },
    greet() {
      if (!initialized || suspended || activeTime - lastGreeting < 8_000) return;
      lastGreeting = activeTime;
      if (action) greetingPending = true;
      else {
        action = makeAction('greet', activeTime);
        nextActionAt = Infinity;
      }
    },
  };
}
