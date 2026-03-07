'use client';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function MapWrapper({ denuncias }) {
    return <MapView denuncias={denuncias} />;
}
