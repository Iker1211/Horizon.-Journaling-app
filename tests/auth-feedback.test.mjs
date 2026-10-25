import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/utils/authFeedback.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
}).outputText;
const { describeAuthError, getCodeRequestNotice, isValidEmailCode, normalizeEmailCode } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`,
);

test('accepted email requests explain uncertainty instead of guaranteeing delivery', () => {
  for (const purpose of ['signup', 'signin', 'recovery']) {
    const notice = getCodeRequestNotice(purpose);
    assert.match(notice, /Solicitud recibida/);
    assert.match(notice, /Si /);
    assert.doesNotMatch(notice, /te enviamos|enviado|entregado/i);
  }
  assert.match(getCodeRequestNotice('signup'), /inicia sesión o recupera/);
});

test('the full configured OTP reaches verification without dropping digits or leading zeroes', () => {
  for (const value of ['001234', '00123456', '0012345678']) {
    assert.ok(isValidEmailCode(value));
    assert.equal(normalizeEmailCode(value), value);
  }
  assert.equal(normalizeEmailCode('00 123 456'), '00123456');
  for (const value of ['', '12345', '12345678901', 'ABC123', '123 456']) assert.equal(isValidEmailCode(value), false);
});

test('provider restrictions and quotas identify service failures rather than blaming credentials', () => {
  assert.match(describeAuthError({ code: 'email_address_not_authorized' }), /configuración/);
  assert.match(describeAuthError({ code: 'over_email_send_rate_limit' }), /límite de envíos/);
  assert.match(describeAuthError({ code: 'over_request_rate_limit' }), /Espera/);
  assert.match(describeAuthError(new Error('Error sending confirmation email')), /servicio de correo/);
  assert.match(describeAuthError({ code: 'signup_disabled' }), /creación de cuentas/);
});

test('raw provider diagnostics never expose recipients, tokens or internal configuration', () => {
  const privateDiagnostic = 'recipient@example.invalid token=not-a-real-token smtp://internal.example.invalid';
  for (const code of ['email_address_not_authorized', 'unexpected_failure', 'over_email_send_rate_limit', undefined]) {
    const message = describeAuthError({ code, message: privateDiagnostic });
    for (const value of ['recipient@example.invalid', 'not-a-real-token', 'internal.example.invalid']) assert.ok(!message.includes(value));
  }
  assert.doesNotThrow(() => describeAuthError(null));
  assert.doesNotThrow(() => describeAuthError('unexpected'));
});

test('normal sign-in and expired-code errors keep a useful recovery path', () => {
  assert.match(describeAuthError({ code: 'invalid_credentials' }), /correo o la contraseña/);
  assert.match(describeAuthError({ code: 'otp_expired' }), /solicita uno nuevo/);
  assert.match(describeAuthError(new Error('Failed to fetch')), /conexión/);
});

test('all shipped authentication templates contain the real OTP and no confirmation link', async () => {
  for (const name of ['confirmation', 'magic-link', 'recovery']) {
    const template = await readFile(new URL(`../supabase/templates/${name}.html`, import.meta.url), 'utf8');
    assert.match(template, /{{\s*\.Token\s*}}/);
    assert.doesNotMatch(template, /ConfirmationURL|TokenHash|<a\b|<script\b|<img\b/i);
  }
});
