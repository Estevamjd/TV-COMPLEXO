import Link from 'next/link';

/**
 * Link para a política de privacidade (R4). Usado no formulário de denúncia,
 * no footer e — na Fase 2 — no formulário de newsletter.
 */
export default function PrivacyLink({ children = 'Política de privacidade', className = 'privacy-link', ...props }) {
    return (
        <Link href="/privacidade" className={className} {...props}>
            {children}
        </Link>
    );
}
