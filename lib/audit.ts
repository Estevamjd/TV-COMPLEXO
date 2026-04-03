import db from './db';

type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'login_failed';
type AuditResource = 'video' | 'noticia' | 'denuncia' | 'comentario' | 'auth' | 'upload';

/**
 * Registra uma ação administrativa no audit log.
 */
export async function auditLog(
    action: AuditAction,
    resource: AuditResource,
    resourceId: string | null = null,
    adminEmail: string | null = null,
    details: Record<string, unknown> | null = null
): Promise<void> {
    try {
        await db.query(`
            INSERT INTO audit_log (action, resource, resource_id, admin_email, details, ip_address)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            action,
            resource,
            resourceId,
            adminEmail,
            details ? JSON.stringify(details) : null,
            null,
        ]);
    } catch (err) {
        console.error('[audit] Falha ao registrar log:', (err as Error).message);
    }
}

/**
 * Registra ação com IP do request.
 */
export async function auditLogWithRequest(
    request: Request,
    action: AuditAction,
    resource: AuditResource,
    resourceId: string | null = null,
    adminEmail: string | null = null,
    details: Record<string, unknown> | null = null
): Promise<void> {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || null;

    try {
        await db.query(`
            INSERT INTO audit_log (action, resource, resource_id, admin_email, details, ip_address)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [action, resource, resourceId, adminEmail, details ? JSON.stringify(details) : null, ip]);
    } catch (err) {
        console.error('[audit] Falha ao registrar log:', (err as Error).message);
    }
}
