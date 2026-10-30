'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITENS, itemAtivo } from '@/lib/navegacao';

/** Links do cabeçalho (computador). Mesma lista e mesmo destaque da barra de baixo. */
export default function NavPrincipal({ className }) {
    const ativo = itemAtivo(usePathname());
    return (
        <nav aria-label="Principal" className={className}>
            <ul>
                {NAV_ITENS.filter(item => !item.cta).map(item => (
                    <li key={item.href}>
                        <Link href={item.href} aria-current={item.href === ativo ? 'page' : undefined}>{item.label}</Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
