import Link from 'next/link';
import { FaFacebook, FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-col">
                        <h3>TV Complexo</h3>
                        <p style={{ color: 'var(--color-gray-light)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            A real da favela. Mídia independente direto das comunidades do Rio de Janeiro.
                        </p>
                    </div>
                    <div className="footer-col">
                        <h3>Navegação</h3>
                        <Link href="/">Início</Link>
                        <Link href="/videos">Vídeos</Link>
                        <Link href="/noticias">Notícias</Link>
                        <Link href="/denuncias">Denúncias</Link>
                        <Link href="/sobre">Sobre Nós</Link>
                    </div>
                    <div className="footer-col">
                        <h3>Comunidades</h3>
                        <a href="#">Complexo do Alemão</a>
                        <a href="#">Rocinha</a>
                        <a href="#">Cidade de Deus</a>
                        <a href="#">Maré</a>
                        <a href="#">Vidigal</a>
                    </div>
                    <div className="footer-col" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Contato</h3>
                        <a href="https://wa.me/5521966030258" target="_blank" rel="noopener noreferrer">📞 (21) 96603-0258</a>
                        <a href="mailto:tvcomplexofc@gmail.com">✉️ tvcomplexofc@gmail.com</a>
                    </div>
                    <div className="footer-col" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Redes Sociais</h3>
                        <a href="https://www.instagram.com/tvcomplexo?igsh=czJ3ZGhvZG85bWxm" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaInstagram /> Instagram</a>
                        <a href="https://www.facebook.com/share/18JkYR2cBS/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaFacebook /> Facebook</a>
                        <a href="https://www.tiktok.com/@tvcomplexo?_r=1&_t=ZS-94S51Uw009v" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaTiktok /> TikTok</a>
                        <a href="http://www.youtube.com/@tvcomplexofc" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaYoutube /> YouTube</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} TV Complexo — A Real da Favela. Todos os direitos reservados.</p>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-gray-dark)' }}>
                        Site desenvolvido por <strong>Estevam Juliano</strong>
                    </p>
                </div>
            </div>
        </footer>
    );
}
