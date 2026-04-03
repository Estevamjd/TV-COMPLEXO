import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

function mockRequest(ip = '127.0.0.1') {
    return {
        headers: new Map([
            ['x-real-ip', ip],
            ['x-forwarded-for', ip],
        ]),
    };
}

// Adapter because our rateLimit expects request.headers.get()
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

describe('rateLimit', () => {
    it('should allow requests within the limit', () => {
        const request = createRequest('10.0.0.1');
        const result = rateLimit(request, { namespace: 'test-allow', maxRequests: 3 });
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(2);
    });

    it('should block requests exceeding the limit', () => {
        const request = createRequest('10.0.0.2');
        const opts = { namespace: 'test-block', maxRequests: 2 };

        rateLimit(request, opts); // 1
        rateLimit(request, opts); // 2
        const result = rateLimit(request, opts); // 3 - blocked

        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should track different IPs independently', () => {
        const opts = { namespace: 'test-ips', maxRequests: 1 };

        const req1 = createRequest('10.0.0.3');
        const req2 = createRequest('10.0.0.4');

        rateLimit(req1, opts); // IP 1: request 1
        const result1 = rateLimit(req1, opts); // IP 1: blocked
        const result2 = rateLimit(req2, opts); // IP 2: allowed

        expect(result1.allowed).toBe(false);
        expect(result2.allowed).toBe(true);
    });

    it('should use different namespaces independently', () => {
        const request = createRequest('10.0.0.5');

        rateLimit(request, { namespace: 'ns-a', maxRequests: 1 });
        const resultA = rateLimit(request, { namespace: 'ns-a', maxRequests: 1 }); // blocked
        const resultB = rateLimit(request, { namespace: 'ns-b', maxRequests: 1 }); // allowed

        expect(resultA.allowed).toBe(false);
        expect(resultB.allowed).toBe(true);
    });
});

describe('rateLimitResponse', () => {
    it('should return null when allowed', () => {
        const request = createRequest('10.0.0.10');
        const result = rateLimitResponse(request, { namespace: 'test-resp', maxRequests: 5 });
        expect(result).toBeNull();
    });

    it('should return Response 429 when blocked', () => {
        const request = createRequest('10.0.0.11');
        const opts = { namespace: 'test-resp-block', maxRequests: 1 };

        rateLimitResponse(request, opts); // 1
        const result = rateLimitResponse(request, opts); // blocked

        expect(result).not.toBeNull();
        expect(result.status).toBe(429);
    });
});
