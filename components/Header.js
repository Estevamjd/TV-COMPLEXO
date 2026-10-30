'use client';
import { usePathname } from 'next/navigation';
import BarraNavegacao from '@/components/BarraNavegacao';
import s from '@/components/home-urbano/urbano.module.css';

/**
 * Cabeçalho das páginas internas, com a mesma barra do topo da Início (BarraNavegacao).
 * No celular a navegação fica na barra de baixo (BottomNav), então aqui não há botão de menu.
 */
export default function Header() {
    const pathname = usePathname() ?? '';

    // A home tem a mesma barra dentro do topo amarelo (CanalTopo).
    if (pathname === '/') return null;

    return (
        <header className="site-header">
            <div className={s.wrap}>
                <BarraNavegacao />
            </div>
        </header>
    );
}
