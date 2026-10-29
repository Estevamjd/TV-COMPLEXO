'use client';
import { useRef } from 'react';
import s from './urbano.module.css';

/**
 * Fileira horizontal: swipe no celular (scroll-snap), setas no computador e
 * teclado (Tab passa pelos cards; com a fileira em foco, ← → rolam).
 */
export default function Fileira({ rotulo, children }) {
    const ref = useRef(null);

    function rolar(dir) {
        const el = ref.current;
        if (!el) return;
        const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduzir ? 'auto' : 'smooth' });
    }

    return (
        <div className={s.fileira}>
            <div className={s.fileiraSetas}>
                <button type="button" className={s.seta} onClick={() => rolar(-1)} aria-label={`Rolar ${rotulo} para trás`}>←</button>
                <button type="button" className={s.seta} onClick={() => rolar(1)} aria-label={`Rolar ${rotulo} para frente`}>→</button>
            </div>
            <ul ref={ref} className={s.fileiraLista} role="list" aria-label={rotulo} tabIndex={0}>
                {children}
            </ul>
        </div>
    );
}
