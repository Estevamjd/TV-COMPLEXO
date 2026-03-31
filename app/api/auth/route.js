import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

// Segurança: sem variáveis configuradas, login é bloqueado
const AUTH_CONFIGURED = !!(ADMIN_PASSWORD && JWT_SECRET && (ADMIN_EMAIL || ADMIN_USER));

const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function POST(request) {
    try {
        if (!AUTH_CONFIGURED) {
            return NextResponse.json(
                { error: 'Autenticação não configurada. Defina ADMIN_EMAIL, ADMIN_PASSWORD e JWT_SECRET nas variáveis de ambiente.' },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { email, password } = body;

        // Compara com as credenciais (username ou email)
        const inputEmail = email || body.username;

        if ((inputEmail === ADMIN_EMAIL || inputEmail === ADMIN_USER) && password === ADMIN_PASSWORD) {
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
                sameSite: 'lax',
                maxAge: 60 * 60 * 24, // 24 hours
                path: '/',
            });

            return NextResponse.json({ message: 'Login realizado com sucesso' });
        }

        return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
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
        } catch (err) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('admin_token');
        return NextResponse.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
