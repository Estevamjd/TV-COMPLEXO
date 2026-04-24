import { describe, it, expect } from 'vitest';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

function createRequest(ip = '127.0.0.1') {
    const headers = {
        'x-real-ip': ip,
        'x-forwarded-for': ip,
    };
    return {
        headers: {
            get: (key) => headers[key] || null,
        },
    };
}

describe('rateLimit (in-memory fallback)', () => {
    it('should allow requests within the limit', async () => {
        const request = createRequest('10.0.0.1');
        const result = await rateLimit(request, { namespace: 'test-allow', maxRequests: 3 });
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(2);
    });

    it('should block requests exceeding the limit', async () => {
        const request = createRequest('10.0.0.2');
        const opts = { namespace: 'test-block', maxRequests: 2 };

        await rateLimit(request, opts); // 1
        await rateLimit(request, opts); // 2
        const result = await rateLimit(request, opts); // 3 - blocked

        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should track different IPs independently', async () => {
        const opts = { namespace: 'test-ips', maxRequests: 1 };

        const req1 = createRequest('10.0.0.3');
        const req2 = createRequest('10.0.0.4');

        await rateLimit(req1, opts);
        const result1 = await rateLimit(req1, opts);
        const result2 = await rateLimit(req2, opts);

        expect(result1.allowed).toBe(false);
        expect(result2.allowed).toBe(true);
    });

    it('should use different namespaces independently', async () => {
        const request = createRequest('10.0.0.5');

        await rateLimit(request, { namespace: 'ns-a', maxRequests: 1 });
        const resultA = await rateLimit(request, { namespace: 'ns-a', maxRequests: 1 });
        const resultB = await rateLimit(request, { namespace: 'ns-b', maxRequests: 1 });

        expect(resultA.allowed).toBe(false);
        expect(resultB.allowed).toBe(true);
    });
});

describe('rateLimitResponse', () => {
    it('should return null when allowed', async () => {
        const request = createRequest('10.0.0.10');
        const result = await rateLimitResponse(request, { namespace: 'test-resp', maxRequests: 5 });
        expect(result).toBeNull();
    });

    it('should return Response 429 when blocked', async () => {
        const request = createRequest('10.0.0.11');
        const opts = { namespace: 'test-resp-block', maxRequests: 1 };

        await rateLimitResponse(request, opts);
        const result = await rateLimitResponse(request, opts);

        expect(result).not.toBeNull();
        expect(result.status).toBe(429);
    });
});
