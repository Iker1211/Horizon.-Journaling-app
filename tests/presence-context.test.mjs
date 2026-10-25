import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/utils/companionPresence.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText;
const { createPresenceController, presenceSurfaceForTab } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const fixture = (surface = 'home', sequence = 0) => {
  let time = 0;
  return { controller: createPresenceController(surface, () => time, sequence), at: value => { time = value; } };
};

test('a welcome expires and ordinary navigation never triggers another', () => {
  const { controller: c, at } = fixture();
  assert.equal(c.getSnapshot().cue, 'welcome');
  at(2600); c.tick();
  assert.equal(c.getSnapshot().cue, 'available');
  for (const surface of ['other', 'reading', 'home']) {
    c.transition(surface);
    assert.equal(c.getSnapshot().cue, 'available');
  }
});

test('local drafts, pending operations and failures never create a confirmation', () => {
  const { controller: c } = fixture('writing');
  for (const [saving, error, cue] of [[false, false, 'focus'], [true, false, 'saving'], [true, true, 'error'], [false, true, 'error'], [false, false, 'focus']]) {
    c.editorState(saving, error);
    assert.equal(c.getSnapshot().cue, cue);
    assert.equal(c.getSnapshot().confirmation, 0);
  }
  c.resetEditor(); c.transition('home');
  assert.equal(c.getSnapshot().cue, 'available');
  assert.equal(c.getSnapshot().confirmation, 0);
});

test('navigation and successful save are published atomically after the editor cleanup', () => {
  const { controller: c, at } = fixture('writing');
  c.editorState(true, false);
  c.resetEditor(); // React unmounts the editor before the parent route effect.
  const seen = [];
  const unsubscribe = c.subscribe(() => seen.push(c.getSnapshot()));
  at(1000); c.transition('reading', 1);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].cue, 'saved');
  assert.equal(seen[0].surface, 'reading');
  assert.equal(seen[0].confirmation, 1);
  unsubscribe();
});

test('duplicate render/route effects neither repeat nor extend a confirmed acknowledgement', () => {
  const { controller: c, at } = fixture('writing');
  c.transition('reading', 1);
  const first = c.getSnapshot();
  at(2000); c.transition('reading', 1); c.resetEditor();
  assert.equal(c.getSnapshot(), first);
  at(4200); c.tick();
  assert.equal(c.getSnapshot().cue, 'available');
  assert.equal(c.getSnapshot().confirmation, 1);
});

test('an already observed counter on remount is context, not a new success event', () => {
  const { controller: c } = fixture('reading', 8);
  assert.equal(c.getSnapshot().cue, 'available');
  c.transition('reading', 8);
  assert.equal(c.getSnapshot().cue, 'available');
  c.transition('reading', 9);
  assert.equal(c.getSnapshot().cue, 'saved');
});

test('writing and errors outrank a previous successful save without restarting its deadline', () => {
  const { controller: c, at } = fixture('reading');
  c.transition('reading', 1);
  c.transition('writing');
  assert.equal(c.getSnapshot().cue, 'focus');
  c.editorState(false, true);
  assert.equal(c.getSnapshot().cue, 'error');
  at(5000); c.tick(); c.resetEditor(); c.transition('reading');
  assert.equal(c.getSnapshot().cue, 'available');
  assert.equal(c.getSnapshot().confirmation, 1);
});

test('repeated nonsemantic editor updates keep the snapshot reference stable', () => {
  const { controller: c } = fixture('writing');
  const first = c.getSnapshot();
  let notifications = 0;
  c.subscribe(() => notifications++);
  for (let index = 0; index < 100; index++) c.editorState(false, false);
  assert.equal(c.getSnapshot(), first);
  assert.equal(notifications, 0);
});

test('surface signals disclose navigation purpose only, never journal or account data', () => {
  assert.equal(presenceSurfaceForTab('dashboard'), 'home');
  assert.equal(presenceSurfaceForTab('editor'), 'writing');
  assert.equal(presenceSurfaceForTab('entry'), 'reading');
  assert.equal(presenceSurfaceForTab('profile'), 'other');
  const { controller: c } = fixture();
  assert.deepEqual(Object.keys(c.getSnapshot()).sort(), ['confirmation', 'cue', 'expiresAt', 'surface']);
});
