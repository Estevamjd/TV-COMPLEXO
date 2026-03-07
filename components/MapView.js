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
    falta_de_luz: '💡 Falta de Luz',
    lixo_acumulado: '🗑️ Lixo Acumulado',
    risco_deslizamento: '⛰️ Risco de Deslizamento',
    saneamento: '🚰 Saneamento',
    fios_energizados: '⚡ Fios Energizados',
    poste_caido: '🔌 Poste Caído',
    violencia: '🚨 Violência',
    outros: '📋 Outros',
};

export default function MapView({ denuncias = [] }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient || !mapRef.current || mapInstanceRef.current) return;

        const loadMap = async () => {
            const L = (await import('leaflet')).default;
            await import('leaflet/dist/leaflet.css');

            const map = L.map(mapRef.current).setView([-22.86, -43.265], 13);
            mapInstanceRef.current = map;

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap contributors © CARTO',
                maxZoom: 19,
            }).addTo(map);

            denuncias.forEach(d => {
                if (d.latitude && d.longitude) {
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

                    L.marker([d.latitude, d.longitude], { icon })
                        .addTo(map)
                        .bindPopup(`
              <div style="font-family: Inter, sans-serif; min-width: 200px;">
                <strong style="color: ${color};">${tipoLabels[d.tipo] || d.tipo}</strong><br/>
                <span style="font-size: 0.85em;">📍 ${d.comunidade} — ${d.local_problema}</span><br/>
                <p style="font-size: 0.85em; margin: 0.5rem 0;">${d.descricao.substring(0, 100)}...</p>
                <span style="font-size: 0.75em; color: #999;">👤 ${d.nome || 'Anônimo'}</span>
              </div>
            `);
                }
            });
        };

        loadMap();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
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
