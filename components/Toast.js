'use client';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    return (
        <ToastContext.Provider value={addToast}>
            {children}
            <div style={{
                position: 'fixed',
                bottom: '1.5rem',
                right: '1.5rem',
                zIndex: 3000,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
            }}>
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        style={{
                            padding: '0.85rem 1.25rem',
                            borderRadius: 'var(--radius-md)',
                            background: toast.type === 'error'
                                ? 'rgba(239,68,68,0.95)'
                                : toast.type === 'warning'
                                    ? 'rgba(251,191,36,0.95)'
                                    : 'rgba(45,212,191,0.95)',
                            color: toast.type === 'warning' ? '#000' : '#fff',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                            animation: 'slideInRight 0.3s ease',
                            maxWidth: '350px',
                        }}
                    >
                        {toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : '✅'} {toast.message}
                    </div>
                ))}
            </div>
            <style jsx global>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        // Fallback: retorna uma função que não faz nada se estiver fora do provider
        return () => {};
    }
    return context;
}
