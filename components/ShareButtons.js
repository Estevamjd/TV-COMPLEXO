'use client';

export default function ShareButtons({ title, url }) {
    const encodedTitle = encodeURIComponent(title || '');
    const encodedUrl = encodeURIComponent(url || (typeof window !== 'undefined' ? window.location.href : ''));

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url || window.location.href);
            alert('Link copiado!');
        } catch {
            // fallback
        }
    };

    return (
        <div className="share-buttons">
            <a
                href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn share-whatsapp"
            >
                WhatsApp
            </a>
            <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn share-facebook"
            >
                Facebook
            </a>
            <a
                href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn share-twitter"
            >
                Twitter / X
            </a>
            <button className="share-btn share-copy" onClick={handleCopy}>
                Copiar Link
            </button>
        </div>
    );
}
