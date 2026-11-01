'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import NavPrincipal from '@/components/NavPrincipal';
import s from '@/components/home-urbano/urbano.module.css';

/**
 * Barra de navegação do topo, a mesma na Início (CanalTopo) e nas páginas internas (Header):
 * placa do logo com a fita "das Favelas", links e o botão destacado "Enviar denúncia" (só no computador;
 * no celular ele está na barra de baixo).
 */
export default function BarraNavegacao() {
    const pathname = usePathname() ?? '';
    return (
        <div className={s.barra}>
            {/* direção A (empilhado): o logo não muda; "das Favelas" entra como fita embaixo dele */}
            <Link href="/" className={s.marca} aria-label="TV Complexo das Favelas, início">
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
