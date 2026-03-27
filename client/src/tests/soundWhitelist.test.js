import { describe, it, expect } from 'vitest';

const ALLOWED_EXTENSIONS = ['mp3', 'wav'];

function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

function isAllowedAudioFile(filename) {
  const ext = getFileExtension(filename);
  return ALLOWED_EXTENSIONS.includes(ext);
}

function validateAudioUpload(file) {
  if (!file || !file.name) {
    return { valid: false, error: 'Dosya seçilmedi.' };
  }
  const ext = getFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'Sadece MP3 ve WAV dosyaları yüklenebilir.' };
  }
  return { valid: true, error: null };
}

describe('Audio Upload Whitelist - Client-side Utility', () => {
  describe('getFileExtension', () => {
    it('extracts extension from mp3 file', () => {
      expect(getFileExtension('notification.mp3')).toBe('mp3');
    });

    it('extracts extension from wav file', () => {
      expect(getFileExtension('alert.wav')).toBe('wav');
    });

    it('handles uppercase extensions', () => {
      expect(getFileExtension('sound.MP3')).toBe('mp3');
      expect(getFileExtension('sound.WAV')).toBe('wav');
    });

    it('handles filenames with multiple dots', () => {
      expect(getFileExtension('my.sound.file.mp3')).toBe('mp3');
    });
  });

  describe('isAllowedAudioFile', () => {
    it('allows .mp3 files', () => {
      expect(isAllowedAudioFile('ding.mp3')).toBe(true);
    });

    it('allows .wav files', () => {
      expect(isAllowedAudioFile('chime.wav')).toBe(true);
    });

    it('rejects .ogg files', () => {
      expect(isAllowedAudioFile('sound.ogg')).toBe(false);
    });

    it('rejects .flac files', () => {
      expect(isAllowedAudioFile('music.flac')).toBe(false);
    });

    it('rejects .aac files', () => {
      expect(isAllowedAudioFile('track.aac')).toBe(false);
    });

    it('rejects .m4a files', () => {
      expect(isAllowedAudioFile('audio.m4a')).toBe(false);
    });

    it('rejects .wma files', () => {
      expect(isAllowedAudioFile('song.wma')).toBe(false);
    });

    it('rejects files with no extension', () => {
      expect(isAllowedAudioFile('noextension')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isAllowedAudioFile('')).toBe(false);
    });
  });

  describe('validateAudioUpload', () => {
    it('returns valid for mp3 file object', () => {
      const result = validateAudioUpload({ name: 'notification.mp3' });
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('returns valid for wav file object', () => {
      const result = validateAudioUpload({ name: 'alert.wav' });
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('returns invalid with error for ogg file', () => {
      const result = validateAudioUpload({ name: 'sound.ogg' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Sadece MP3 ve WAV dosyaları yüklenebilir.');
    });

    it('returns invalid with error for flac file', () => {
      const result = validateAudioUpload({ name: 'music.flac' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Sadece MP3 ve WAV dosyaları yüklenebilir.');
    });

    it('returns invalid when no file provided', () => {
      const result = validateAudioUpload(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Dosya seçilmedi.');
    });

    it('returns invalid when file has no name', () => {
      const result = validateAudioUpload({});
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Dosya seçilmedi.');
    });

    it('returns invalid for undefined', () => {
      const result = validateAudioUpload(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Dosya seçilmedi.');
    });

    it('rejects exe disguised as audio', () => {
      const result = validateAudioUpload({ name: 'malware.exe.mp3.exe' });
      expect(result.valid).toBe(false);
    });

    it('handles case-insensitive extensions', () => {
      expect(validateAudioUpload({ name: 'SONG.MP3' }).valid).toBe(true);
      expect(validateAudioUpload({ name: 'SONG.WAV' }).valid).toBe(true);
    });
  });

  describe('ALLOWED_EXTENSIONS constant', () => {
    it('contains only mp3 and wav', () => {
      expect(ALLOWED_EXTENSIONS).toEqual(['mp3', 'wav']);
      expect(ALLOWED_EXTENSIONS).toHaveLength(2);
    });
  });
});
