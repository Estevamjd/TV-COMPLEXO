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

// Sem thumbnail: listras do estilo urbano (mesmo "lugar reservado" da Início), sem bloco colorido gigante
const SEM_CAPA = 'repeating-linear-gradient(135deg, var(--ph-a) 0 14px, var(--ph-b) 14px 28px)';

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
                        : SEM_CAPA,
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
                                <span style={{ color: 'var(--ink)', fontSize: '2rem' }}>
                                    {platformIcons[video.plataforma] || <FaPlay />}
                                </span>
                            </>
                        )}
                    </div>

                    {video.destaque ? (
                        <span className="badge badge-yellow" style={{
                            position: 'absolute',
                            top: '0.75rem',
                            left: '0.75rem',
                            zIndex: 1
                        }}>Destaque</span>
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
                    <span style={{ fontSize: '0.85rem', fontFamily: 'var(--f-mono)', fontWeight: 700 }}>{date}</span>
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
                            background: 'var(--ink)',
                            color: 'var(--yellow)',
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
