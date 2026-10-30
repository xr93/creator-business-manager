import assert from 'node:assert/strict';
import test from 'node:test';
import { sessionCookieOptions, REMEMBER_SECONDS } from '../utils/supabase/session.ts';

test('unchecked remember removes both expiry options, including on refresh', () => {
  const result = sessionCookieOptions({ maxAge: 400, expires: new Date(), path: '/' }, false);
  assert.equal(result.maxAge, undefined);
  assert.equal(result.expires, undefined);
  assert.equal(result.path, '/');
  assert.equal(result.sameSite, 'lax');
});

test('remembered sessions persist for 30 days', () => {
  assert.equal(sessionCookieOptions({}, true).maxAge, REMEMBER_SECONDS);
});

test('sign-out cookie deletion survives either preference', () => {
  for (const remember of [true, false]) {
    assert.equal(sessionCookieOptions({ maxAge: 0 }, remember).maxAge, 0);
  }
});

test('does not mutate the SDK options', () => {
  const options = { maxAge: 400 };
  sessionCookieOptions(options, false);
  assert.equal(options.maxAge, 400);
});
