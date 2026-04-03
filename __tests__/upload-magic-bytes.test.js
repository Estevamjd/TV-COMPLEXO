import { describe, it, expect } from 'vitest';

// Importar a função de detecção inline (reproduzir lógica pois é exportada do route)
const MAGIC_BYTES = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/gif': [
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
    ],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

function detectFileType(buffer) {
    const bytes = new Uint8Array(buffer);
    for (const [mimeType, signatures] of Object.entries(MAGIC_BYTES)) {
        for (const signature of signatures) {
            if (signature.every((byte, i) => bytes[i] === byte)) {
                if (mimeType === 'image/webp') {
                    if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
                        return mimeType;
                    }
                    continue;
                }
                return mimeType;
            }
        }
    }
    return null;
}

describe('Magic Bytes Detection', () => {
    it('should detect JPEG files', () => {
        const buffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]).buffer;
        expect(detectFileType(buffer)).toBe('image/jpeg');
    });

    it('should detect PNG files', () => {
        const buffer = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00]).buffer;
        expect(detectFileType(buffer)).toBe('image/png');
    });

    it('should detect GIF87a files', () => {
        const buffer = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x00]).buffer;
        expect(detectFileType(buffer)).toBe('image/gif');
    });

    it('should detect GIF89a files', () => {
        const buffer = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00]).buffer;
        expect(detectFileType(buffer)).toBe('image/gif');
    });

    it('should detect WebP files', () => {
        // RIFF....WEBP
        const buffer = new Uint8Array([
            0x52, 0x49, 0x46, 0x46, // RIFF
            0x00, 0x00, 0x00, 0x00, // size
            0x57, 0x45, 0x42, 0x50, // WEBP
        ]).buffer;
        expect(detectFileType(buffer)).toBe('image/webp');
    });

    it('should reject RIFF files that are not WebP (e.g., AVI)', () => {
        const buffer = new Uint8Array([
            0x52, 0x49, 0x46, 0x46, // RIFF
            0x00, 0x00, 0x00, 0x00, // size
            0x41, 0x56, 0x49, 0x20, // AVI (not WEBP)
        ]).buffer;
        expect(detectFileType(buffer)).toBeNull();
    });

    it('should reject unknown file types', () => {
        const buffer = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]).buffer;
        expect(detectFileType(buffer)).toBeNull();
    });

    it('should reject executable files disguised as images', () => {
        // MZ header (Windows executable)
        const buffer = new Uint8Array([0x4D, 0x5A, 0x90, 0x00]).buffer;
        expect(detectFileType(buffer)).toBeNull();
    });

    it('should reject PDF files', () => {
        // %PDF header
        const buffer = new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer;
        expect(detectFileType(buffer)).toBeNull();
    });
});
