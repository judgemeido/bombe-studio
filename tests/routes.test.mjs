import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, routeKey } from '../src/routes.js';

test('default/history and whitelisted local anchors stay in history', () => {
  for (const hash of ['', '#/history', '#lifeline', '#intercept', '#pioneers', '#turing', '#constraints', '#intelligence', '#onward', '#lifeline-context', '#sources']) {
    assert.deepEqual(parseRoute(hash), { page: 'history', topic: 'drums' }, hash);
    assert.equal(routeKey(parseRoute(hash)), '#/history');
  }
});
test('legacy interactive deep links round trip without becoming default history', () => {
  for (const [hash, page, topic] of [['#/', 'exhibit', 'drums'], ['#/lab/drums', 'lab', 'drums'], ['#/lab/wiring', 'lab', 'wiring'], ['#/challenge', 'challenge', 'drums']]) {
    assert.deepEqual(parseRoute(hash), { page, topic });
    assert.equal(routeKey(parseRoute(hash)), hash);
  }
});
test('unknown fragments cannot masquerade as historical anchors or lab routes', () => {
  for (const hash of ['#unknown', '#hero-title', '#/history/nope', '#/laboratory', '#/lab/nope', '#turing-extra']) assert.equal(parseRoute(hash).page, 'exhibit');
  assert.equal(routeKey({ page: 'lab' }), '#/lab/drums');
});
