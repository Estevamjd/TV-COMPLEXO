'use client';
import { useState, useRef } from 'react';

const comunidades = [
    'Complexo do Alemão',
    'Rocinha',
    'Cidade de Deus',
    'Maré',
    'Vidigal',
    'Jacarezinho',
    'Manguinhos',
    'Penha',
    'Outra',
];

// Coordenadas centrais aproximadas de cada comunidade
const comunidadeCoordenadas = {
    'Complexo do Alemão': { lat: -22.8575, lng: -43.2650 },
    'Rocinha': { lat: -22.9880, lng: -43.2480 },
    'Cidade de Deus': { lat: -22.9480, lng: -43.3620 },
    'Maré': { lat: -22.8620, lng: -43.2430 },
    'Vidigal': { lat: -22.9940, lng: -43.2330 },
    'Jacarezinho': { lat: -22.8880, lng: -43.2620 },
    'Manguinhos': { lat: -22.8820, lng: -43.2500 },
    'Penha': { lat: -22.8410, lng: -43.2710 },
};

const tiposProblema = [
    { value: 'falta_de_luz', label: '💡 Falta de Luz' },
    { value: 'lixo_acumulado', label: '🗑️ Lixo Acumulado' },
    { value: 'risco_deslizamento', label: '⛰️ Risco de Deslizamento' },
    { value: 'saneamento', label: '🚰 Saneamento' },
    { value: 'fios_energizados', label: '⚡ Fios Energizados' },
    { value: 'poste_caido', label: '🔌 Poste Caído' },
    { value: 'violencia', label: '🚨 Violência' },
    { value: 'outros', label: '📋 Outros' },
];

