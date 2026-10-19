import type { PenguinMotionPose } from './penguinMotion';

const smooth = (a: number, b: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Skin the original 400×400 illustration; neutral coordinates are unchanged. */
export function deformPenguinPoint(x: number, y: number, pose: PenguinMotionPose) {
  let dx = 0, dy = 0;
  const rotate = (cx: number, cy: number, angle: number, weight: number) => {
    const c = Math.cos(angle), s = Math.sin(angle);
    dx += ((x - cx) * (c - 1) - (y - cy) * s) * weight;
    dy += ((x - cx) * s + (y - cy) * (c - 1)) * weight;
  };
  const head = 1 - smooth(145, 208, y);
  rotate(207, 178, pose.headTurn, head);
  dy += pose.headBob * 4 * head;

  // Continuous weights preserve the painted shoulder and neck, without cut seams.
  const near = smooth(218, 273, x) * smooth(185, 260, y) * (1 - smooth(333, 360, y));
  const far = (1 - smooth(108, 146, x)) * smooth(184, 245, y) * (1 - smooth(307, 340, y));
  rotate(223, 188, -pose.flipper, near);
  rotate(125, 188, pose.flipper * 0.45, far);

  const foot = smooth(328, 370, y) * (1 - smooth(210, 246, x));
  const front = smooth(133, 151, x);
  const lift = Math.max(0, pose.step * (front * 2 - 1));
  dy -= 5 * lift * foot;
  dx += pose.step * 3 * (front * 2 - 1) * foot;

  const torso = smooth(160, 210, y) * (1 - smooth(313, 355, y));
  dx += (x - 197) * 0.005 * pose.breath * torso;
  dy -= 2 * pose.breath * (1 - smooth(321, 375, y));
  return { x: x + dx, y: y + dy };
}
