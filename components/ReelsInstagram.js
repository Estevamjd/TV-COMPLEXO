import Link from 'next/link';
import InstagramReel from '@/components/InstagramReel';
import { INSTAGRAM_PERFIL, INSTAGRAM_REELS } from '@/lib/instagramReels';
import s from './InstagramReels.module.css';

/**
 * Seção de reels do @tvcomplexo (embed oficial do Instagram).
 * `limite` corta a lista (destaque da Início); `verTudo` mostra o link para /videos.
 */
export default function ReelsInstagram({ limite, verTudo = false, tituloId = 'reels-titulo' }) {
    const reels = limite ? INSTAGRAM_REELS.slice(0, limite) : INSTAGRAM_REELS;
    if (reels.length === 0) return null;

    return (
        <section id="reels" className={s.secao} aria-labelledby={tituloId}>
            <div className={s.topo}>
                <h2 id={tituloId} className={s.titulo}>Reels</h2>
                {verTudo ? (
                    <Link href="/videos#reels" className={s.verTudo}>ver todos →</Link>
                ) : (
                    <a href={INSTAGRAM_PERFIL} className={s.verTudo} target="_blank" rel="noopener noreferrer">
                        @tvcomplexo<span className={s.srOnly}> no Instagram (abre em nova aba)</span> ↗
                    </a>
                )}
            </div>
            <ul className={s.grade} role="list" aria-label="Reels do Instagram @tvcomplexo">
                {reels.map((url, i) => (
                    <li key={url} className={s.item}>
                        <InstagramReel url={url} numero={i + 1} />
                    </li>
                ))}
            </ul>
        </section>
    );
}
