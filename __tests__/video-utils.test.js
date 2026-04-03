import { describe, it, expect } from 'vitest';
import { toEmbedUrl, detectPlatform, isEmbeddable } from '@/lib/video-utils';

describe('detectPlatform', () => {
    it('should detect YouTube URLs', () => {
        expect(detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
        expect(detectPlatform('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
        expect(detectPlatform('https://youtube.com/shorts/abc123')).toBe('youtube');
    });

    it('should detect Instagram URLs', () => {
        expect(detectPlatform('https://www.instagram.com/reel/abc123/')).toBe('instagram');
        expect(detectPlatform('https://instagram.com/p/abc123/')).toBe('instagram');
    });

    it('should detect TikTok URLs', () => {
        expect(detectPlatform('https://www.tiktok.com/@user/video/123')).toBe('tiktok');
    });

    it('should detect Facebook URLs', () => {
        expect(detectPlatform('https://www.facebook.com/watch/?v=123')).toBe('facebook');
        expect(detectPlatform('https://fb.watch/abc123/')).toBe('facebook');
    });

    it('should detect Vimeo URLs', () => {
        expect(detectPlatform('https://vimeo.com/123456789')).toBe('vimeo');
    });

    it('should return manual for unknown URLs', () => {
        expect(detectPlatform('https://example.com/video.mp4')).toBe('manual');
        expect(detectPlatform('')).toBe('manual');
    });
});

describe('toEmbedUrl', () => {
    it('should convert YouTube watch URL to embed', () => {
        const result = toEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(result).toContain('youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should convert YouTube short URL to embed', () => {
        const result = toEmbedUrl('https://youtu.be/dQw4w9WgXcQ');
        expect(result).toContain('youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should convert Vimeo URL to embed', () => {
        const result = toEmbedUrl('https://vimeo.com/123456789');
        expect(result).toContain('player.vimeo.com/video/123456789');
    });

    it('should return null for non-embeddable platforms', () => {
        expect(toEmbedUrl('https://www.tiktok.com/@user/video/123')).toBeNull();
        expect(toEmbedUrl('https://www.instagram.com/reel/abc/')).toBeNull();
    });
});

describe('isEmbeddable', () => {
    it('should return true for YouTube and Vimeo', () => {
        expect(isEmbeddable('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
        expect(isEmbeddable('https://vimeo.com/123456789')).toBe(true);
    });

    it('should return false for TikTok and Instagram', () => {
        expect(isEmbeddable('https://www.tiktok.com/@user/video/123')).toBe(false);
        expect(isEmbeddable('https://www.instagram.com/reel/abc/')).toBe(false);
    });
});
