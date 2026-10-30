'use client';
import dynamic from 'next/dynamic';

// Enquanto o chunk do mapa carrega, reserva a mesma caixa (.map-container tem a altura clamp)
// para a lista abaixo não ser empurrada (CLS).
const MapView = dynamic(() => import('@/components/MapView'), {
    ssr: false,
    loading: () => (
        <div className="mapa-caixa">
            <div className="map-container map-placeholder" aria-hidden="true" />
        </div>
    ),
});

export default function MapWrapper({ denuncias }) {
    return <MapView denuncias={denuncias} />;
}
