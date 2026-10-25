import type { AvatarCharacterId } from '../types';
import type { CompanionPresence, PresenceCue } from './companionPresence';

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

export type CompanionMotionEnvironment = {
  presence: CompanionPresence;
  quiet: boolean;
  /** Hidden, inert, paused or reduced motion: consume events without performing them. */
  suppressed: boolean;
};

type PresenceAction = { kind: 'welcome' | 'look' | 'settle' | 'saved'; start: number; duration: number; direction: number };
type Retirement = { pose: PenguinMotionPose; start: number };
const PRESENCE_RETIRE_MS = 480;
const presencePersonality = {
  otter: { breathPeriod: 4_650, interest: 1, lookChance: 0.78, minRest: 8_000, maxRest: 12_000 },
  yak: { breathPeriod: 5_500, interest: 0.78, lookChance: 0.52, minRest: 11_000, maxRest: 14_000 },
  pterodactyl: { breathPeriod: 4_500, interest: 1.08, lookChance: 0.84, minRest: 8_000, maxRest: 12_600 },
  bear: { breathPeriod: 5_250, interest: 0.85, lookChance: 0.6, minRest: 10_000, maxRest: 14_000 },
  penguin: { breathPeriod: 4_900, interest: 0.94, lookChance: 0.72, minRest: 9_000, maxRest: 13_000 },
} satisfies Record<AvatarCharacterId, { breathPeriod: number; interest: number; lookChance: number; minRest: number; maxRest: number }>;

const noGesture = (): PenguinMotionPose => ({ x: 0, y: 0, lean: 0, headTurn: 0, headBob: 0, flipper: 0, step: 0, blink: 0, breath: 0 });
const quietCue = (cue: PresenceCue) => cue === 'focus' || cue === 'saving' || cue === 'error';
const confirmationNumber = (value: number) => Number.isSafeInteger(value) && value >= 0 ? value : 0;

/**
 * Contextual choreography, separate from the unchanged baseline above.
 * It receives UI state only; it cannot inspect entries, accounts or journal text.
 * Events are consumed on observation, including while suppressed, never queued.
 */
