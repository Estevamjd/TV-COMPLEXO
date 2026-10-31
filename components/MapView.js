'use client';
import { suavizarPlaceholders } from '@/lib/exibicao';
import { useEffect, useRef, useState } from 'react';
// CSS do Leaflet junto do chunk do mapa: os controles já nascem posicionados (sem salto).
import 'leaflet/dist/leaflet.css';

const tipoColors = {
    falta_de_luz: '#f4a261',
    lixo_acumulado: '#e76f51',
    risco_deslizamento: '#e63946',
    saneamento: '#2a9d8f',
    fios_energizados: '#f9c74f',
    poste_caido: '#999999',
    violencia: '#c1121f',
    outros: '#666666',
};

const tipoLabels = {
    falta_de_luz: 'Falta de Luz',
    lixo_acumulado: 'Lixo Acumulado',
    risco_deslizamento: 'Risco de Deslizamento',
    saneamento: 'Saneamento',
    fios_energizados: 'Fios Energizados',
    poste_caido: 'Poste Caído',
    violencia: 'Violência',
    outros: 'Outros',
};

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export default function MapView({ denuncias = [] }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const leafletRef = useRef(null);
    const [mapReady, setMapReady] = useState(false);
    // Celular/tablet: o mapa começa travado (o dedo rola a página) e destrava num botão.
    const [toque, setToque] = useState(false);
    const [destravado, setDestravado] = useState(false);

    // Initialize map once
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        let cancelled = false;

        const initMap = async () => {
            const L = (await import('leaflet')).default;
            leafletRef.current = L;

            if (!document.getElementById('tvc-tiles-style')) {
                const style = document.createElement('style');
                style.id = 'tvc-tiles-style';
                style.textContent = '.tvc-tiles{filter:grayscale(100%) contrast(105%);}';
                document.head.appendChild(style);
            }

            if (cancelled || !mapRef.current) return;

            const ehToque = window.matchMedia('(pointer: coarse)').matches;
            // Roda do mouse não dá zoom (rolar a página passa por cima do mapa);
            // no toque, arrastar e pinçar só depois de destravar.
            const map = L.map(mapRef.current, {
                scrollWheelZoom: false,
                dragging: !ehToque,
                touchZoom: !ehToque,
                tap: false,
            }).setView([-22.86, -43.265], 13);
            mapInstanceRef.current = map;
            setToque(ehToque);

            // Tiles do OpenStreetMap (gratuitos, sem chave de API). Os tiles da CARTO
            // passaram a exigir chave e exibiam "API KEY REQUIRED".
            // Tiles em cinza (filtro CSS em .tvc-tiles, acima) para os marcadores coloridos se destacarem.
            // Cada tile é desenhado num <canvas> (mesma imagem, mesmo visual): <img> de tile
            // virava o LCP da página e o LCP ficava esperando o servidor de tiles.
            const CanvasTiles = L.TileLayer.extend({
                createTile(coords, done) {
                    const tile = document.createElement('canvas');
                    const size = this.getTileSize();
                    tile.width = size.x;
                    tile.height = size.y;
                    const img = new Image();
                    img.decoding = 'async';
                    img.onload = () => {
                        tile.getContext('2d').drawImage(img, 0, 0, size.x, size.y);
                        done(null, tile);
                    };
                    img.onerror = (e) => done(e, tile);
                    img.src = this.getTileUrl(coords);
                    return tile;
                },
                // O abort do TileLayer mexe em img.src/complete; com canvas, o GridLayer já poda os tiles.
                _abortLoading() {},
            });
            new CanvasTiles('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
                className: 'tvc-tiles',
            }).addTo(map);

            setMapReady(true);
        };

        initMap();

        return () => {
            cancelled = true;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Trava/destrava os gestos no toque (sem as classes leaflet-touch-*, o dedo rola a página)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !toque) return;
        const acao = destravado ? 'enable' : 'disable';
        map.dragging[acao]();
        map.touchZoom[acao]();
    }, [toque, destravado, mapReady]);

    // Update markers when map is ready OR denuncias change
    useEffect(() => {
        const map = mapInstanceRef.current;
        const L = leafletRef.current;
        if (!map || !L || !mapReady) return;

        // Remove existing markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        denuncias.forEach(d => {
            const lat = parseFloat(d.latitude);
            const lng = parseFloat(d.longitude);
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

            const color = tipoColors[d.tipo] || '#999';
            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                    width: 24px; height: 24px;
                    background: ${color};
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
                "></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
            });

            const safeNome = escapeHtml(d.autor || 'Anônimo');
            const safeTipo = escapeHtml(tipoLabels[d.tipo] || d.tipo);
            const safeComunidade = escapeHtml(suavizarPlaceholders(d.comunidade));
            const safeLocal = escapeHtml(suavizarPlaceholders(d.local_problema));
            const descricao = suavizarPlaceholders(d.descricao);
            const safeDescricao = escapeHtml(descricao.substring(0, 100));

            const marker = L.marker([lat, lng], { icon })
                .addTo(map)
                .bindPopup(`
                    <div style="font-family: var(--f-body); min-width: 200px; color: #111;">
                        <strong style="font-family: var(--f-heading); font-weight: 400;">${safeTipo}</strong><br/>
                        <span style="font-size: 0.85em;">${safeComunidade} — ${safeLocal}</span><br/>
                        <p style="font-size: 0.85em; margin: 0.5rem 0;">${safeDescricao}${descricao.length > 100 ? '...' : ''}</p>
                        <span style="font-size: 0.8em; font-family: var(--f-mono);">${safeNome}</span>
                    </div>
                `);

            markersRef.current.push(marker);
        });
    }, [mapReady, denuncias]);

    return (
        <div className="mapa-caixa">
            <div ref={mapRef} className="map-container" role="region" aria-label="Mapa dos problemas reportados" />
            {toque && (
                <button type="button" className="mapa-trava" aria-pressed={destravado} onClick={() => setDestravado(v => !v)}>
                    {destravado ? 'Travar o mapa' : 'Mexer no mapa'}
                </button>
            )}
        </div>
    );
}
