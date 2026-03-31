'use client';

import { useRef, useEffect, useState } from 'react';
import { FaHeart, FaCommentDots, FaShare } from 'react-icons/fa';

export default function TikTokVideo({ video, index }) {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Controle de intersecção - detecta quando o vídeo entra ou sai da tela para dar Autoplay/Pause
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // O elemento está majoritariamente invisível? Pause.
                    if (videoRef.current) {
                        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                    }
                } else {
                    if (videoRef.current) {
                        videoRef.current.pause();
                        videoRef.current.currentTime = 0; // Rewind when out of screen
                        setIsPlaying(false);
                    }
                }
            },
            {
                threshold: 0.6 // Quando 60% do vídeo tiver aparecendo ativamos
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) observer.unobserve(containerRef.current);
        };
    }, []);

    const togglePlay = () => {
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const isSocialIframe = video.plataforma !== 'manual' && video.url_video.includes('http');

    return (
        <div ref={containerRef} className="tiktok-video-wrapper">

            {!isSocialIframe || video.url_video.endsWith('.mp4') ? (
                /* É UM ARQUIVO DE VIDEO COMUM DIRETO .MP4 */
                <video
                    ref={videoRef}
                    onClick={togglePlay}
                    loop
                    playsInline
                    src={video.url_video}
                    poster={video.thumbnail || undefined}
                    className="video-player-element"
                />
            ) : (
                /* SE FOR UMA URL DO YOUTUBE/SOCIAL EMBED (Nós cobrimos o fundo) */
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: video.thumbnail ? `url(${video.thumbnail}) center/cover no-repeat` : '#111',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '2rem' }}>
                        <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>
                            {video.plataforma === 'instagram' ? '📷' : video.plataforma === 'tiktok' ? '🎵' : '▶️'}
                        </span>
                        <h3>Vídeo do {video.plataforma.toUpperCase()}</h3>
                        <a href={video.url_video} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg mt-3">
                            Ver o Vídeo Original ↗
                        </a>
                    </div>
                </div>
            )}

            {/* Overlays do TikTok */}
            <div className="video-info-overlay">
                <h3>@{video.author || 'TV_Complexo'}</h3>
                <p>{video.titulo}</p>
                <div className="music-ticker">
                    🎵 Som original - {video.plataforma}
                </div>
            </div>

            <div className="video-actions-overlay">
                <div className="action-button">
                    <FaHeart size={30} />
                    <span>Curtir</span>
                </div>
                <div className="action-button">
                    <FaCommentDots size={30} />
                    <span>Comentar</span>
                </div>
                <div className="action-button">
                    <a href={video.url_video} target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>
                        <FaShare size={30} />
                    </a>
                    <span>Original</span>
                </div>
            </div>

            <style jsx>{`
                .tiktok-video-wrapper {
                    position: relative;
                    width: 100%;
                    height: 100vh;
                    scroll-snap-align: start; /* Ocultar snap pra ele travar */
                    background: #000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .video-player-element {
                    width: 100%;
                    height: 100%;
                    object-fit: cover; /* Estica igual reels */
                }

                .video-info-overlay {
                    position: absolute;
                    bottom: 2rem;
                    left: 1rem;
                    color: white;
                    z-index: 10;
                    width: calc(100% - 80px); /* Leave room for action buttons */
                    text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
                }

                .video-info-overlay h3 {
                    font-size: 1.1rem;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                }

                .video-info-overlay p {
                    font-size: 0.95rem;
                    line-height: 1.4;
                    margin-bottom: 0.8rem;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .music-ticker {
                    display: inline-block;
                    font-size: 0.9rem;
                    white-space: nowrap;
                    animation: ticker 8s linear infinite;
                }

                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-100%); }
                }

                .video-actions-overlay {
                    position: absolute;
                    bottom: 2rem;
                    right: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    z-index: 10;
                    align-items: center;
                }

                .action-button {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    color: white;
                    cursor: pointer;
                    filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.6));
                    transition: transform 0.2s;
                }

                .action-button:hover {
                    transform: scale(1.1);
                }

                .action-button span {
                    font-size: 0.75rem;
                    margin-top: 5px;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
}
