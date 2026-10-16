import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Run the actual TypeScript modules with a deterministic, in-memory Supabase boundary.
// No credentials, network requests, or real account records are used by these tests.
async function moduleUrl(path, imports = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  let output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
  }).outputText;
  for (const [specifier, replacement] of Object.entries(imports)) {
    output = output.replaceAll(`'${specifier}'`, `'${replacement}'`);
  }
  return `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
}

const fake = {
  userId: null,
  rows: {},
  error: null,
  calls: [],
  auth: {
    async getSession() {
      return { data: { session: fake.userId ? { user: { id: fake.userId } } : null }, error: null };
    },
  },
  from(table) {
    const call = { table, operation: null, filters: [], payload: null };
    fake.calls.push(call);
    const query = {
      select() { call.operation = 'select'; return query; },
      upsert(payload) { call.operation = 'upsert'; call.payload = payload; return query; },
      delete() { call.operation = 'delete'; return query; },
      eq(field, value) { call.filters.push([field, value]); return query; },
      order() { return query; },
      then(resolve, reject) {
        return Promise.resolve({ data: fake.rows[table] ?? [], error: fake.error }).then(resolve, reject);
      },
    };
    return query;
  },
};
globalThis.__horizonTestClient = fake;
const clientUrl = `data:text/javascript,${encodeURIComponent('export const supabase = globalThis.__horizonTestClient; export const isSupabaseConfigured = true;')}`;
const db = await import(await moduleUrl('../src/services/db.ts', { '../lib/supabase': clientUrl }));
const storage = await import(await moduleUrl('../src/utils/storage.ts'));
const datesUrl = await moduleUrl('../src/utils/dates.ts');
const quarters = await import(await moduleUrl('../src/utils/quarters.ts', { './dates': datesUrl }));
const capacitorUrl = `data:text/javascript,${encodeURIComponent(`export const Capacitor = { isNativePlatform: () => globalThis.__horizonNative === true };`)}`;
const authRedirect = await import(await moduleUrl('../src/utils/authRedirect.ts', { '@capacitor/core': capacitorUrl }));

const theme = {
  id: 'test-wrapper', name: 'A project', description: '', color: 'teal', icon: 'Target',
  targetGoals2027: [], priority: 'media', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};
const entry = {
  id: 'test-entry', title: 'A reflection', content: 'Private text', summary: '', themeId: theme.id,
  date: '2026-01-01', tags: [], createdAt: theme.createdAt, updatedAt: theme.updatedAt,
};
const draft = {
  title: 'Unsaved reflection', themeId: theme.id, date: entry.date, summary: '',
  content: 'Account A only', tagsInput: '', savedAt: theme.createdAt,
};

beforeEach(() => {
  globalThis.__horizonNative = false;
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: { origin: 'https://horizon.example', pathname: '/' } },
  });
  const values = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: key => values.delete(key),
      clear: () => values.clear(),
      get length() { return values.size; },
    },
  });
  fake.userId = null;
  fake.rows = {};
  fake.error = null;
  fake.calls = [];
});

test('native auth emails return to Horizon instead of a localhost address', () => {
  globalThis.__horizonNative = true;
  assert.equal(authRedirect.getAuthRedirectUrl('signup'), 'horizon://auth/callback?flow=signup');
  assert.equal(authRedirect.getAuthRedirectUrl('recovery'), 'horizon://auth/callback?flow=recovery');
});

test('auth callbacks distinguish recovery from signup and reject unrelated routes', () => {
  const recovery = authRedirect.parseAuthCallbackUrl('horizon://auth/callback?flow=recovery#access_token=access&refresh_token=refresh&type=recovery');
  assert.equal(recovery.flow, 'recovery');
  assert.equal(recovery.accessToken, 'access');
  assert.equal(recovery.refreshToken, 'refresh');
  assert.equal(authRedirect.isRecoveryCallback(recovery), true);

  const signup = authRedirect.parseAuthCallbackUrl('https://horizon.example/?auth=callback&flow=signup&token_hash=hash&type=signup');
  assert.equal(signup.flow, 'signup');
  assert.equal(signup.tokenHash, 'hash');
  assert.equal(signup.otpType, 'signup');
  assert.equal(authRedirect.isRecoveryCallback(signup), false);
  assert.equal(authRedirect.parseAuthCallbackUrl('https://horizon.example/#/dashboard'), null);
});

test('signed-out reads return no private or legacy content and never query the database', async () => {
  localStorage.setItem('clay_2027_themes_v1', JSON.stringify([theme]));
  localStorage.setItem('clay_2027_blog_v1', JSON.stringify([entry]));
  assert.deepEqual(await db.getThemes(), []);
  assert.deepEqual(await db.getBlogEntries(), []);
  assert.equal(fake.calls.length, 0);
});

test('a newly authenticated empty account stays empty even when this device has legacy data', async () => {
  fake.userId = 'account-b';
  localStorage.setItem('clay_2027_themes_v1', JSON.stringify([theme]));
  localStorage.setItem('clay_2027_blog_v1', JSON.stringify([entry]));
  assert.deepEqual(await db.getThemes('account-b'), []);
  assert.deepEqual(await db.getBlogEntries('account-b'), []);
  assert.equal(fake.calls.length, 2);
  for (const call of fake.calls) {
    assert.equal(call.operation, 'select');
    assert.deepEqual(call.filters, [['user_id', 'account-b']]);
  }
});

test('failed cloud reads reject instead of falling back to another account or sample data', async () => {
  fake.userId = 'account-b';
  fake.error = new Error('Network unavailable');
  localStorage.setItem('clay_2027_themes_v1', JSON.stringify([theme]));
  await assert.rejects(db.getThemes('account-b'), /Network unavailable/);
  await assert.rejects(db.getBlogEntries('account-b'), /Network unavailable/);
});

test('signed-out and stale-account reads and mutations are rejected before any query', async () => {
  await assert.rejects(db.saveThemeItem(theme, 'account-a'), /sesión ha cambiado/);
  fake.userId = 'account-b';
  await assert.rejects(db.getThemes('account-a'), /sesión ha cambiado/);
  await assert.rejects(db.getBlogEntries('account-a'), /sesión ha cambiado/);
  await assert.rejects(db.saveThemeItem(theme, 'account-a'), /sesión ha cambiado/);
  await assert.rejects(db.saveBlogEntryItem(entry, 'account-a'), /sesión ha cambiado/);
  await assert.rejects(db.deleteThemeItem(theme.id, 'account-a'), /sesión ha cambiado/);
  await assert.rejects(db.deleteBlogEntryItem(entry.id, 'account-a'), /sesión ha cambiado/);
  assert.equal(fake.calls.length, 0);
});

test('successful reads do not create a shared private-data cache', async () => {
  fake.userId = 'account-a';
  fake.rows.big_themes = [{ id: theme.id, user_id: 'account-a', name: theme.name, color: theme.color }];
  const loaded = await db.getThemes('account-a');
  assert.equal(loaded[0].name, theme.name);
  assert.equal(localStorage.length, 0);
});

test('failed writes reject instead of pretending success or overwriting a draft', async () => {
  fake.userId = 'account-a';
  storage.saveBlogDraft(draft, 'account-a');
  fake.error = new Error('Write failed');
  await assert.rejects(db.saveThemeItem(theme, 'account-a'), /Write failed/);
  await assert.rejects(db.saveBlogEntryItem(entry, 'account-a'), /Write failed/);
  await assert.rejects(db.deleteThemeItem(theme.id, 'account-a'), /Write failed/);
  await assert.rejects(db.deleteBlogEntryItem(entry.id, 'account-a'), /Write failed/);
  assert.deepEqual(storage.loadBlogDraft('account-a'), draft);
});

test('mutations carry the authenticated owner and deletion filters both record and owner', async () => {
  fake.userId = 'account-a';
  await db.saveThemeItem(theme, 'account-a');
  await db.saveBlogEntryItem(entry, 'account-a');
  await db.deleteThemeItem(theme.id, 'account-a');
  await db.deleteBlogEntryItem(entry.id, 'account-a');
  assert.equal(fake.calls[0].payload.user_id, 'account-a');
  assert.equal(fake.calls[1].payload.user_id, 'account-a');
  assert.deepEqual(fake.calls[2].filters, [['id', theme.id], ['user_id', 'account-a']]);
  assert.deepEqual(fake.calls[3].filters, [['id', entry.id], ['user_id', 'account-a']]);
});

test('drafts are isolated by explicit owner and legacy anonymous drafts are ignored', () => {
  localStorage.setItem('clay_2027_blog_draft_v1', JSON.stringify(draft));
  assert.equal(storage.loadBlogDraft('account-a'), null);
  assert.equal(storage.loadBlogDraft(''), null);
  storage.saveBlogDraft(draft, 'account-a');
  assert.deepEqual(storage.loadBlogDraft('account-a'), draft);
  assert.equal(storage.loadBlogDraft('account-b'), null);
  storage.clearBlogDraft('account-b');
  assert.deepEqual(storage.loadBlogDraft('account-a'), draft);
  storage.clearBlogDraft('account-a');
  assert.equal(storage.loadBlogDraft('account-a'), null);
  // Legacy content is left untouched for recovery; it is not silently reassigned or destroyed.
  assert.equal(localStorage.getItem('clay_2027_blog_draft_v1'), JSON.stringify(draft));
});

test('unsaved edits are isolated by account and entry', () => {
  const editA = { ...draft, title: 'Changes to entry A' };
  const editB = { ...draft, title: 'Changes to entry B' };
  storage.saveBlogDraft(editA, 'account-a', 'entry-a');
  storage.saveBlogDraft(editB, 'account-a', 'entry-b');
  assert.deepEqual(storage.loadBlogDraft('account-a', 'entry-a'), editA);
  assert.deepEqual(storage.loadBlogDraft('account-a', 'entry-b'), editB);
  assert.equal(storage.loadBlogDraft('account-b', 'entry-a'), null);
  assert.equal(storage.loadBlogDraft('account-a'), null);
  storage.clearBlogDraft('account-a', 'entry-a');
  assert.equal(storage.loadBlogDraft('account-a', 'entry-a'), null);
  assert.deepEqual(storage.loadBlogDraft('account-a', 'entry-b'), editB);
});

test('malformed drafts are ignored and unavailable device storage reports an unsaved draft', () => {
  localStorage.setItem('horizon:account-a:blog-draft:v2', '{bad json');
  assert.equal(storage.loadBlogDraft('account-a'), null);
  localStorage.setItem('horizon:account-a:blog-draft:v2', '{"title":42}');
  assert.equal(storage.loadBlogDraft('account-a'), null);
  localStorage.setItem = () => { throw new Error('Storage full'); };
  assert.throws(() => storage.saveBlogDraft(draft, 'account-a'), /Storage full/);
});

test('cycle start dates are account scoped and never inherit the legacy device preference', () => {
  localStorage.setItem('clay_2027_app_start_date', '2001-02-03');
  quarters.saveAppStartDate('2026-01-05', 'account-a');
  quarters.saveAppStartDate('2026-08-17', 'account-b');
  assert.equal(quarters.getAppStartDate('account-a'), '2026-01-05');
  assert.equal(quarters.getAppStartDate('account-b'), '2026-08-17');
  assert.notEqual(quarters.getAppStartDate('account-c'), '2001-02-03');
  assert.notEqual(quarters.getAppStartDate(), '2001-02-03');
});
