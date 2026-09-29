import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COUNTERS, HISTORY_LIMIT, MAX_COUNT, counterValue, initialSession, restoreSession, totalMana, transition } from './state.ts';

test('mana, storm, and lands played are independent counters', () => {
  let session = initialSession();
  for (const [index, counter] of COUNTERS.entries()) {
    session = transition(session, { type: 'set', counter, value: index + 1 });
  }
  assert.equal(totalMana(session.current), 21);
  assert.equal(session.current.storm, 7);
  assert.equal(session.current.lands, 8);
  session = transition(session, { type: 'adjust', counter: 'lands', delta: 1 });
  assert.equal(session.current.lands, 9);
  assert.equal(session.current.storm, 7);
  assert.equal(totalMana(session.current), 21);
});

test('repeated adjustments preserve every action without mutating earlier state', () => {
  const original = initialSession();
  let session = original;
  for (let i = 0; i < 80; i++) session = transition(session, { type: 'adjust', counter: 'R', delta: 1 });
  for (let i = 0; i < 17; i++) session = transition(session, { type: 'adjust', counter: 'R', delta: -1 });
  assert.equal(session.current.mana.R, 63);
  assert.equal(original.current.mana.R, 0);
  assert.equal(session.history.length, 97);
});

test('invalid amounts and no-op actions do not consume undo history', () => {
  const session = initialSession();
  for (const counter of COUNTERS) {
    for (const value of [-1, NaN, Infinity, 1.5, MAX_COUNT + 1]) {
      assert.equal(transition(session, { type: 'set', counter, value }), session);
    }
    assert.equal(transition(session, { type: 'adjust', counter, delta: -1 }), session);
    assert.equal(transition(session, { type: 'set', counter, value: 0 }), session);
  }
  assert.equal(transition(session, { type: 'clear-mana' }), session);
  assert.equal(transition(session, { type: 'undo' }), session);
  const maximum = transition(session, { type: 'set', counter: 'W', value: MAX_COUNT });
  assert.equal(transition(maximum, { type: 'adjust', counter: 'W', delta: 1 }), maximum);
});

test('clear mana leaves turn counters intact and undo restores the whole pool', () => {
  let session = initialSession();
  for (const counter of COUNTERS) session = transition(session, { type: 'set', counter, value: 4 });
  const before = session.current;
  session = transition(session, { type: 'clear-mana' });
  assert.equal(totalMana(session.current), 0);
  assert.equal(session.current.storm, 4);
  assert.equal(session.current.lands, 4);
  assert.deepEqual(transition(session, { type: 'undo' }).current, before);
});

test('new turn resets all counters and undo restores both counters and turn', () => {
  let session = initialSession();
  for (const counter of COUNTERS) session = transition(session, { type: 'set', counter, value: 5 });
  const before = session.current;
  session = transition(session, { type: 'new-turn' });
  assert.equal(session.current.turn, 2);
  for (const counter of COUNTERS) assert.equal(counterValue(session.current, counter), 0);
  assert.deepEqual(transition(session, { type: 'undo' }).current, before);
});

test('new game returns to turn one and can be undone', () => {
  let session = transition(initialSession(), { type: 'new-turn' });
  session = transition(session, { type: 'set', counter: 'storm', value: 20 });
  const reset = transition(session, { type: 'new-game' });
  assert.deepEqual(reset.current, initialSession().current);
  assert.deepEqual(transition(reset, { type: 'undo' }).current, session.current);
});

test('restored sessions retain undo, with bounded history', () => {
  let session = initialSession();
  for (let i = 0; i < HISTORY_LIMIT + 20; i++) session = transition(session, { type: 'adjust', counter: 'G', delta: 1 });
  session = restoreSession(JSON.stringify(session));
  assert.equal(session.history.length, HISTORY_LIMIT);
  for (let i = 0; i < HISTORY_LIMIT; i++) session = transition(session, { type: 'undo' });
  assert.equal(session.current.mana.G, 20);
  assert.equal(session.history.length, 0);
});

test('missing, corrupted, and unknown saved data recover safely', () => {
  const baseline = initialSession();
  for (const raw of [null, 'null', '{bad', '[]', '{}', JSON.stringify({ ...baseline, version: 7 }), JSON.stringify({ ...baseline, current: { ...baseline.current, mana: {} } }), JSON.stringify({ ...baseline, current: { ...baseline.current, lands: -1 } })]) {
    assert.deepEqual(restoreSession(raw), baseline);
  }
  assert.deepEqual(restoreSession(JSON.stringify({ ...baseline, history: [null, { turn: 2 }, baseline.current] })).history, [baseline.current]);
});
