'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import NavPrincipal from '@/components/NavPrincipal';
import s from '@/components/home-urbano/urbano.module.css';

/**
 * Barra de navegação do topo, a mesma na Início (CanalTopo) e nas páginas internas (Header):
 * placa do logo, links e o botão destacado "Enviar denúncia" (só no computador;
 * no celular ele está na barra de baixo).
 */
export default function BarraNavegacao() {
    const pathname = usePathname() ?? '';
    return (
        <div className={s.barra}>
            <Link href="/" className={s.logoPlate} aria-label="TV Complexo, início">
                <Image src="/logo-header-cropped.png" alt="TV Complexo" width={292} height={59} priority />
            </Link>
            <NavPrincipal className={s.nav} />
            <Link href="/denuncias/enviar" className={`${s.btn} site-header-cta`}
                aria-current={pathname === '/denuncias/enviar' ? 'page' : undefined}>
                Enviar denúncia
            </Link>
        </div>
    );
}