export function createCompanionPresenceMotion(seed: number, characterId: AvatarCharacterId, initialPresence: CompanionPresence) {
  const normalizedSeed = Number.isFinite(seed) ? seed : 0x48525a4e;
  const random = seededRandom(normalizedSeed ^ 0x70726573);
  const blinkRandom = seededRandom(normalizedSeed ^ 0x626c696e);
  const personality = presencePersonality[characterId];
  const between = (min: number, max: number) => min + random() * (max - min);
  const blinkBetween = (min: number, max: number) => min + blinkRandom() * (max - min);
  const breathPhase = between(0, TAU);
  const breathPeriod = personality.breathPeriod + between(-140, 140);
  const rest = () => between(personality.minRest, personality.maxRest);
  let initialized = false, lastTime = 0, activeTime = 0, suspended = false;
  let environment: CompanionMotionEnvironment = { presence: initialPresence, quiet: false, suppressed: false };
  let previousCue: PresenceCue | null = null;
  let lastConfirmation = confirmationNumber(initialPresence.confirmation);
  let lastWelcomeAt = -Infinity, lastSavedAt = -Infinity, lastAttentionAt = -Infinity;
  let action: PresenceAction | null = null, retirement: Retirement | null = null;
  let nextActionAt = rest();
  let blinkAt = blinkBetween(1_900, 3_700), doubleBlink = blinkRandom() < 0.15;
  let frozen: PenguinMotionPose | null = null;

  const quiet = () => environment.quiet || quietCue(environment.presence.cue);
  const permitted = () => !suspended && !environment.suppressed && !quiet();
  const validTime = (time: number) => Number.isFinite(time) ? time : lastTime;

  function advance(nowMs: number) {
    const now = Math.max(lastTime, validTime(nowMs));
    if (!initialized) { initialized = true; lastTime = now; return; }
    const elapsed = now - lastTime;
    lastTime = now;
    if (suspended || elapsed > 60_000) return;
    activeTime += elapsed;
    while (activeTime >= blinkAt + (doubleBlink ? 595 : 245)) {
      blinkAt += (doubleBlink ? 595 : 245) + blinkBetween(2_800, 6_800);
      doubleBlink = blinkRandom() < 0.15;
    }
    if (retirement && activeTime >= retirement.start + PRESENCE_RETIRE_MS) retirement = null;
    // Scheduling from boundaries keeps the score independent of frame frequency.
    while (true) {
      if (action) {
        if (activeTime < action.start + action.duration) break;
        nextActionAt = action.start + action.duration + rest();
        action = null;
      }
      if (activeTime < nextActionAt || !permitted() || environment.presence.cue !== 'available') break;
      action = makeAction(random() < personality.lookChance ? 'look' : 'settle', nextActionAt);
      nextActionAt = Infinity;
    }
  }

  function makeAction(kind: PresenceAction['kind'], start: number): PresenceAction {
    return { kind, start, duration: kind === 'welcome' ? 2_100 : kind === 'saved' ? 1_200 : between(1_850, 2_500), direction: random() < 0.5 ? -1 : 1 };
  }

  function gesture(): PenguinMotionPose {
    const pose = noGesture();
    if (action) {
      const progress = Math.max(0, Math.min(1, (activeTime - action.start) / action.duration));
      const envelope = smooth(progress / 0.24) * smooth((1 - progress) / 0.3) * personality.interest;
      const direction = action.direction * envelope;
      switch (action.kind) {
        case 'welcome':
          pose.x = direction * 0.9;
          pose.lean = -direction * 0.032;
          pose.headTurn = direction * 0.065;
          pose.headBob = -envelope * 0.65;
          pose.flipper = envelope * (0.072 + 0.014 * Math.sin(progress * TAU));
          break;
        case 'look':
          pose.x = -direction * 0.45;
          pose.lean = -direction * 0.013;
          pose.headTurn = direction * 0.05;
          pose.headBob = -envelope * 0.15;
          break;
        case 'settle':
          pose.x = direction * 0.3;
          pose.lean = direction * 0.012;
          pose.headTurn = direction * 0.015;
          pose.headBob = envelope * 0.3;
          break;
        case 'saved':
          // A single small nod, never the greeting wave or a celebration.
          pose.headBob = Math.sin(progress * Math.PI) * envelope * 1.1;
          pose.lean = -envelope * 0.009;
          pose.headTurn = direction * 0.018;
          break;
      }
    }
    if (retirement) {
      const weight = 1 - smooth((activeTime - retirement.start) / PRESENCE_RETIRE_MS);
      for (const channel of ['x', 'y', 'lean', 'headTurn', 'headBob', 'flipper', 'step'] as const) pose[channel] += retirement.pose[channel] * weight;
    }
    return pose;
  }

  function retire() {
    // A held focus signal must not restart the 480 ms retirement every frame.
    if (!action) return;
    retirement = { pose: gesture(), start: activeTime };
    action = null;
  }

  function begin(kind: PresenceAction['kind']) {
    retire();
    action = makeAction(kind, activeTime);
    nextActionAt = Infinity;
  }

  function synchronize(nowMs: number, next: CompanionMotionEnvironment) {
    advance(nowMs);
    const cueChanged = previousCue !== next.presence.cue;
    const confirmation = confirmationNumber(next.presence.confirmation);
    const newlyConfirmed = confirmation > lastConfirmation;
    lastConfirmation = confirmation;
    environment = next;
    previousCue = next.presence.cue;

    if (next.suppressed || suspended) {
      // Do not leave a successful-save gesture waiting to continue after a pause.
      action = null; retirement = null; nextActionAt = activeTime + rest();
      return;
    }
    if (quiet()) {
      retire();
      if (cueChanged) nextActionAt = activeTime + rest();
      return;
    }
    if (newlyConfirmed && next.presence.cue === 'saved' && lastTime - lastSavedAt >= 8_000) {
      lastSavedAt = lastTime;
      begin('saved');
    } else if (cueChanged && next.presence.cue === 'welcome' && lastTime - lastWelcomeAt >= 90_000) {
      lastWelcomeAt = lastTime;
      begin('welcome');
    } else if (cueChanged) {
      // Entering a context cannot reveal a stale discretionary action or cue.
      retire();
      nextActionAt = activeTime + rest();
    }
  }

  function eyelid(elapsed: number) {
    if (elapsed < 0 || elapsed >= 245) return 0;
    if (elapsed < 80) return smooth(elapsed / 80);
    if (elapsed < 105) return 1;
    return 1 - smooth((elapsed - 105) / 140);
  }

  function snapshot(): PenguinMotionPose {
    const breathing = Math.sin(activeTime * TAU / breathPeriod + breathPhase);
    const pose = gesture();
    pose.y += breathing * 0.17;
    pose.headBob += breathing * 0.11;
    pose.blink = Math.max(eyelid(activeTime - blinkAt), doubleBlink ? eyelid(activeTime - blinkAt - 350) : 0);
    pose.breath = 0.5 + breathing * 0.14;
    pose.x = clamp(pose.x, 7); pose.y = clamp(pose.y, 2);
    pose.lean = clamp(pose.lean, 0.08); pose.headTurn = clamp(pose.headTurn, 0.1);
    pose.headBob = clamp(pose.headBob, 2); pose.flipper = clamp(pose.flipper, 0.16); pose.step = clamp(pose.step, 1);
    return pose;
  }

  return {
    sample(nowMs: number, next: CompanionMotionEnvironment): PenguinMotionPose {
      synchronize(nowMs, next);
      return suspended && frozen ? frozen : snapshot();
    },
    synchronize,
    suspend(nowMs: number) {
      advance(nowMs);
      frozen = snapshot();
      suspended = true;
      action = null; retirement = null;
    },
    resume(nowMs: number) {
      lastTime = Math.max(lastTime, validTime(nowMs));
      initialized = true; suspended = false; frozen = null;
      nextActionAt = activeTime + rest();
    },
    greet() {
      if (!initialized || !permitted() || environment.presence.cue !== 'available' || lastTime - lastAttentionAt < 12_000) return;
      lastAttentionAt = lastTime;
      begin('look');
    },
  };
}
