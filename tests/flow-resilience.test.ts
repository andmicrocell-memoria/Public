import test from 'node:test';
import assert from 'node:assert/strict';
import { createFallbackReply, sanitizeReplyText } from '../src/flow-resilience.js';

test('sanitizeReplyText returns fallback when reply is empty', () => {
  const fallback = 'Olá! Estou temporariamente indisponível, mas em breve retorno.';
  assert.equal(sanitizeReplyText('', fallback), fallback);
  assert.equal(sanitizeReplyText('   ', fallback), fallback);
});

test('createFallbackReply uses customer name and business config', () => {
  const reply = createFallbackReply({ name: 'AndMicrocell' }, 'Maria', 'Olá');
  assert.match(reply, /Maria/);
  assert.match(reply, /AndMicrocell/);
});
