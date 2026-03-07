'use client';
import { useState, useEffect } from 'react';
import VideoCard from '@/components/VideoCard';
import FilterBar from '@/components/FilterBar';
import ShareButtons from '@/components/ShareButtons';

const filters = [
    { value: 'todos', label: '📺 Todos' },
    { value: 'noticias', label: '📰 Notícias' },
    { value: 'cultura', label: '🎨 Cultura' },
    { value: 'comunidade', label: '🏘️ Comunidade' },
    { value: 'eventos', label: '🎉 Eventos' },
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

    const fetchVideos = async () => {
        if (videos.length === 0) setLoading(true); // Apenas load inicial
        setIsFetching(true);

        const params = new URLSearchParams();
        if (filtro !== 'todos') params.append('categoria', filtro);
        if (busca) params.append('busca', busca);
        params.append('limit', '50');

        const res = await fetch(`/api/videos?${params}`);
        const data = await res.json();

        setVideos(data);
        setLoading(false);
        setIsFetching(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchVideos();
    };

    return (
        <div style={{ paddingTop: '20px' }}>
            <div className="page-header">
                <h1>📺 <span className="text-red">Vídeos</span></h1>
                <p>Assista a todos os vídeos da TV Complexo. Notícias, cultura e a realidade das comunidades.</p>
            </div>

            <div className="container">
                {/* Busca */}
                <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
                    <div className="search-box" style={{ maxWidth: '100%' }}>
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
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
                        <h3>Nenhum vídeo encontrado</h3>
                        <p>Tente outro filtro ou termo de busca.</p>
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

                {/* Modal de Vídeo */}
                {selectedVideo && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.9)',
                            zIndex: 2000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2rem',
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
                                border: '1px solid var(--color-dark-gray)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="video-player">
                                <iframe
                                    src={selectedVideo.url_video}
                                    title={selectedVideo.titulo}
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                ></iframe>
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                <h3 style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '1.8rem',
                                    textTransform: 'uppercase',
                                    marginBottom: '0.5rem'
                                }}>{selectedVideo.titulo}</h3>
                                <p style={{
                                    color: 'var(--color-gray-light)',
                                    marginBottom: '1rem',
                                    lineHeight: 1.6
                                }}>{selectedVideo.descricao}</p>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                    <span className="badge badge-yellow">
                                        📅 {new Date(selectedVideo.created_at).toLocaleDateString('pt-BR')}
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
                                    ✕ Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
