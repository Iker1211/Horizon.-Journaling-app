import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function compile(relativePath, dependencies = {}) {
  const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
  let output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
  }).outputText;
  for (const [specifier, url] of Object.entries(dependencies)) {
    output = output.replaceAll(`'${specifier}'`, `'${url}'`).replaceAll(`"${specifier}"`, `"${url}"`);
  }
  return `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
}

const penguinUrl = await compile('../src/utils/penguinRig.ts');
const { deformPenguinPoint } = await import(penguinUrl);
const { ANIMAL_RIGS, deformAnimalPoint: deform } = await import(await compile('../src/utils/animalRig.ts', {
  './penguinRig': penguinUrl,
}));
const neutral = { x: 0, y: 0, lean: 0, headTurn: 0, headBob: 0, flipper: 0, step: 0, blink: 0, breath: 0 };
const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance,
  `${actual} differs from ${expected} by more than ${tolerance}`);
const area = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
const mesh = bounds => {
  const vertices = [];
  for (let row = 0; row <= 28; row++) for (let column = 0; column <= 24; column++) {
    vertices.push({ x: bounds[0] + column * (bounds[2] - bounds[0]) / 24,
      y: bounds[1] + row * (bounds[3] - bounds[1]) / 28 });
  }
  return vertices;
};

test('each rig references authored coordinates and includes the entire original silhouette and eye', async () => {
  assert.deepEqual(Object.keys(ANIMAL_RIGS).sort(), ['bear', 'otter', 'penguin', 'pterodactyl', 'yak']);
  // Alpha extents measured from the supplied 1024px renders, in SVG units.
  const originalExtents = {
    otter: [41.02, 53.52, 380.86, 396.88], yak: [54.69, 3.12, 353.91, 326.17],
    bear: [37.5, 31.64, 363.67, 361.72], pterodactyl: [7.03, 7.03, 354.3, 389.06],
  };
  for (const [id, rig] of Object.entries(ANIMAL_RIGS)) {
    const [left, top, right, bottom] = rig.bounds;
    assert.ok(0 <= left && left < right && right <= 400);
    assert.ok(0 <= top && top < bottom && bottom <= 400);
    assert.ok(rig.displayHeight > 300 && rig.displayHeight < 400);
    assert.ok(rig.floor >= rig.root[1] && rig.floor <= bottom);
    if (originalExtents[id]) {
      const [originalLeft, originalTop, originalRight, originalBottom] = originalExtents[id];
      assert.ok(left <= originalLeft && top <= originalTop && right >= originalRight && bottom >= originalBottom,
        `${id} mesh crops the supplied silhouette`);
    }
    const source = await readFile(new URL(`../public/images/characters/${id}.svg`, import.meta.url), 'utf8');
    const eye = source.match(/id="eye-sphere" cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/);
    assert.ok(eye, `${id} must preserve its authored eye group`);
    assert.deepEqual(rig.eye, [Number(eye[1]), Number(eye[2])]);
    const [cx, cy, width, height] = rig.eyeCrop;
    assert.ok(cx <= rig.eye[0] - Number(eye[3]) && cy <= rig.eye[1] - Number(eye[3]));
    assert.ok(cx + width >= rig.eye[0] + Number(eye[3]) && cy + height >= rig.eye[1] + Number(eye[3]));
    for (const { x, y } of [...mesh(rig.bounds), { x: rig.eye[0], y: rig.eye[1] }]) {
      assert.deepEqual(deform(id, x, y, neutral), { x, y }, `${id} neutral pose changes its illustration`);
    }
  }
});

test('the approved penguin geometry and deformations remain exactly unchanged', () => {
  assert.deepEqual(ANIMAL_RIGS.penguin, {
    bounds: [68, 18, 340, 399], root: [200, 381], eye: [161.6, 93.5],
    eyeCrop: [146, 78, 33, 33], headRotationScale: 1, floor: 395, displayHeight: 370,
  });
  for (const sign of [-1, 0, 1]) {
    const pose = { ...neutral, headTurn: sign * 0.1, headBob: sign * 2, flipper: sign * 0.16, step: sign, breath: 1 };
    for (const { x, y } of mesh(ANIMAL_RIGS.penguin.bounds)) {
      assert.deepEqual(deform('penguin', x, y, pose), deformPenguinPoint(x, y, pose));
    }
  }
});

test('all animals retain finite, unfolded triangles at every combined legal channel extreme', () => {
  for (const [id, rig] of Object.entries(ANIMAL_RIGS)) {
    const vertices = mesh(rig.bounds);
    for (const headTurn of [-0.1, 0.1]) for (const headBob of [-2, 2]) {
      for (const flipper of [-0.16, 0.16]) for (const step of [-1, 1]) for (const breath of [0, 1]) {
        const pose = { ...neutral, headTurn, headBob, flipper, step, breath };
        const points = vertices.map(({ x, y }) => deform(id, x, y, pose));
        points.forEach((point, index) => {
          assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
          assert.ok(Math.hypot(point.x - vertices[index].x, point.y - vertices[index].y) < 35);
        });
        for (let row = 0; row < 28; row++) for (let column = 0; column < 24; column++) {
          const a = row * 25 + column, b = a + 1, c = a + 25, d = c + 1;
          for (const [i, j, k] of [[a, b, d], [a, d, c]]) {
            const ratio = area(points[i], points[j], points[k]) / area(vertices[i], vertices[j], vertices[k]);
            assert.ok(ratio > 0.15 && ratio < 1.9, `${id} folded/collapsed triangle ${ratio}: ${JSON.stringify(pose)}`);
          }
        }
      }
    }
  }
});

test('each eye rotates with the whole head, without contamination from paws, hooves or wings', () => {
  for (const [id, rig] of Object.entries(ANIMAL_RIGS)) {
    const [x, y] = rig.eye;
    for (const sign of [-1, 1]) {
      const pose = { ...neutral, headTurn: sign * 0.1, headBob: sign * 2, breath: 1 };
      assert.deepEqual(deform(id, x, y, pose), deform(id, x, y, { ...pose, flipper: sign * 0.16, step: sign }));
      // A tiny eye-sized tangent must receive the same rigid head rotation.
      const a = deform(id, x, y, pose), b = deform(id, x + 1, y, pose);
      close(b.x - a.x, Math.cos(pose.headTurn * rig.headRotationScale));
      close(b.y - a.y, Math.sin(pose.headTurn * rig.headRotationScale));
    }
  }
});

test('limb motion stays below the head and each non-penguin animal has a distinct rig', () => {
  const signatures = new Set();
  for (const [id, rig] of Object.entries(ANIMAL_RIGS)) {
    const limbPose = { ...neutral, flipper: 0.16, step: 1 };
    assert.deepEqual(deform(id, ...rig.eye, limbPose), { x: rig.eye[0], y: rig.eye[1] });
    const deltas = mesh(rig.bounds).map(({ x, y }) => {
      const moved = deform(id, x, y, limbPose);
      return Math.hypot(moved.x - x, moved.y - y);
    });
    assert.ok(Math.max(...deltas) > 3, `${id} needs perceptible articulated motion`);
    signatures.add(JSON.stringify(deltas.map(value => Math.round(value * 100))));
  }
  assert.equal(signatures.size, 5, 'different anatomy must not share a rubber stamp deformation');
});
