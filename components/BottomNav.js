'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FaHome, FaPlay, FaBullhorn, FaNewspaper, FaInfoCircle } from 'react-icons/fa';

const navItems = [
    { href: '/', label: 'Início', icon: FaHome },
    { href: '/videos', label: 'Vídeos', icon: FaPlay },
    { href: '/denuncias/enviar', label: 'Denúncia', icon: FaBullhorn, isCta: true },
    { href: '/noticias', label: 'Notícias', icon: FaNewspaper },
    { href: '/sobre', label: 'Sobre', icon: FaInfoCircle },
];

export default function BottomNav() {
    const pathname = usePathname();

    // Não mostrar no admin
    if (pathname.startsWith('/admin')) return null;

    return (
        <nav className="bottom-nav">
            {navItems.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href));

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`bottom-nav-item ${isActive ? 'active' : ''} ${item.isCta ? 'cta' : ''}`}
                    >
                        <span className={`bottom-nav-icon ${item.isCta ? 'cta-icon' : ''}`}>
                            <Icon />
                        </span>
                        <span className="bottom-nav-label">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
