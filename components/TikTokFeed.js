'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import TikTokVideo from './TikTokVideo';

export default function TikTokFeed() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Observer ref para a div final (Infinite Scroll Trigger)
    const observerTarget = useRef(null);

    const LIMIT = 5; // Carregar de 5 em 5 para fluidez

    const fetchVideos = useCallback(async () => {
        if (!hasMore) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/videos?limit=${LIMIT}&offset=${offset}`);
            const data = await res.json();

            if (data.length === 0) {
                setHasMore(false);
            } else {
                // Adiciona novos mantendo no feed os antigos
                setVideos(prev => {
                    // Prevenir inserções duplicadas caso ocorra glitch na conexão
                    const newIds = new Set(data.map(v => v.id));
                    const filteredPrev = prev.filter(v => !newIds.has(v.id));
                    return [...filteredPrev, ...data];
                });
            }
        } catch (err) {
            console.error('Erro ao buscar vídeos feed infinito:', err);
        } finally {
            setLoading(false);
        }
    }, [offset, hasMore]);

    // Primeira carga ou ao chegar no fim
    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    // Lógica do Infinite Scroll via Intersection Observer na última div
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                // Quando o trigger entra na visão e não estamos gravando
                if (entries[0].isIntersecting && !loading && hasMore) {
                    setOffset(prev => prev + LIMIT); // Adiciona 5 ao offset
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [observerTarget, loading, hasMore]);

    if (videos.length === 0 && !loading) {
        return (
            <div className="empty-state" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <h3 style={{ color: 'var(--color-gray-light)' }}>Nenhum vídeo disponível</h3>
            </div>
        );
    }

    return (
        <div className="tiktok-container">
            {videos.map((video, index) => (
                <TikTokVideo key={video.id} video={video} index={index} />
            ))}

            {/* Elemento invisível que engatilha o próximo load */}
            <div ref={observerTarget} style={{ height: '1px', background: 'transparent' }}>
                {loading && <div className="loading-spinner" style={{ padding: '20px', textAlign: 'center', color: '#fff' }}>Carregando...</div>}
                {!hasMore && videos.length > 0 && <div className="end-message" style={{ padding: '30px', textAlign: 'center', color: 'var(--color-gray-light)' }}>Não há mais vídeos 📺</div>}
            </div>

            <style jsx>{`
                .tiktok-container {
                    height: 100vh;
                    width: 100%;
                    overflow-y: scroll;
                    overflow-x: hidden;
                    scroll-snap-type: y mandatory;
                    background: #000;
                    
                    /* Ocultar barra de rolagem em alguns navegadores */
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
                .tiktok-container::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}
