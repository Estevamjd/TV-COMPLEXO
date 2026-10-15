import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { auditLogWithRequest } from '@/lib/audit';
import { rateLimitResponse } from '@/lib/rate-limit';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET;

// Segurança: sem variáveis configuradas, login é bloqueado.
// ADMIN_PASSWORD_HASH é obrigatório — senhas em texto plano não são aceitas.
const AUTH_CONFIGURED = !!(JWT_SECRET && (ADMIN_EMAIL || ADMIN_USER) && ADMIN_PASSWORD_HASH);

const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function POST(request) {
    try {
        // Rate limit: 5 tentativas por 5 min por IP (anti brute-force)
        const blocked = await rateLimitResponse(request, {
            namespace: 'auth-login',
            maxRequests: 5,
            windowMs: 5 * 60 * 1000,
        });
        if (blocked) return blocked;

        if (!AUTH_CONFIGURED) {
            return NextResponse.json(
                { error: 'Autenticação não configurada. Defina ADMIN_EMAIL, ADMIN_PASSWORD_HASH e JWT_SECRET nas variáveis de ambiente.' },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { email, password } = body;

        if (!password || typeof password !== 'string') {
            return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
        }

        // Compara com as credenciais (username ou email)
        const inputEmail = email || body.username;
        const credentialMatch = (inputEmail === ADMIN_EMAIL || inputEmail === ADMIN_USER);
        const passwordMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

        if (credentialMatch && passwordMatch) {
            const token = await new SignJWT({ email: inputEmail, role: 'admin' })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('24h')
                .sign(secretKey);

            const cookieStore = await cookies();
            cookieStore.set('admin_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24,
                path: '/',
            });

            await auditLogWithRequest(request, 'login', 'auth', null, inputEmail);
            return NextResponse.json({ message: 'Login realizado com sucesso' });
        }

        await auditLogWithRequest(request, 'login_failed', 'auth', null, inputEmail);
        return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    } catch {
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        try {
            await jwtVerify(token, secretKey);
            return NextResponse.json({ authenticated: true });
        } catch {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }
    } catch {
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('admin_token');
        await auditLogWithRequest(request, 'logout', 'auth');
        return NextResponse.json({ message: 'Logout realizado com sucesso' });
    } catch {
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}
