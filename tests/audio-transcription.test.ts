import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAudioBase64 } from '../src/audio-transcription.js';

test('normalizeAudioBase64 removes any data URI prefix and preserves base64 payload', () => {
  const payload = 'data:audio/webm;codecs=opus;base64,QUJDREVGRw==';
  assert.equal(normalizeAudioBase64(payload), 'QUJDREVGRw==');
});

test('normalizeAudioBase64 leaves plain base64 unchanged', () => {
  const payload = 'QUJDREVGRw==';
  assert.equal(normalizeAudioBase64(payload), payload);
});
