export function normalizeAudioBase64(audioBase64: string): string {
  if (!audioBase64) return '';

  const withoutPrefix = audioBase64.replace(/^data:audio\/[a-zA-Z0-9.-]+(?:;[a-zA-Z0-9.-=]+)*;base64,/, '');
  return withoutPrefix.replace(/^data:audio\/[a-zA-Z0-9.-]+;base64,/, '');
}

export function normalizeMimeType(mimeType?: string): string {
  if (!mimeType) return 'audio/webm';

  const normalized = mimeType.split(';')[0].trim().toLowerCase();

  if (normalized === 'audio/opus' || normalized === 'audio/oga' || normalized === 'application/ogg' || normalized === 'video/ogg') {
    return 'audio/ogg';
  }

  if (normalized === 'audio/x-m4a' || normalized === 'audio/m4a') {
    return 'audio/mp4';
  }

  if (normalized === 'audio/mpeg') {
    return 'audio/mp3';
  }

  if (normalized.startsWith('audio/')) {
    return normalized;
  }

  return 'audio/webm';
}
