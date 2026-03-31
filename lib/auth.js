import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-fallback';
const secretKey = new TextEncoder().encode(JWT_SECRET);

/**
 * Verifica se a request tem um token admin válido.
 * Retorna true se autenticado, false caso contrário.
 */
export async function isAuthenticated() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_token')?.value;
        if (!token) return false;
        await jwtVerify(token, secretKey);
        return true;
    } catch {
        return false;
    }
}
