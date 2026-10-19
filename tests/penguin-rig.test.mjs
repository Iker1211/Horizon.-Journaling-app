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

const rigUrl = await compile('../src/utils/penguinRig.ts');
const animalRigUrl = await compile('../src/utils/animalRig.ts', { './penguinRig': rigUrl });
const catalogUrl = await compile('../src/utils/avatarCharacters.ts');
const { deformPenguinPoint: deform } = await import(rigUrl);
const { AVATAR_CHARACTERS } = await import(catalogUrl);
const { getAnimalPoster, createAnimalIllustrationRenderer } = await import(await compile(
  '../src/lib/animalIllustration.ts',
  { '../utils/animalRig': animalRigUrl, '../utils/avatarCharacters': catalogUrl },
));
const PENGUIN_POSTER = getAnimalPoster('penguin');
const createPenguinIllustrationRenderer = (canvas, art) => createAnimalIllustrationRenderer(canvas, art, 'penguin');

const neutral = { x: 0, y: 0, lean: 0, headTurn: 0, headBob: 0, flipper: 0, step: 0, blink: 0, breath: 0 };
const close = (actual, expected, tolerance = 1e-9) => assert.ok(
  Math.abs(actual - expected) <= tolerance,
  `${actual} differs from ${expected} by more than ${tolerance}`,
);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const area = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
const columns = 24, rows = 28;
const vertices = [];
for (let row = 0; row <= rows; row++) for (let column = 0; column <= columns; column++) {
  vertices.push({ x: 68 + column * 272 / columns, y: 18 + row * 381 / rows });
}

test('the rig uses the picker penguin and neutral coordinates preserve every original UV', () => {
  assert.equal(PENGUIN_POSTER, AVATAR_CHARACTERS.find(character => character.id === 'penguin').src);
  assert.equal(PENGUIN_POSTER, '/images/characters/penguin.svg');
  for (const { x, y } of [...vertices, { x: 161.6, y: 93.5 }, { x: 200, y: 381 }]) {
    assert.deepEqual(deform(x, y, neutral), { x, y });
  }
});

test('all legal channel extrema retain mesh orientation, finite bounds, and noncollapsed triangles', () => {
  for (const headTurn of [-0.1, 0, 0.1]) for (const headBob of [-2, 0, 2]) {
    for (const flipper of [-0.16, 0, 0.16]) for (const step of [-1, 0, 1]) for (const breath of [0, 1]) {
      const pose = { ...neutral, headTurn, headBob, flipper, step, breath };
      const points = vertices.map(({ x, y }) => deform(x, y, pose));
      points.forEach((point, index) => {
        assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
        assert.ok(distance(point, vertices[index]) < 35, 'local joints must remain within their small stage');
      });
      for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
        const a = row * (columns + 1) + column, b = a + 1, c = a + columns + 1, d = c + 1;
        for (const [i, j, k] of [[a, b, d], [a, d, c]]) {
          const ratio = area(points[i], points[j], points[k]) / area(vertices[i], vertices[j], vertices[k]);
          assert.ok(ratio > 0.15 && ratio < 1.9, `folded or collapsed triangle: ratio ${ratio}, pose ${JSON.stringify(pose)}`);
        }
      }
    }
  }
});

test('joint influence boundaries remain continuous with matching first derivatives', () => {
  const xJoints = [108, 133, 146, 151, 210, 218, 246, 273];
  const yJoints = [145, 160, 184, 185, 208, 210, 245, 260, 307, 313, 321, 328, 333, 340, 355, 360, 370, 375];
  const epsilon = 0.001;
  for (const sign of [-1, 1]) {
    const pose = { ...neutral, headTurn: sign * 0.1, headBob: sign * 2, flipper: sign * 0.16, step: sign, breath: 1 };
    const checkDerivative = (x, y, axis) => {
      const point = deform(x, y, pose);
      const before = deform(x - (axis === 'x' ? epsilon : 0), y - (axis === 'y' ? epsilon : 0), pose);
      const after = deform(x + (axis === 'x' ? epsilon : 0), y + (axis === 'y' ? epsilon : 0), pose);
      for (const component of ['x', 'y']) {
        const left = (point[component] - before[component]) / epsilon;
        const right = (after[component] - point[component]) / epsilon;
        close(left, right, 0.005);
      }
    };
    for (const x of xJoints) for (const y of [18, 93.5, ...yJoints, 399]) checkDerivative(x, y, 'x');
    for (const y of yJoints) for (const x of [68, ...xJoints, 340]) checkDerivative(x, y, 'y');
  }
});

test('head and eye move together while flippers and feet preserve the eye anchor', () => {
  const eye = { x: 161.6, y: 93.5 };
  for (const headTurn of [-0.1, 0.1]) for (const headBob of [-2, 2]) {
    const pose = { ...neutral, headTurn, headBob, breath: 1, flipper: 0.16, step: 1 };
    const actual = deform(eye.x, eye.y, pose);
    const dx = eye.x - 207, dy = eye.y - 178;
    close(actual.x, 207 + dx * Math.cos(headTurn) - dy * Math.sin(headTurn));
    close(actual.y, 178 + dx * Math.sin(headTurn) + dy * Math.cos(headTurn) + headBob * 4 - 2);
    assert.deepEqual(actual, deform(eye.x, eye.y, { ...pose, flipper: 0, step: 0 }));
  }
});

