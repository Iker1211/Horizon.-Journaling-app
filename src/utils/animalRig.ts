import type { AvatarCharacterId } from '../types';
import type { PenguinMotionPose } from './penguinMotion';
import { deformPenguinPoint } from './penguinRig';

type AnimalRig = {
  bounds: readonly [number, number, number, number];
  root: readonly [number, number];
  eye: readonly [number, number];
  eyeCrop: readonly [number, number, number, number];
  headRotationScale: number;
  floor: number;
  displayHeight: number;
};

/** Authored 400×400 SVG coordinates. Each eye comes from its original eye-line. */
export const ANIMAL_RIGS: Record<AvatarCharacterId, AnimalRig> = {
  penguin: {
    bounds: [68, 18, 340, 399], root: [200, 381], eye: [161.6, 93.5],
    eyeCrop: [146, 78, 33, 33], headRotationScale: 1, floor: 395, displayHeight: 370,
  },
  otter: {
    bounds: [39, 51, 383, 399], root: [200, 381], eye: [124.6, 92],
    eyeCrop: [111, 79, 29, 29], headRotationScale: 0.85, floor: 397, displayHeight: 344,
  },
  yak: {
    bounds: [52, 1, 357, 329], root: [201, 312], eye: [141.9, 107],
    eyeCrop: [129, 94, 27, 28], headRotationScale: 0.5, floor: 326, displayHeight: 323,
  },
  bear: {
    bounds: [35, 29, 367, 365], root: [201, 347], eye: [135.7, 102],
    eyeCrop: [123, 89, 27, 28], headRotationScale: 0.75, floor: 362, displayHeight: 330,
  },
  pterodactyl: {
    bounds: [5, 5, 357, 392], root: [198, 374], eye: [152.9, 99.5],
    eyeCrop: [138, 85, 32, 32], headRotationScale: 0.6, floor: 389, displayHeight: 382,
  },
};

const smooth = (a: number, b: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const window = (a: number, b: number, c: number, d: number, value: number) =>
  smooth(a, b, value) * (1 - smooth(c, d, value));

/**
 * Continuous small joint movements of the selected illustration, never a new
 * animal. Seated paws, a heavy yak and a folded wing use different influences.
 * All influences are zero in the neutral pose; the approved penguin is reused.
 */
export function deformAnimalPoint(characterId: AvatarCharacterId, x: number, y: number, pose: PenguinMotionPose) {
  if (characterId === 'penguin') return deformPenguinPoint(x, y, pose);
  let dx = 0, dy = 0;
  const rotate = (cx: number, cy: number, angle: number, weight: number) => {
    const c = Math.cos(angle), s = Math.sin(angle);
    dx += ((x - cx) * (c - 1) - (y - cy) * s) * weight;
    dy += ((x - cx) * s + (y - cy) * (c - 1)) * weight;
  };
  const feet = (start: number, end: number, left: number, right: number, split: number, lift: number) => {
    const weight = smooth(start, end, y) * (1 - smooth(left, right, x));
    const side = smooth(split - 12, split + 12, x) * 2 - 1;
    dy -= lift * Math.max(0, pose.step * side) * weight;
    dx += pose.step * 2 * side * weight;
  };

  switch (characterId) {
    case 'otter': {
      const head = (1 - smooth(152, 219, y)) * (1 - smooth(224, 290, x));
      rotate(166, 178, pose.headTurn * 0.85, head);
      dy += pose.headBob * 3.4 * head;
      // Forepaws lean from the shoulder; the broad seated tail stays grounded.
      rotate(187, 221, -pose.flipper * 0.5,
        window(120, 164, 222, 266, x) * smooth(211, 284, y));
      rotate(113, 228, pose.flipper * 0.2,
        (1 - smooth(112, 159, x)) * smooth(222, 291, y));
      rotate(281, 312, pose.flipper * 0.15,
        smooth(269, 331, x) * smooth(280, 342, y));
      feet(346, 382, 211, 254, 147, 3.5);
      const chest = window(171, 221, 326, 379, y) * (1 - smooth(248, 310, x));
      dx += (x - 184) * 0.004 * pose.breath * chest;
      dy -= 1.8 * pose.breath * (1 - smooth(331, 386, y));
      break;
    }
    case 'yak': {
      const head = (1 - smooth(155, 230, y)) * (1 - smooth(247, 315, x));
      rotate(205, 178, pose.headTurn * 0.5, head);
      dy += pose.headBob * 2.2 * head;
      // Its horns and mane turn together, while heavy hooves only shift weight.
      rotate(183, 231, -pose.flipper * 0.15,
        window(103, 143, 219, 268, x) * smooth(209, 276, y));
      feet(269, 310, 235, 283, 151, 2.2);
      const chest = window(165, 214, 270, 317, y);
      dx += (x - 205) * 0.003 * pose.breath * chest;
      dy -= 1.35 * pose.breath * (1 - smooth(266, 318, y));
      break;
    }
    case 'bear': {
      const head = (1 - smooth(152, 218, y)) * (1 - smooth(248, 307, x));
      rotate(184, 178, pose.headTurn * 0.75, head);
      dy += pose.headBob * 3 * head;
      rotate(210, 211, -pose.flipper * 0.45,
        window(119, 158, 225, 270, x) * smooth(199, 272, y));
      rotate(118, 218, pose.flipper * 0.18,
        (1 - smooth(119, 159, x)) * smooth(208, 281, y));
      feet(310, 349, 228, 276, 145, 3);
      const chest = window(169, 221, 295, 345, y);
      dx += (x - 201) * 0.004 * pose.breath * chest;
      dy -= 1.6 * pose.breath * (1 - smooth(297, 354, y));
      break;
    }
    case 'pterodactyl': {
      // The long beak and crest rotate as one; the folded wing is a separate joint.
      const head = (1 - smooth(161, 234, y))
        * (1 - smooth(219, 275, x) * smooth(129, 176, y));
      rotate(179, 187, pose.headTurn * 0.6, head);
      dy += pose.headBob * 2.8 * head;
      rotate(205, 220, -pose.flipper * 0.65,
        smooth(171, 238, x) * window(169, 231, 350, 389, y));
      feet(337, 376, 222, 269, 147, 3.5);
      const chest = window(182, 232, 316, 372, y);
      dx += (x - 180) * 0.004 * pose.breath * chest;
      dy -= 1.7 * pose.breath * (1 - smooth(326, 381, y));
      break;
    }
  }
  return { x: x + dx, y: y + dy };
}
