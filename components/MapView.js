'use client';
import { useEffect, useRef, useState } from 'react';

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

// Sanitize text to prevent XSS in popup HTML
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
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Initialize map once
    useEffect(() => {
        if (!isClient || !mapRef.current || mapInstanceRef.current) return;

        let cancelled = false;

        const initMap = async () => {
            const L = (await import('leaflet')).default;

            // Load Leaflet CSS via link element (more reliable than dynamic import)
            if (!document.querySelector('link[href*="leaflet"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);
            }

            if (cancelled || !mapRef.current) return;

            const map = L.map(mapRef.current).setView([-22.86, -43.265], 13);
            mapInstanceRef.current = map;

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
                maxZoom: 19,
            }).addTo(map);
        };

        initMap();

        return () => {
            cancelled = true;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [isClient]);

    // Update markers when denuncias change
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !isClient) return;

        const updateMarkers = async () => {
            const L = (await import('leaflet')).default;

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

                const safeNome = escapeHtml(d.nome || 'Anônimo');
                const safeTipo = escapeHtml(tipoLabels[d.tipo] || d.tipo);
                const safeComunidade = escapeHtml(d.comunidade);
                const safeLocal = escapeHtml(d.local_problema);
                const safeDescricao = escapeHtml((d.descricao || '').substring(0, 100));

                const marker = L.marker([lat, lng], { icon })
                    .addTo(map)
                    .bindPopup(`
                        <div style="font-family: Inter, sans-serif; min-width: 200px;">
                            <strong style="color: ${color};">${safeTipo}</strong><br/>
                            <span style="font-size: 0.85em;">📍 ${safeComunidade} — ${safeLocal}</span><br/>
                            <p style="font-size: 0.85em; margin: 0.5rem 0;">${safeDescricao}...</p>
                            <span style="font-size: 0.75em; color: #999;">👤 ${safeNome}</span>
                        </div>
                    `);

                markersRef.current.push(marker);
            });
        };

        updateMarkers();
    }, [isClient, denuncias]);

    if (!isClient) {
        return (
            <div className="map-container" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--color-dark)'
            }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return <div ref={mapRef} className="map-container" />;
}
