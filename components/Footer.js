import Link from 'next/link';
import Image from 'next/image';
import PrivacyLink from '@/components/PrivacyLink';
import s from '@/components/home-urbano/urbano.module.css';

const CANAL_URL = 'https://www.youtube.com/@tvcomplexofc';

/** Rodapé único do site (Início e páginas internas), no desenho urbano. */
export default function Footer() {
    return (
        <footer id="rodape" className={s.rodape}>
            <div className={`${s.wrap} ${s.rodapeInner}`}>
                <Link href="/" className={s.logoPlate} aria-label="TV Complexo, início">
                    <Image src="/logo-header-cropped.png" alt="TV Complexo" width={292} height={59} />
                </Link>
                <nav aria-label="Rodapé">
                    <ul className={s.rodapeLinks}>
                        <li><Link href="/videos">Vídeos</Link></li>
                        <li><Link href="/noticias">Notícias</Link></li>
                        <li><Link href="/denuncias">Mapa de denúncias</Link></li>
                        <li><Link href="/sobre">Sobre</Link></li>
                        <li><a href={CANAL_URL} target="_blank" rel="noopener noreferrer">YouTube</a></li>
                        <li><a href="https://www.instagram.com/tvcomplexo" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                        <li><a href="https://www.tiktok.com/@tvcomplexo" target="_blank" rel="noopener noreferrer">TikTok</a></li>
                        <li><a href="https://www.facebook.com/share/18JkYR2cBS/" target="_blank" rel="noopener noreferrer">Facebook</a></li>
                    </ul>
                </nav>
                <p className={s.rodapeLinha}>
                    Responsável: Estevam Juliano · <PrivacyLink className="">Privacidade</PrivacyLink> ·{' '}
                    <a href="https://wa.me/5521966030258" target="_blank" rel="noopener noreferrer">WhatsApp (21) 96603-0258</a>
                </p>
            </div>
        </footer>
    );
}
