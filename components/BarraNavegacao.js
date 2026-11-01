'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import NavPrincipal from '@/components/NavPrincipal';
import s from '@/components/home-urbano/urbano.module.css';

/**
 * Barra de navegação do topo, a mesma na Início (CanalTopo) e nas páginas internas (Header):
 * adesivo da marca (logo + faixa "das Favelas"), links e o botão destacado "Enviar denúncia" (só no computador;
 * no celular ele está na barra de baixo).
 */
export default function BarraNavegacao() {
    const pathname = usePathname() ?? '';
    return (
        <div className={s.barra}>
            {/* topo opção 2, "Adesivo": logo (sem mudança) e "das Favelas" numa peça só, como o player */}
            <Link href="/" className={`${s.marca} ${s.adesivo}`} aria-label="TV Complexo das Favelas, início">
                <span className={s.logoPlate}>
                    <Image src="/logo-header-cropped.png" alt="TV Complexo das Favelas" width={292} height={59} priority />
                </span>
                <span className={s.marcaFaixa} aria-hidden="true" data-nome>das Favelas</span>
            </Link>
            <NavPrincipal className={s.nav} />
            <Link href="/denuncias/enviar" className={`${s.btn} site-header-cta`}
                aria-current={pathname === '/denuncias/enviar' ? 'page' : undefined}>
                Enviar denúncia
            </Link>
        </div>
    );
}
