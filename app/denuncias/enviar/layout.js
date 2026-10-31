import { metadataDaPagina } from '@/lib/site';

// A página é client component (formulário); a metadata fica aqui.
export const metadata = metadataDaPagina({
    titulo: 'Enviar denúncia | TV Complexo',
    descricao: 'Denuncie um problema na sua comunidade, com foto e local no mapa. Pode ser anônimo e não pedimos e-mail nem telefone.',
    caminho: '/denuncias/enviar',
});

export default function EnviarDenunciaLayout({ children }) {
    return children;
}
