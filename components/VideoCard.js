'use client';
import { useRouter } from 'next/navigation';
import { FaFacebook, FaInstagram, FaTiktok, FaYoutube, FaPlay } from 'react-icons/fa';

const platformLabels = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    manual: 'TV Complexo',
};

const platformIcons = {
    instagram: <FaInstagram />,
    facebook: <FaFacebook />,
    tiktok: <FaTiktok />,
    youtube: <FaYoutube />,
    manual: <FaPlay />,
};

const platformClass = {
    instagram: 'platform-instagram',
    facebook: 'platform-facebook',
    tiktok: 'platform-tiktok',
    youtube: 'platform-youtube',
    manual: 'platform-manual',
};

export default function VideoCard({ video, onClick }) {
    const router = useRouter();
    const date = new Date(video.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const isSocialLink = video.plataforma !== 'manual';

    const handleCardClick = () => {
        if (onClick) {
            onClick(); // Se for passado via prop (ex: modal na página /videos)
        } else {
            router.push(`/videos/${video.id}`); // Navegação padrão
        }
    };

    const handleSocialClick = (e) => {
        e.stopPropagation(); // Impede que o clique no botão ative o clique no card
        window.open(video.url_video, '_blank', 'noopener,noreferrer');
    };

    return (
        <div
            className="card"
            onClick={handleCardClick}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%' }}
        >
            <div className="card-image" style={{ height: '200px' }}>
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: video.thumbnail ? `url(${video.thumbnail}) center/cover no-repeat` : 'linear-gradient(135deg, var(--color-dark) 0%, #1a0a0a 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}>
                    {video.thumbnail && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)'
                        }}></div>
                    )}
                    <div style={{
                        fontSize: '3rem',
                        opacity: video.thumbnail ? 0.9 : 0.3,
                        zIndex: 1
                    }}>
                        <FaPlay style={{ color: 'white' }} />
                    </div>

                    {video.destaque ? (
                        <span className="badge badge-yellow" style={{
                            position: 'absolute',
                            top: '0.75rem',
                            left: '0.75rem',
                            zIndex: 1
                        }}>⭐ Destaque</span>
                    ) : null}

                    <div className={`platform-icon ${platformClass[video.plataforma] || 'platform-manual'}`} style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {platformIcons[video.plataforma] || <FaPlay size={12} />}
                        {platformLabels[video.plataforma] || video.plataforma}
                    </div>
                </div>
            </div>
            <div className="card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    marginBottom: '0.5rem',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>{video.titulo}</h3>

                <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-gray-light)',
                    marginBottom: '1rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    flexGrow: 1
                }}>{video.descricao}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-medium)' }}>📅 {date}</span>
                </div>

                {/* Botão da Rede Social Original */}
                {isSocialLink && (
                    <button
                        onClick={handleSocialClick}
                        className={`btn btn-sm`}
                        style={{
                            marginTop: '0.75rem',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            background: 'var(--color-dark-gray)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        {platformIcons[video.plataforma]}
                        Ver no {platformLabels[video.plataforma]}
                    </button>
                )}
            </div>
        </div>
    );
}
