/**
 * Rate limiter híbrido para Vercel Serverless.
 *
 * - Se UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN estiverem definidos,
 *   usa Upstash Redis (sliding window distribuído — correto em serverless).
 * - Senão, cai para um limiter em memória (best-effort, por instância).
 *
 * Todos os métodos são async para manter a API consistente entre os dois modos.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfter: number | null;
}

interface RateLimitOptions {
    windowMs?: number;
    maxRequests?: number;
    namespace?: string;
}

interface RequestLike {
    headers: {
        get(key: string): string | null;
    };
}

const hasUpstash = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = hasUpstash ? Redis.fromEnv() : null;
const limiters = new Map<string, Ratelimit>();

function getUpstashLimiter(namespace: string, maxRequests: number, windowMs: number): Ratelimit {
    const key = `${namespace}:${maxRequests}:${windowMs}`;
    let limiter = limiters.get(key);
    if (!limiter && redis) {
        limiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
            prefix: `rl:${namespace}`,
            analytics: false,
        });
        limiters.set(key, limiter);
    }
    return limiter!;
}

// Fallback in-memory store
const memStores = new Map<string, Map<string, number[]>>();

function getMemStore(namespace: string): Map<string, number[]> {
    if (!memStores.has(namespace)) {
        memStores.set(namespace, new Map());
    }
    return memStores.get(namespace)!;
}

function memRateLimit(ip: string, namespace: string, maxRequests: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const windowStart = now - windowMs;
    const store = getMemStore(namespace);

    if (store.size > 500) {
        for (const [key, times] of store) {
            const valid = times.filter(t => t > windowStart);
            if (valid.length === 0) store.delete(key);
            else store.set(key, valid);
        }
    }

    const timestamps = (store.get(ip) || []).filter(t => t > windowStart);

    if (timestamps.length >= maxRequests) {
        const oldestInWindow = timestamps[0];
        const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);
        return { allowed: false, remaining: 0, retryAfter };
    }

    timestamps.push(now);
    store.set(ip, timestamps);

    return { allowed: true, remaining: maxRequests - timestamps.length, retryAfter: null };
}

function getClientIp(request: RequestLike): string {
    return (
        request.headers.get('x-real-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        'unknown'
    );
}

export async function rateLimit(request: RequestLike, options: RateLimitOptions = {}): Promise<RateLimitResult> {
    const {
        windowMs = 60 * 1000,
        maxRequests = 5,
        namespace = 'default',
    } = options;

    const ip = getClientIp(request);

    if (hasUpstash) {
        try {
            const limiter = getUpstashLimiter(namespace, maxRequests, windowMs);
            const { success, remaining, reset } = await limiter.limit(ip);
            const retryAfter = success ? null : Math.max(1, Math.ceil((reset - Date.now()) / 1000));
            return { allowed: success, remaining, retryAfter };
        } catch (err) {
            console.error('[rate-limit] Upstash error, falling back to memory:', (err as Error).message);
            return memRateLimit(ip, namespace, maxRequests, windowMs);
        }
    }

    return memRateLimit(ip, namespace, maxRequests, windowMs);
}

export async function rateLimitResponse(request: RequestLike, options: RateLimitOptions = {}): Promise<Response | null> {
    const result = await rateLimit(request, options);

    if (!result.allowed) {
        return new Response(
            JSON.stringify({ error: 'Muitas tentativas. Aguarde um momento.' }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': String(result.retryAfter || 60),
                    'X-RateLimit-Limit': String(options.maxRequests || 5),
                    'X-RateLimit-Remaining': '0',
                },
            }
        );
    }

    return null;
}
