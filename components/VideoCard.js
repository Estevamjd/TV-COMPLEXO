'use client';
import { useRouter } from 'next/navigation';
import { FaFacebook, FaInstagram, FaTiktok, FaYoutube, FaPlay } from 'react-icons/fa';

const platformLabels = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    vimeo: 'Vimeo',
    manual: 'TV Complexo',
};

const platformIcons = {
    instagram: <FaInstagram />,
    facebook: <FaFacebook />,
    tiktok: <FaTiktok />,
    youtube: <FaYoutube />,
    vimeo: <FaPlay />,
    manual: <FaPlay />,
};

const platformClass = {
    instagram: 'platform-instagram',
    facebook: 'platform-facebook',
    tiktok: 'platform-tiktok',
    youtube: 'platform-youtube',
    vimeo: 'platform-manual',
    manual: 'platform-manual',
};

// Gradientes por plataforma quando não há thumbnail
const platformGradients = {
    instagram: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
    facebook: 'linear-gradient(135deg, #1877f2 0%, #0a5dc2 100%)',
    tiktok: 'linear-gradient(135deg, #010101 0%, #69c9d0 50%, #ee1d52 100%)',
    youtube: 'linear-gradient(135deg, #ff0000 0%, #900 100%)',
    vimeo: 'linear-gradient(135deg, #1ab7ea 0%, #0d6eac 100%)',
    manual: 'linear-gradient(135deg, var(--color-dark) 0%, #1a0a0a 100%)',
};

export default function VideoCard({ video, onClick }) {
    const router = useRouter();
    const date = new Date(video.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const isSocialLink = video.plataforma !== 'manual';
    const hasThumbnail = video.thumbnail && video.thumbnail.startsWith('http') && !video.thumbnail.includes('instagram.com/');

    const handleCardClick = () => {
        if (onClick) {
            onClick();
        } else {
            router.push(`/videos/${video.id}`);
        }
    };

    const handleSocialClick = (e) => {
        e.stopPropagation();
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
                    background: hasThumbnail
                        ? `url(${video.thumbnail}) center/cover no-repeat`
                        : platformGradients[video.plataforma] || platformGradients.manual,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}>
                    {hasThumbnail && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.4)'
                        }}></div>
                    )}

                    {/* Ícone central */}
                    <div style={{
                        fontSize: hasThumbnail ? '3rem' : '2.5rem',
                        opacity: hasThumbnail ? 0.9 : 0.85,
                        zIndex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}>
                        {hasThumbnail ? (
                            <FaPlay style={{ color: 'white' }} />
                        ) : (
                            <>
                                <span style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                                    {platformIcons[video.plataforma] || <FaPlay />}
                                </span>
                                {!hasThumbnail && (
                                    <span style={{
                                        fontSize: '0.7rem',
                                        color: 'rgba(255,255,255,0.8)',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}>
                                        {platformLabels[video.plataforma] || 'Vídeo'}
                                    </span>
                                )}
                            </>
                        )}
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

                {isSocialLink && (
                    <button
                        onClick={handleSocialClick}
                        className="btn btn-sm"
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
