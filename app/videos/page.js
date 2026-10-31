'use client';
import { useState, useEffect, useCallback } from 'react';
import VideoCard from '@/components/VideoCard';
import FilterBar from '@/components/FilterBar';
import ShareButtons from '@/components/ShareButtons';
import ReelsInstagram from '@/components/ReelsInstagram';
import { toEmbedUrl } from '@/lib/video-utils';

const filters = [
    { value: 'todos', label: 'Todos' },
    { value: 'noticias', label: 'Notícias' },
    { value: 'cultura', label: 'Cultura' },
    { value: 'comunidade', label: 'Comunidade' },
    { value: 'eventos', label: 'Eventos' },
];

export default function VideosPage() {
    const [videos, setVideos] = useState([]);
    const [filtro, setFiltro] = useState('todos');
    const [busca, setBusca] = useState('');
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        fetchVideos();
    }, [filtro]);

    // Fechar modal com ESC
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && selectedVideo) {
                setSelectedVideo(null);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedVideo]);

    const fetchVideos = async () => {
        if (videos.length === 0) setLoading(true); // Apenas load inicial
        setIsFetching(true);

        const params = new URLSearchParams();
        if (filtro !== 'todos') params.append('categoria', filtro);
        if (busca) params.append('busca', busca);
        params.append('limit', '50');

        // erro da API (ex.: banco fora) = lista vazia, não tela quebrada
        const data = await fetch(`/api/videos?${params}`).then(r => (r.ok ? r.json() : [])).catch(() => []);

        setVideos(Array.isArray(data) ? data : []);
        setLoading(false);
        setIsFetching(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchVideos();
    };

    return (
        <div>
            <div className="page-header">
                <h1>Vídeos</h1>
                <p>Assista a todos os vídeos da TV Complexo. Notícias, cultura e a realidade das comunidades.</p>
            </div>

            <div className="container">
                {/* Busca */}
                <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
                    <div className="search-box" style={{ maxWidth: '100%' }}>
                        <span className="search-icon" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></svg>
                        </span>
                        <input
                            type="text"
                            aria-label="Buscar vídeos"
                            className="search-input"
                            placeholder="Buscar vídeos..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>
                </form>

                {/* Filtros */}
                <FilterBar filters={filters} activeFilter={filtro} onFilterChange={setFiltro} />

                {/* Grid */}
                {loading ? (
                    <div className="flex-center" style={{ padding: '4rem' }}>
                        <div className="spinner"></div>
                    </div>
                ) : videos.length === 0 ? (
                    <div className="empty-state">
                        <h3>Nenhum vídeo por aqui</h3>
                        <p>Tente outro filtro ou outra busca. Os vídeos mais novos também saem no YouTube do @tvcomplexofc.</p>
                        <div className="botoes-vazio">
                            <a href="https://www.youtube.com/@tvcomplexofc" target="_blank" rel="noopener noreferrer" className="btn btn-primary">Abrir o YouTube</a>
                        </div>
                    </div>
                ) : (
                    <div className={`grid-3 fade-in transition-opacity ${isFetching ? 'opacity-50' : ''}`}>
                        {videos.map(video => (
                            <div key={video.id} onClick={() => setSelectedVideo(video)} style={{ cursor: 'pointer' }}>
                                <VideoCard video={video} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Reels do Instagram @tvcomplexo (todos da lista, embed oficial) */}
                <ReelsInstagram />

                {/* Modal de Vídeo */}
                {selectedVideo && (
                    <div
                        role="dialog"
                        aria-label={`Assistir: ${selectedVideo.titulo}`}
                        aria-modal="true"
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.9)',
                            zIndex: 2000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem',
                        }}
                        onClick={() => setSelectedVideo(null)}
                    >
                        <div
                            style={{
                                background: 'var(--color-black-light)',
                                borderRadius: 'var(--radius-lg)',
                                maxWidth: '900px',
                                width: '100%',
                                overflow: 'hidden',
                                border: '3px solid var(--ink)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {(() => {
                                const embedUrl = toEmbedUrl(selectedVideo.url_video);
                                if (embedUrl) {
                                    return (
                                        <div className="video-player">
                                            <iframe
                                                src={embedUrl}
                                                title={selectedVideo.titulo}
                                                allowFullScreen
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            ></iframe>
                                        </div>
                                    );
                                }
                                // URL externa (Instagram, TikTok, etc.) - mostrar link
                                return (
                                    <div style={{
                                        width: '100%',
                                        aspectRatio: '16/9',
                                        background: selectedVideo.thumbnail
                                            ? `url(${selectedVideo.thumbnail}) center/cover no-repeat`
                                            : 'linear-gradient(135deg, var(--color-dark) 0%, #1a0a0a 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                    }}>
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} />
                                        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '2rem' }}>
                                            <a
                                                href={selectedVideo.url_video}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-primary btn-lg"
                                            >
                                                Assistir no {selectedVideo.plataforma?.charAt(0).toUpperCase() + selectedVideo.plataforma?.slice(1)} ↗
                                            </a>
                                        </div>
                                    </div>
                                );
                            })()}
                            <div style={{ padding: '1.5rem' }}>
                                <h3 style={{
                                    fontFamily: 'var(--f-heading)',
                                    fontSize: '1.4rem',
                                    lineHeight: 1.2,
                                    marginBottom: '0.5rem'
                                }}>{selectedVideo.titulo}</h3>
                                <p style={{
                                    color: 'var(--color-gray-light)',
                                    marginBottom: '1rem',
                                    lineHeight: 1.6
                                }}>{selectedVideo.descricao}</p>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                    <span className="badge badge-yellow">
                                        {new Date(selectedVideo.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                    <span className={`platform-icon platform-${selectedVideo.plataforma}`}>
                                        {selectedVideo.plataforma}
                                    </span>
                                </div>
                                <ShareButtons title={selectedVideo.titulo} />
                                <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ marginTop: '1rem' }}
                                    onClick={() => setSelectedVideo(null)}
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
