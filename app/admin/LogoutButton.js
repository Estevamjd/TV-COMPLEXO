'use client';

export default function LogoutButton() {
    const handleLogout = async () => {
        await fetch('/api/auth', { method: 'DELETE' });
        window.location.href = '/admin/login';
    };

    return (
        <button onClick={handleLogout} className="btn btn-primary btn-sm">
            🚪 Sair
        </button>
    );
}