test('stepping alternates the feet without translating the torso, head, or opposite silhouette', () => {
  for (const step of [-1, 1]) {
    const pose = { ...neutral, step };
    for (const point of [{ x: 161.6, y: 93.5 }, { x: 207, y: 178 }, { x: 197, y: 270 }, { x: 300, y: 370 }]) {
      assert.deepEqual(deform(point.x, point.y, pose), point);
    }
    const rear = deform(119, 370, pose);
    const front = deform(180, 370, pose);
    assert.ok(distance(rear, { x: 119, y: 370 }) > 2);
    assert.ok(distance(front, { x: 180, y: 370 }) > 2);
    if (step > 0) {
      close(rear.y, 370);
      close(front.y, 365);
    } else {
      close(rear.y, 365);
      close(front.y, 370);
    }
  }
});

function recordingContext() {
  let matrix = [1, 0, 0, 1, 0, 0];
  const stack = [], draws = [];
  const context = {
    draws,
    setTransform: (...values) => { matrix = values; },
    transform(a, b, c, d, e, f) {
      const [aa, bb, cc, dd, ee, ff] = matrix;
      matrix = [aa * a + cc * b, bb * a + dd * b, aa * c + cc * d, bb * c + dd * d, aa * e + cc * f + ee, bb * e + dd * f + ff];
    },
    translate(x, y) { this.transform(1, 0, 0, 1, x, y); },
    rotate(angle) { this.transform(Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0); },
    scale(x, y) { this.transform(x, 0, 0, y, 0, 0); },
    save() { stack.push([...matrix]); },
    restore() { matrix = stack.pop(); },
    drawImage(image, ...coordinates) { draws.push({ image, coordinates, matrix: [...matrix] }); },
    createRadialGradient: () => ({ addColorStop() {} }),
    clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, clip() {}, arc() {}, fill() {},
  };
  return context;
}

function withRenderer(run) {
  const originalDocument = globalThis.document;
  globalThis.document = { createElement: () => ({ getContext: () => null }) };
  try {
    const context = recordingContext();
    const canvas = { getContext: () => context };
    const art = { body: { original: 'body' }, eye: { original: 'eye' } };
    const renderer = createPenguinIllustrationRenderer(canvas, art);
    renderer.resize(128, 112, 2);
    run(renderer, context, art);
    renderer.dispose();
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
}

test('neutral renderer uses original image pixels with uniform UV mapping across all triangles', () => {
  withRenderer((renderer, context, art) => {
    renderer.render(neutral);
    const bodyDraws = context.draws.filter(draw => draw.image === art.body);
    assert.ok(bodyDraws.length > 1_000);
    const expected = [2 * 90 / 370, 0, 0, 2 * 90 / 370, 2 * (64 - 200 * 90 / 370), 2 * (103 - 395 * 90 / 370)];
    for (const draw of bodyDraws) {
      draw.matrix.forEach((value, index) => close(value, expected[index]));
      const [sx, sy, sw, sh, dx, dy, dw, dh] = draw.coordinates;
      for (const [actual, wanted] of [[sx, dx * 2], [sy, dy * 2], [sw, dw * 2], [sh, dh * 2]]) close(actual, wanted);
    }
    assert.equal(context.draws.filter(draw => draw.image === art.eye).length, 1);
  });
});

test('renderer keeps the authored eye centered on the moving head even while blinking and leaning', () => {
  withRenderer((renderer, context, art) => {
    for (const blink of [0, 0.5, 1]) {
      const pose = { ...neutral, x: 7, y: -2, lean: 0.08, headTurn: -0.1, headBob: 2, flipper: -0.16, breath: 1, step: -1, blink };
      renderer.render(pose);
      const eyeDraw = context.draws.findLast(draw => draw.image === art.eye);
      const point = deform(161.6, 93.5, pose);
      const scale = 90 / 370;
      const x = 64 + pose.x + scale * ((point.x - 200) * Math.cos(pose.lean) - (point.y - 381) * Math.sin(pose.lean));
      const y = 103 + pose.y + scale * (-14 + (point.x - 200) * Math.sin(pose.lean) + (point.y - 381) * Math.cos(pose.lean));
      close(eyeDraw.matrix[4], x * 2);
      close(eyeDraw.matrix[5], y * 2);
      close(Math.hypot(eyeDraw.matrix[0], eyeDraw.matrix[1]), scale * 2);
      close(Math.hypot(eyeDraw.matrix[2], eyeDraw.matrix[3]), scale * 2 * Math.max(0.07, 1 - blink * 0.93));
    }
  });
});
