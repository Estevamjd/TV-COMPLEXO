'use client';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import PrivacyLink from '@/components/PrivacyLink';
import { TIPOS_DENUNCIA } from '@/lib/tipos';
import { COMUNIDADES, COMUNIDADE_OUTRA, COMUNIDADE_MAX_LENGTH, coordenadasDaComunidade } from '@/lib/comunidades';

const tiposProblema = TIPOS_DENUNCIA;

export default function EnviarDenunciaPage() {
    const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            nome: '',
            comunidade: '',
            local_problema: '',
            tipo: '',
            descricao: '',
            comunidade_outra: '',
            anonimo: true,
        },
    });

    const [coords, setCoords] = useState({ latitude: null, longitude: null });
    const [geoStatus, setGeoStatus] = useState('');
    const [success, setSuccess] = useState(false);
    const [serverError, setServerError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const watchComunidade = watch('comunidade');
    const watchAnonimo = watch('anonimo');

    const handleComunidadeChange = (e) => {
        const value = e.target.value;
        setValue('comunidade', value, { shouldValidate: true });
        const c = coordenadasDaComunidade(value);
        if (c && geoStatus !== 'success') {
            setCoords({ latitude: c.lat, longitude: c.lng });
        } else if (!c && geoStatus !== 'success') {
            setCoords({ latitude: null, longitude: null });
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
            () => setGeoStatus('error'),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
        if (!allowedTypes.includes(file.type)) {
            setServerError('Tipo de arquivo não permitido. Use: JPG, PNG, GIF, WEBP, MP4, WEBM');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            setServerError('Arquivo muito grande. Máximo: 50MB');
            return;
        }

        setSelectedFile(file);
        setServerError('');

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

    const onSubmit = async (data) => {
        setServerError('');

        try {
            let midiaUrl = '';

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
                    setServerError(uploadData.error || 'Erro ao enviar arquivo');
                    setUploading(false);
                    return;
                }

                const uploadData = await uploadRes.json();
                midiaUrl = uploadData.url;
                setUploading(false);
            }

            const { comunidade_outra, anonimo, ...campos } = data;
            const comunidade = campos.comunidade === COMUNIDADE_OUTRA ? comunidade_outra.trim() : campos.comunidade;

            const res = await fetch('/api/denuncias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...campos,
                    comunidade,
                    publicar_nome: !anonimo,
                    midia: midiaUrl,
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                }),
            });

            if (res.ok) {
                setSuccess(true);
                reset();
                setCoords({ latitude: null, longitude: null });
                setGeoStatus('');
                setSelectedFile(null);
                setFilePreview(null);
            } else {
                const resData = await res.json();
                setServerError(resData.error || 'Erro ao enviar denúncia');
            }
        } catch {
            setServerError('Erro de conexão. Tente novamente.');
        }
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
                        <h1 style={{ fontSize: '2rem', color: 'var(--color-green)', marginBottom: '1rem' }}>
                            Denúncia recebida
                        </h1>
                        <p role="status" style={{ color: 'var(--color-gray-light)', fontSize: '1.1rem', lineHeight: 1.7 }}>
                            Recebida. Vai ao ar depois da revisão.
                        </p>
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: '1.5rem' }}
                            onClick={() => setSuccess(false)}
                        >
                            Enviar Outra Denúncia
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1><span className="text-red">Enviar Denúncia</span></h1>
                <p>Relate problemas da sua comunidade. Por padrão, sua denúncia é publicada como anônima.</p>
            </div>

            <div className="container" style={{ maxWidth: '700px' }}>
                <div style={{
                    background: 'var(--color-black-light)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '2rem',
                    border: '1px solid var(--color-dark-gray)',
                }}>
                    {serverError && (
                        <div style={{
                            background: 'rgba(239,68,68,0.15)',
                            border: '1px solid #ef4444',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            color: '#ef4444',
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem'
                        }}>
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="denuncia-nome">Nome (opcional)</label>
                            <input
                                id="denuncia-nome"
                                type="text"
                                className="form-input"
                                autoComplete="given-name"
                                aria-describedby="denuncia-nome-ajuda"
                                placeholder="Seu nome ou deixe em branco"
                                {...register('nome', { maxLength: { value: 200, message: 'Máximo 200 caracteres' } })}
                            />
                            <p id="denuncia-nome-ajuda" className="form-help">
                                Opcional. Se preencher, só o primeiro nome pode aparecer.
                            </p>
                            {errors.nome && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.nome.message}</span>}
                        </div>

                        <div className="form-group">
                            <div className="form-check">
                                <input
                                    id="denuncia-anonimo"
                                    type="checkbox"
                                    aria-describedby="denuncia-anonimo-ajuda"
                                    {...register('anonimo')}
                                />
                                <label htmlFor="denuncia-anonimo">Publicar anonimamente</label>
                            </div>
                            <p id="denuncia-anonimo-ajuda" className="form-help">
                                {watchAnonimo
                                    ? 'A denúncia aparece como "Anônimo".'
                                    : 'Você autoriza mostrar só o seu primeiro nome na denúncia publicada.'}
                            </p>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="denuncia-comunidade">Comunidade *</label>
                            <select
                                id="denuncia-comunidade"
                                className="form-select"
                                {...register('comunidade', { required: 'Selecione a comunidade' })}
                                onChange={handleComunidadeChange}
                            >
                                <option value="">Selecione a comunidade</option>
                                {COMUNIDADES.map(c => (
                                    <option key={c.nome} value={c.nome}>{c.nome}</option>
                                ))}
                                <option value={COMUNIDADE_OUTRA}>Outra</option>
                            </select>
                            {errors.comunidade && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.comunidade.message}</span>}
                        </div>

                        {watchComunidade === COMUNIDADE_OUTRA && (
                            <div className="form-group">
                                <label className="form-label" htmlFor="denuncia-comunidade-outra">Qual comunidade? *</label>
                                <input
                                    id="denuncia-comunidade-outra"
                                    type="text"
                                    className="form-input"
                                    placeholder="Nome da comunidade"
                                    {...register('comunidade_outra', {
                                        validate: (v) => (watchComunidade !== COMUNIDADE_OUTRA || v.trim().length > 0) || 'Informe a comunidade',
                                        maxLength: { value: COMUNIDADE_MAX_LENGTH, message: `Máximo ${COMUNIDADE_MAX_LENGTH} caracteres` },
                                    })}
                                />
                                {errors.comunidade_outra && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.comunidade_outra.message}</span>}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label" htmlFor="denuncia-local">Local do problema *</label>
                            <input
                                id="denuncia-local"
                                type="text"
                                className="form-input"
                                placeholder="Ex: Rua Principal, próximo ao mercado"
                                {...register('local_problema', {
                                    required: 'Local é obrigatório',
                                    maxLength: { value: 500, message: 'Máximo 500 caracteres' },
                                })}
                            />
                            {errors.local_problema && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.local_problema.message}</span>}
                        </div>

                        {/* Geolocalização */}
                        <div className="form-group">
                            <span className="form-label" id="denuncia-geo-label">Localização no mapa</span>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="btn btn-sm"
                                    style={{
                                        background: 'var(--color-dark-gray)',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                    }}
                                    onClick={handleGetLocation}
                                    aria-describedby="denuncia-geo-label"
                                    disabled={geoStatus === 'loading'}
                                >
                                    {geoStatus === 'loading' ? 'Obtendo...' : 'Usar minha localização'}
                                </button>
                                {coords.latitude && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-green)' }}>
                                        Localização definida
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
                            <label className="form-label" htmlFor="denuncia-tipo">Tipo de problema *</label>
                            <select
                                id="denuncia-tipo"
                                className="form-select"
                                {...register('tipo', { required: 'Selecione o tipo de problema' })}
                            >
                                <option value="">Selecione o tipo</option>
                                {tiposProblema.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            {errors.tipo && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.tipo.message}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="denuncia-descricao">Descrição detalhada *</label>
                            <p id="denuncia-descricao-aviso" className="form-notice">
                                Não cite nome nem problema de saúde de outras pessoas. <PrivacyLink />
                            </p>
                            <textarea
                                id="denuncia-descricao"
                                aria-describedby="denuncia-descricao-aviso"
                                className="form-textarea"
                                placeholder="Descreva o problema em detalhes. Quando começou, como afeta os moradores, etc."
                                style={{ minHeight: '150px' }}
                                {...register('descricao', {
                                    required: 'Descrição é obrigatória',
                                    maxLength: { value: 5000, message: 'Máximo 5000 caracteres' },
                                })}
                            />
                            {errors.descricao && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.descricao.message}</span>}
                        </div>

                        {/* Upload de Mídia */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="denuncia-midia">Anexar Foto ou Vídeo (opcional)</label>
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
                                    id="denuncia-midia"
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />

                                {!selectedFile ? (
                                    <>
                                        <p style={{ color: 'var(--color-gray-light)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                            Clique para selecionar uma foto ou vídeo
                                        </p>
                                        <p style={{ color: 'var(--color-gray-medium)', fontSize: '0.75rem' }}>
                                            Formatos: JPG, PNG, GIF, WEBP, MP4, WEBM - Máx: 50MB
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
                                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎥</div>
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
                                            Remover Arquivo
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
                            Sua denúncia passa pela revisão da equipe antes de ir ao ar. Não escreva nome,
                            telefone ou problema de saúde de outra pessoa.{' '}
                            <PrivacyLink>Saiba como cuidamos dos seus dados</PrivacyLink>.
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%' }}
                            disabled={isSubmitting}
                        >
                            {uploading ? 'Enviando arquivo...' : isSubmitting ? 'Enviando...' : 'Enviar Denúncia'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
