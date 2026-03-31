'use client';
import { ToastProvider } from '@/components/Toast';

export default function AdminLayout({ children }) {
    return <ToastProvider>{children}</ToastProvider>;
}
