import test from 'node:test';
import assert from 'node:assert/strict';
import { createExhibitRuntime } from '../src/exhibit-runtime.js';

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
test('runtime is lazy and concurrent ensure calls share one successful initialization', async () => {
  let calls = 0, releases = 0;
  const gate = deferred();
  const runtime = createExhibitRuntime(async ({ own, check }) => {
    calls++; own({ dispose() { releases++; } }); await gate.promise; check(); return { ready: true };
  });
  assert.equal(calls, 0);
  const first = runtime.ensure(); assert.equal(runtime.ensure(), first);
  await Promise.resolve(); assert.equal(calls, 1);
  gate.resolve(); assert.deepEqual(await first, { ready: true });
  assert.equal(runtime.ensure(), first);
  runtime.dispose(); runtime.dispose(); assert.equal(releases, 1);
});
test('failed partial initialization releases resources and can retry', async () => {
  let calls = 0, releases = 0;
  const runtime = createExhibitRuntime(({ own }) => {
    calls++; own({ dispose() { releases++; } });
    if (calls === 1) throw new Error('GPU failed');
    return 'ready';
  });
  await assert.rejects(runtime.ensure(), /GPU failed/); assert.equal(releases, 1);
  assert.equal(await runtime.ensure(), 'ready'); assert.equal(calls, 2);
  runtime.dispose(); assert.equal(releases, 2);
});
test('dispose before queued initialization prevents allocation', async () => {
  let calls = 0;
  const runtime = createExhibitRuntime(() => { calls++; });
  const pending = runtime.ensure(); runtime.dispose();
  await assert.rejects(pending, /disposed/); assert.equal(calls, 0);
  await assert.rejects(runtime.ensure(), /disposed/);
});
test('dispose during initialization cleans partial resources and rejects late allocations', async () => {
  const gate = deferred(); let releases = 0, lateReleases = 0;
  const runtime = createExhibitRuntime(async ({ own, check }) => {
    own({ dispose() { releases++; } }); await gate.promise;
    own({ dispose() { lateReleases++; } }); check();
  });
  const pending = runtime.ensure(); await Promise.resolve(); runtime.dispose();
  assert.equal(releases, 1); gate.resolve();
  await assert.rejects(pending, /disposed/); assert.equal(lateReleases, 1);
});
