'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaFacebook, FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa';

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const links = [
        { href: '/', label: 'Início' },
        { href: '/videos', label: 'Vídeos' },
        { href: '/noticias', label: 'Notícias' },
        { href: '/denuncias', label: 'Denúncias' },
        { href: '/sobre', label: 'Sobre' },
    ];

    return (
        <header className="header">
            <div className="header-inner">
                <Link href="/" className="logo" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/logo-header-cropped.png" alt="TV Complexo" style={{ height: '50px', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.1))' }} />
                </Link>

                <nav>
                    <div className={`nav-links ${isOpen ? 'open' : ''}`}>
                        {links.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`nav-link ${pathname === link.href ? 'active' : ''}`}
                                onClick={() => setIsOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            href="/denuncias/enviar"
                            className="nav-link nav-cta"
                            onClick={() => setIsOpen(false)}
                        >
                            📢 Enviar Denúncia
                        </Link>
                        <div className="social-icons-container">
                            <a href="https://www.facebook.com/share/18JkYR2cBS/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="social-icon-header" title="Facebook">
                                <FaFacebook />
                            </a>
                            <a href="https://www.instagram.com/tvcomplexo?igsh=czJ3ZGhvZG85bWxm" target="_blank" rel="noopener noreferrer" className="social-icon-header" title="Instagram">
                                <FaInstagram />
                            </a>
                            <a href="https://www.tiktok.com/@tvcomplexo?_r=1&_t=ZS-94S51Uw009v" target="_blank" rel="noopener noreferrer" className="social-icon-header" title="TikTok">
                                <FaTiktok />
                            </a>
                            <a href="http://www.youtube.com/@tvcomplexofc" target="_blank" rel="noopener noreferrer" className="social-icon-header" title="YouTube">
                                <FaYoutube />
                            </a>
                        </div>
                    </div>
                </nav>

                <button
                    className="hamburger"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </header>
    );
}
