'use client';
import { ToastProvider } from '@/components/Toast';
import './admin-tema.css';

export default function AdminLayout({ children }) {
    // .admin-tema mantém o painel no tema escuro antigo (admin-tema.css); o site público é urbano (globals.css).
    return <ToastProvider><div className="admin-tema">{children}</div></ToastProvider>;
}
