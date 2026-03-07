# Configuração do n8n para TV Complexo

## Visão Geral

A TV Complexo utiliza o n8n como plataforma de automação para:

1. **Importação automática de vídeos** do Instagram e Facebook
2. **Notificações de denúncias** via email e Telegram

---

## Pré-requisitos

- n8n instalado (self-hosted ou n8n.cloud)
- Acesso às APIs do Instagram/Facebook (Meta Business Suite)
- Conta de email SMTP configurada
- Bot do Telegram criado (via @BotFather)

---

## Fluxo 1 — Importação Automática de Vídeos

### Objetivo
Quando um novo vídeo for publicado no Instagram ou Facebook da TV Complexo, o n8n detecta e envia automaticamente para o site.

### Configuração

#### 1. Trigger: Instagram/Facebook
- Use o nó **"Instagram"** ou **"Facebook Graph API"**
- Configure com as credenciais da Meta Business Suite
- Defina o trigger para monitorar novos posts/vídeos
- Intervalo: a cada 5 minutos (ou use webhook se disponível)

#### 2. Processar dados
- Use um nó **"Set"** para mapear os campos:

```json
{
  "titulo": "{{ $json.caption || 'Novo vídeo da TV Complexo' }}",
  "descricao": "{{ $json.caption }}",
  "url_video": "{{ $json.permalink || $json.media_url }}",
  "thumbnail": "{{ $json.thumbnail_url || '' }}",
  "plataforma": "instagram"
}
```

#### 3. Enviar para o site
- Use um nó **"HTTP Request"**
- Método: `POST`
- URL: `https://seu-dominio.com/api/webhook/videos`
- Body (JSON):

```json
{
  "titulo": "{{ $json.titulo }}",
  "descricao": "{{ $json.descricao }}",
  "url_video": "{{ $json.url_video }}",
  "thumbnail": "{{ $json.thumbnail }}",
  "plataforma": "{{ $json.plataforma }}"
}
```

### Diagrama do Fluxo

```
Instagram/Facebook (Trigger)
        ↓
  Processar Dados (Set)
        ↓
  HTTP Request POST → /api/webhook/videos
        ↓
  Vídeo publicado no site automaticamente
```

---

## Fluxo 2 — Notificação de Denúncias

### Objetivo
Quando uma denúncia for enviada, notificar a equipe via email e Telegram.

### Opção A: Webhook no n8n

#### 1. Configurar Webhook no n8n
- Crie um fluxo com trigger **"Webhook"**
- URL gerada: `https://seu-n8n.com/webhook/denuncias`

#### 2. Modificar a API de denúncias
Adicione ao arquivo `app/api/denuncias/route.js`, no método POST, após salvar no banco:

```javascript
// Enviar notificação para n8n
try {
  await fetch('https://seu-n8n.com/webhook/denuncias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: nome || 'Anônimo',
      comunidade,
      local_problema,
      tipo,
      descricao,
      data: new Date().toISOString()
    }),
  });
} catch (e) {
  console.error('Erro ao notificar n8n:', e);
}
```

#### 3. Enviar Email (nó Email/SMTP)
- Destinatário: `equipe@tvcomplexo.com.br`
- Assunto: `Nova Denúncia: {{ $json.tipo }} em {{ $json.comunidade }}`
- Corpo:

```
Nova denúncia recebida na TV Complexo!

Tipo: {{ $json.tipo }}
Comunidade: {{ $json.comunidade }}
Local: {{ $json.local_problema }}
Descrição: {{ $json.descricao }}
Data: {{ $json.data }}
Nome: {{ $json.nome }}

Acesse o painel para moderar: https://seu-dominio.com/admin/denuncias
```

#### 4. Enviar Telegram (nó Telegram)
- Configure o Bot Token
- Chat ID do grupo da equipe
- Mensagem:

```
🚨 NOVA DENÚNCIA 🚨

📌 Tipo: {{ $json.tipo }}
📍 {{ $json.comunidade }} - {{ $json.local_problema }}
📝 {{ $json.descricao }}
👤 {{ $json.nome }}

🔗 Moderar: https://seu-dominio.com/admin/denuncias
```

### Diagrama do Fluxo

```
Denúncia enviada no site
        ↓
  API salva no banco
        ↓
  Envia webhook para n8n
        ↓
  ┌─────────────┐
  │   n8n        │
  │  ┌─── Email  │
  │  └─── Telegram│
  └─────────────┘
```

---

## Variáveis de Ambiente

Adicione ao `.env.local` do projeto:

```env
# n8n Webhook URLs (opcional)
N8N_WEBHOOK_DENUNCIA=https://seu-n8n.com/webhook/denuncias

# Admin credentials
ADMIN_USER=admin
ADMIN_PASS=tvcomplexo2026
```

---

## Endpoint do Webhook

O site já possui um endpoint pronto para receber vídeos do n8n:

- **URL**: `POST /api/webhook/videos`
- **Campos obrigatórios**: `titulo`, `url_video`
- **Campos opcionais**: `descricao`, `thumbnail`, `plataforma`

### Exemplo de teste com cURL:

```bash
curl -X POST http://localhost:3000/api/webhook/videos \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Novo Vídeo da Comunidade",
    "descricao": "Vídeo importado automaticamente",
    "url_video": "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "plataforma": "instagram"
  }'
```
