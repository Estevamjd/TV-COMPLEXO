'use client';
import { useEffect, useRef, useState } from 'react';
import { embedDoReel, idDoReel } from '@/lib/instagramReels';
import s from './InstagramReels.module.css';

/**
 * Um reel do Instagram com o player oficial (iframe /embed/). O iframe só é montado
 * quando o bloco chega perto da tela (IntersectionObserver); sem IO, monta direto.
 * Até lá fica um lugar reservado do mesmo tamanho, com link para o Instagram.
 */
export default function InstagramReel({ url, numero }) {
    const ref = useRef(null);
    const [montado, setMontado] = useState(false);
    const id = idDoReel(url);
    const titulo = `Reel ${numero} do Instagram @tvcomplexo`;

    useEffect(() => {
        if (montado || !id) return undefined;
        if (typeof IntersectionObserver === 'undefined') {
            setMontado(true);
            return undefined;
        }
        const io = new IntersectionObserver((entradas) => {
            if (entradas.some(e => e.isIntersecting)) {
                setMontado(true);
                io.disconnect();
            }
        }, { rootMargin: '200px 0px' });
        if (ref.current) io.observe(ref.current);
        return () => io.disconnect();
    }, [montado, id]);

    if (!id) return null;

    return (
        <div ref={ref} className={s.reel}>
            {montado ? (
                <iframe
                    className={s.quadro}
                    src={embedDoReel(id)}
                    title={titulo}
                    allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
                    allowFullScreen
                    loading="lazy"
                />
            ) : (
                <div className={`${s.quadro} ${s.reserva}`} role="group" aria-label={titulo}>
                    <span className={s.reservaSelo} aria-hidden="true">Reel</span>
                    <a href={url} className={s.reservaLink} target="_blank" rel="noopener noreferrer">
                        Ver no Instagram<span className={s.srOnly}> (abre em nova aba)</span>
                    </a>
                </div>
            )}
        </div>
    );
}
