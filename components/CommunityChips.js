'use client';
import { useState } from 'react';

const communities = [
    { id: 'todos', label: 'Todos', emoji: '📍' },
    { id: 'alemao', label: 'Alemão', emoji: '🏔️' },
    { id: 'penha', label: 'Penha', emoji: '🏘️' },
    { id: 'mare', label: 'Maré', emoji: '🌊' },
    { id: 'cdd', label: 'Cidade de Deus', emoji: '🏠' },
    { id: 'rocinha', label: 'Rocinha', emoji: '⛰️' },
    { id: 'vidigal', label: 'Vidigal', emoji: '🌅' },
];

export default function CommunityChips() {
    const [active, setActive] = useState('todos');

    return (
        <div className="community-chips-wrapper">
            <div className="community-chips">
                {communities.map(c => (
                    <button
                        key={c.id}
                        className={`community-chip ${active === c.id ? 'active' : ''}`}
                        onClick={() => setActive(c.id)}
                    >
                        <span>{c.emoji}</span> {c.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
