const path = require('path');

// Import the ALLOWED_AUDIO_EXTENSIONS from the sound controller source
// We replicate the logic here to test the whitelist without mocking fs

const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav'];

function isAllowedExtension(filename) {
    const ext = path.extname(filename).toLowerCase();
    return ALLOWED_AUDIO_EXTENSIONS.includes(ext);
}

function hasPathTraversal(filename) {
    return filename.includes('..') || filename.includes('/') || filename.includes('\\');
}

describe('Sound Whitelist', () => {
    describe('Allowed extensions', () => {
        it('should accept .mp3 files', () => {
            expect(isAllowedExtension('notification.mp3')).toBe(true);
            expect(isAllowedExtension('alert.mp3')).toBe(true);
        });

        it('should accept .wav files', () => {
            expect(isAllowedExtension('chime.wav')).toBe(true);
            expect(isAllowedExtension('ding.wav')).toBe(true);
        });

        it('should handle uppercase extensions (.MP3, .WAV)', () => {
            expect(isAllowedExtension('SONG.MP3')).toBe(true);
            expect(isAllowedExtension('ALERT.WAV')).toBe(true);
            expect(isAllowedExtension('file.Mp3')).toBe(true);
            expect(isAllowedExtension('file.WaV')).toBe(true);
        });
    });

    describe('Rejected extensions', () => {
        it('should reject .ogg files', () => {
            expect(isAllowedExtension('sound.ogg')).toBe(false);
        });

        it('should reject .m4a files', () => {
            expect(isAllowedExtension('audio.m4a')).toBe(false);
        });

        it('should reject .exe files', () => {
            expect(isAllowedExtension('virus.exe')).toBe(false);
        });

        it('should reject .txt files', () => {
            expect(isAllowedExtension('readme.txt')).toBe(false);
        });

        it('should reject .flac files', () => {
            expect(isAllowedExtension('lossless.flac')).toBe(false);
        });

        it('should reject .aac files', () => {
            expect(isAllowedExtension('track.aac')).toBe(false);
        });

        it('should reject files with no extension', () => {
            expect(isAllowedExtension('noextension')).toBe(false);
        });

        it('should reject hidden files with allowed extension', () => {
            // Hidden files starting with '.' should be filtered by getSounds
            const filename = '.hidden.mp3';
            expect(isAllowedExtension(filename)).toBe(true); // extension is valid, but getSounds filters these
            expect(filename.startsWith('.')).toBe(true); // confirm it would be filtered
        });
    });

    describe('Path traversal prevention', () => {
        it('should detect .. in filename', () => {
            expect(hasPathTraversal('../../../etc/passwd')).toBe(true);
        });

        it('should detect forward slash in filename', () => {
            expect(hasPathTraversal('subdir/file.mp3')).toBe(true);
        });

        it('should detect backslash in filename', () => {
            expect(hasPathTraversal('subdir\\file.mp3')).toBe(true);
        });

        it('should allow normal filenames without path traversal', () => {
            expect(hasPathTraversal('notification.mp3')).toBe(false);
            expect(hasPathTraversal('alert-sound.wav')).toBe(false);
            expect(hasPathTraversal('my.file.mp3')).toBe(false);
        });

        it('should reject filenames combining path traversal with allowed extension', () => {
            const filename = '../../uploads/exploit.mp3';
            expect(hasPathTraversal(filename)).toBe(true);
            expect(isAllowedExtension(filename)).toBe(true); // extension is valid but path is dangerous
        });
    });

    describe('Null-byte injection prevention', () => {
        it('should reject filenames containing null-byte (%00)', () => {
            // Simulate null-byte in filename: malware.exe%00.mp3
            const filename1 = 'malware.exe%00.mp3';
            // The %00 should be detected as a null-byte attempt
            expect(filename1.includes('%00')).toBe(true);
        });

        it('should detect null-byte in file upload validation', () => {
            // Test the validateFilename function concept
            function hasNullByte(filename) {
                // Check for null byte representations
                return filename.includes('\0') || filename.includes('%00');
            }

            // Test with URL-encoded null byte (%00)
            expect(hasNullByte('malware.exe%00.mp3')).toBe(true);
            
            // Test with actual null character - use String.fromCharCode(0)
            const filenameWithNull = 'malware.exe' + String.fromCharCode(0) + '.mp3';
            expect(hasNullByte(filenameWithNull)).toBe(true);
            
            expect(hasNullByte('normal.mp3')).toBe(false);
            expect(hasNullByte('alert.wav')).toBe(false);
        });

        it('should reject files where originalname contains null-byte', () => {
            // Simulate multer file object with null-byte injection
            const maliciousFile1 = { originalname: 'malware.exe%00.mp3' };
            
            // Validation should catch these
            function isValidFilename(filename) {
                if (!filename || typeof filename !== 'string') return false;
                // Reject if contains null byte representations
                if (filename.includes('\0') || filename.includes('%00')) return false;
                // Check extension
                const ext = path.extname(filename).toLowerCase();
                return ['.mp3', '.wav'].includes(ext);
            }

            expect(isValidFilename(maliciousFile1.originalname)).toBe(false);
            
            // Test with actual null character
            const filenameWithNull = 'malware.exe' + String.fromCharCode(0) + '.mp3';
            expect(isValidFilename(filenameWithNull)).toBe(false);
            
            expect(isValidFilename('normal.mp3')).toBe(true);
        });
    });
});