export default function EnviarDenunciaPage() {
    const [form, setForm] = useState({
        nome: '',
        comunidade: '',
        local_problema: '',
        tipo: '',
        descricao: '',
    });
    const [coords, setCoords] = useState({ latitude: null, longitude: null });
    const [geoStatus, setGeoStatus] = useState(''); // '', 'loading', 'success', 'error'
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });

        // Auto-definir coordenadas quando selecionar comunidade
        if (name === 'comunidade' && comunidadeCoordenadas[value]) {
            const c = comunidadeCoordenadas[value];
            setCoords({ latitude: c.lat, longitude: c.lng });
        }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setGeoStatus('error');
            return;
        }
        setGeoStatus('loading');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setGeoStatus('success');
            },
            () => {
                setGeoStatus('error');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
        if (!allowedTypes.includes(file.type)) {
            setError('Tipo de arquivo não permitido. Use: JPG, PNG, GIF, WEBP, MP4, WEBM');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            setError('Arquivo muito grande. Máximo: 50MB');
            return;
        }

        setSelectedFile(file);
        setError('');

        // Preview
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview({ type: 'image', url: e.target.result });
            reader.readAsDataURL(file);
        } else {
            setFilePreview({ type: 'video', name: file.name });
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let midiaUrl = '';

            // Upload file first if selected
            if (selectedFile) {
                setUploading(true);
                const formData = new FormData();
                formData.append('file', selectedFile);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    setError(uploadData.error || 'Erro ao enviar arquivo');
                    setLoading(false);
                    setUploading(false);
                    return;
                }

                const uploadData = await uploadRes.json();
                midiaUrl = uploadData.url;
                setUploading(false);
            }

            // Submit denúncia com coordenadas
            const res = await fetch('/api/denuncias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    midia: midiaUrl,
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                }),
            });

            if (res.ok) {
                setSuccess(true);
                setForm({ nome: '', comunidade: '', local_problema: '', tipo: '', descricao: '' });
                setCoords({ latitude: null, longitude: null });
                setGeoStatus('');
                setSelectedFile(null);
                setFilePreview(null);
            } else {
                const data = await res.json();
                setError(data.error || 'Erro ao enviar denúncia');
            }
        } catch (err) {
            setError('Erro de conexão. Tente novamente.');
        }

        setLoading(false);
    };

    if (success) {
        return (
            <div>
                <div className="page-header" style={{ minHeight: '60vh' }}>
                    <div style={{
                        background: 'rgba(42,157,143,0.1)',
                        border: '2px solid var(--color-green)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '3rem',
                        maxWidth: '600px',
                        margin: '0 auto',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                        <h1 style={{ fontSize: '2rem', color: 'var(--color-green)', marginBottom: '1rem' }}>
                            Denúncia Enviada!
                        </h1>
                        <p style={{ color: 'var(--color-gray-light)', fontSize: '1.1rem', lineHeight: 1.7 }}>
                            Sua denúncia foi recebida com sucesso. Nossa equipe irá analisar e,
                            após aprovação, ela será publicada no site.
                        </p>
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: '1.5rem' }}
                            onClick={() => setSuccess(false)}
                        >
                            📢 Enviar Outra Denúncia
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1>📢 <span className="text-red">Enviar Denúncia</span></h1>
                <p>Relate problemas da sua comunidade. Sua identidade pode ser preservada.</p>
            </div>

            <div className="container" style={{ maxWidth: '700px' }}>
                <div style={{
                    background: 'var(--color-black-light)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '2rem',
                    border: '1px solid var(--color-dark-gray)',
                }}>
                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.15)',
                            border: '1px solid #ef4444',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            color: '#ef4444',
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem'
                        }}>
                            ❌ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Nome (opcional)</label>
                            <input
                                type="text"
                                name="nome"
                                className="form-input"
                                placeholder="Seu nome ou deixe em branco para denúncia anônima"
                                value={form.nome}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Comunidade *</label>
                            <select
                                name="comunidade"
                                className="form-select"
                                value={form.comunidade}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Selecione a comunidade</option>
                                {comunidades.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Local do problema *</label>
                            <input
                                type="text"
                                name="local_problema"
                                className="form-input"
                                placeholder="Ex: Rua Principal, próximo ao mercado"
                                value={form.local_problema}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Geolocalização */}
                        <div className="form-group">
                            <label className="form-label">Localização no mapa</label>
                            <div style={{
                                display: 'flex',
                                gap: '0.75rem',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                            }}>
                                <button
                                    type="button"
                                    className="btn btn-sm"
                                    style={{
                                        background: 'var(--color-dark-gray)',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                    }}
                                    onClick={handleGetLocation}
                                    disabled={geoStatus === 'loading'}
                                >
                                    {geoStatus === 'loading' ? '⏳ Obtendo...' : '📍 Usar minha localização'}
                                </button>
                                {coords.latitude && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-green)' }}>
                                        ✅ Localização definida
                                    </span>
                                )}
                                {geoStatus === 'error' && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-light)' }}>
                                        Usando localização da comunidade selecionada
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-medium)', marginTop: '0.5rem' }}>
                                A localização ajuda a posicionar sua denúncia no mapa. Se não permitir, usaremos a localização da comunidade.
                            </p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Tipo de problema *</label>
                            <select
                                name="tipo"
                                className="form-select"
                                value={form.tipo}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Selecione o tipo</option>
                                {tiposProblema.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Descrição detalhada *</label>
                            <textarea
                                name="descricao"
                                className="form-textarea"
                                placeholder="Descreva o problema em detalhes. Quando começou, como afeta os moradores, etc."
                                value={form.descricao}
                                onChange={handleChange}
                                required
                                style={{ minHeight: '150px' }}
                            />
                        </div>

                        {/* Upload de Mídia */}
                        <div className="form-group">
                            <label className="form-label">📎 Anexar Foto ou Vídeo (opcional)</label>
                            <div style={{
                                border: '2px dashed var(--color-dark-gray)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1.5rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                background: selectedFile ? 'rgba(56,189,248,0.05)' : 'transparent',
                                borderColor: selectedFile ? 'var(--color-red)' : 'var(--color-dark-gray)',
                            }}
                                onClick={() => !selectedFile && fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />

                                {!selectedFile ? (
                                    <>
                                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.5 }}>📷 🎥</div>
                                        <p style={{ color: 'var(--color-gray-light)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                            Clique para selecionar uma foto ou vídeo
                                        </p>
                                        <p style={{ color: 'var(--color-gray-medium)', fontSize: '0.75rem' }}>
                                            Formatos: JPG, PNG, GIF, WEBP, MP4, WEBM · Máx: 50MB
                                        </p>
                                    </>
                                ) : (
                                    <div>
                                        {filePreview?.type === 'image' ? (
                                            <img
                                                src={filePreview.url}
                                                alt="Preview"
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '200px',
                                                    borderRadius: 'var(--radius-md)',
                                                    marginBottom: '0.75rem',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                fontSize: '3rem',
                                                marginBottom: '0.5rem',
                                            }}>🎥</div>
                                        )}
                                        <p style={{ color: 'var(--color-white)', fontSize: '0.9rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                                            {selectedFile.name}
                                        </p>
                                        <p style={{ color: 'var(--color-gray-light)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                                            {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                                        </p>
                                        <button
                                            type="button"
                                            className="btn btn-sm"
                                            style={{
                                                background: 'rgba(239,68,68,0.2)',
                                                color: '#ef4444',
                                                border: '1px solid rgba(239,68,68,0.3)',
                                            }}
                                            onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                        >
                                            🗑 Remover Arquivo
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(56,189,248,0.08)',
                            border: '1px solid rgba(56,189,248,0.25)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            marginBottom: '1.5rem',
                            fontSize: '0.85rem',
                            color: 'var(--color-yellow)',
                        }}>
                            ℹ️ Sua denúncia passará por moderação antes de ser publicada.
                            Se preferir permanecer anônimo, não preencha o campo de nome.
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%' }}
                            disabled={loading}
                        >
                            {uploading ? '📤 Enviando arquivo...' : loading ? '⏳ Enviando...' : '📢 Enviar Denúncia'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
