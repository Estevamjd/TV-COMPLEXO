import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { auditLog } from '@/lib/audit';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET;

// Segurança: sem variáveis configuradas, login é bloqueado
const AUTH_CONFIGURED = !!(JWT_SECRET && (ADMIN_EMAIL || ADMIN_USER) && (ADMIN_PASSWORD_HASH || ADMIN_PASSWORD));

const secretKey = new TextEncoder().encode(JWT_SECRET);

/**
 * Verifica a senha do admin.
 * Suporta ADMIN_PASSWORD_HASH (bcrypt, preferido) ou ADMIN_PASSWORD (texto plano, legado).
 */
async function verifyPassword(password) {
    if (ADMIN_PASSWORD_HASH) {
        return bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    }
    // Fallback para texto plano (legado) — usar timing-safe comparison
    if (ADMIN_PASSWORD && ADMIN_PASSWORD.length === password.length) {
        let match = true;
        for (let i = 0; i < ADMIN_PASSWORD.length; i++) {
            if (ADMIN_PASSWORD.charCodeAt(i) !== password.charCodeAt(i)) {
                match = false;
            }
        }
        return match;
    }
    return false;
}

export async function POST(request) {
    try {
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
        const passwordMatch = await verifyPassword(password);

        if (credentialMatch && passwordMatch) {
            // Gera o token JWT
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
                maxAge: 60 * 60 * 24, // 24 hours
                path: '/',
            });

            auditLog('login', 'auth', null, inputEmail);
            return NextResponse.json({ message: 'Login realizado com sucesso' });
        }

        auditLog('login_failed', 'auth', null, inputEmail);
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

export async function DELETE() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('admin_token');
        auditLog('logout', 'auth');
        return NextResponse.json({ message: 'Logout realizado com sucesso' });
    } catch {
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}
