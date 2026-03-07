'use client';

export default function FilterBar({ filters, activeFilter, onFilterChange }) {
    return (
        <div className="filter-bar">
            {filters.map(filter => (
                <button
                    key={filter.value}
                    className={`filter-chip ${activeFilter === filter.value ? 'active' : ''}`}
                    onClick={() => onFilterChange(filter.value)}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    );
}
