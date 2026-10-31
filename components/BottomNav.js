'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FaHome, FaPlay, FaMapMarkedAlt, FaBullhorn, FaNewspaper, FaInfoCircle } from 'react-icons/fa';
import { NAV_ITENS, itemAtivo } from '@/lib/navegacao';

const ICONES = { inicio: FaHome, videos: FaPlay, mapa: FaMapMarkedAlt, denunciar: FaBullhorn, noticias: FaNewspaper, sobre: FaInfoCircle };

/** Barra fixa de baixo, em todas as telas públicas (inclusive a Início) até 1023px. */
export default function BottomNav() {
    const pathname = usePathname() ?? '';

    // Não mostrar no admin
    if (pathname.startsWith('/admin')) return null;

    const ativo = itemAtivo(pathname);

    return (
        <nav className="bottom-nav" aria-label="Navegação principal">
            {NAV_ITENS.map(item => {
                const Icon = ICONES[item.icone];
                const atual = item.href === ativo;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={atual ? 'page' : undefined}
                        className={`bottom-nav-item ${atual ? 'active' : ''} ${item.cta ? 'cta' : ''}`}
                    >
                        <span className={`bottom-nav-icon ${item.cta ? 'cta-icon' : ''}`} aria-hidden="true">
                            <Icon />
                        </span>
                        <span className="bottom-nav-label">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
