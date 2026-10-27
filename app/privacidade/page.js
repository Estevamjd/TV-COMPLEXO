import Link from 'next/link';

export const metadata = {
    title: 'Privacidade | TV Complexo',
    description: 'O que a TV Complexo guarda quando você manda uma denúncia ou se inscreve, para que serve, por quanto tempo e como pedir para corrigir ou apagar.',
    alternates: { canonical: '/privacidade' },
    openGraph: {
        url: '/privacidade',
        title: 'Privacidade | TV Complexo',
    },
};

// Lacunas ficam visíveis até o Estevam preencher (PRIVACIDADE.md §5).
function Lacuna({ children }) {
    return <mark className="lacuna">[LACUNA: {children}]</mark>;
}

export default function PrivacidadePage() {
    return (
        <div>
            <div className="page-header">
                <h1>Privacidade na <span className="text-red">TV Complexo</span></h1>
            </div>

            <article className="container privacy-page">
                <p>
                    A TV Complexo é um veículo de comunicação comunitária. Quando você manda uma denúncia ou se
                    inscreve para receber novidades, a gente guarda alguns dados seus. Esta página explica, sem
                    rodeio, o que guardamos, para que serve, por quanto tempo e como você pede para corrigir ou apagar.
                </p>

                <h2>Quem cuida dos seus dados</h2>
                <p>
                    A responsável pelos dados (controladora) é a TV Complexo.{' '}
                    Responsável: Estevam Juliano
                </p>

                <h2>Quais dados a gente coleta</h2>
                <h3>Quando você manda uma denúncia:</h3>
                <ul>
                    <li>
                        Seu nome, <strong>se você quiser</strong>. Não é obrigatório. Se você não preencher ou marcar
                        &quot;publicar anonimamente&quot;, a denúncia aparece como &quot;Anônimo&quot;.
                    </li>
                    <li>A comunidade e o local do problema.</li>
                    <li>O tipo de problema e a descrição que você escreveu.</li>
                    <li>A localização no mapa (latitude e longitude).</li>
                    <li>Foto ou vídeo, se você mandar.</li>
                    <li>A data e a hora do envio.</li>
                </ul>
                <p>A gente <strong>não pede</strong> e-mail nem telefone no formulário de denúncia.</p>

                <h3>Quando você se inscreve para receber novidades (newsletter):</h3>
                <ul>
                    <li>Seu e-mail.</li>
                    <li>O registro de que você concordou em receber nossas mensagens.</li>
                </ul>

                <h2>Para que a gente usa</h2>
                <ul>
                    <li>
                        <strong>Denúncia:</strong> para revisar e, se aprovada, publicar no site e no mapa, para que o
                        problema seja visto e cobrado. A versão pública é revisada e anonimizada.
                    </li>
                    <li>
                        <strong>E-mail da newsletter:</strong> só para mandar novidades da TV Complexo, e só se você
                        marcou que quer receber. Você pode sair quando quiser.{' '}
                        <Lacuna>forma de descadastro (link no e-mail ou pedido pelo contato) e frequência dos envios</Lacuna>
                    </li>
                </ul>
                <p>A gente não vende seus dados.</p>

                <h2>Como funciona a moderação</h2>
                <ul>
                    <li>Toda denúncia nova passa por revisão da equipe antes de aparecer no site. Até lá, ela não fica pública.</li>
                    <li>
                        Na versão pública, nomes de outras pessoas e informações de saúde são retirados. Seu nome aparece
                        só como primeiro nome, e só se você permitir. Se não, aparece &quot;Anônimo&quot;.
                    </li>
                    <li>A equipe pode editar o texto para proteger as pessoas citadas, ou recusar a denúncia.</li>
                    <li>Os dados completos do envio só são vistos pela equipe, na área restrita do site.</li>
                </ul>

                <h2>Um cuidado importante</h2>
                <p>
                    Não escreva na denúncia o nome completo, telefone, endereço ou problema de saúde de outra pessoa.
                    Conte o que aconteceu sem expor ninguém.
                </p>

                <h2>Por quanto tempo a gente guarda</h2>
                <ul>
                    <li>Dados de quem manda denúncia: <Lacuna>prazo de retenção — L6</Lacuna></li>
                    <li>E-mail da newsletter: até você pedir para sair. <Lacuna>confirmar com o Estevam</Lacuna></li>
                </ul>
                <p>Depois desse prazo, os dados são apagados ou anonimizados.</p>

                <h2>Onde os dados ficam</h2>
                <p>
                    Os dados ficam guardados no banco de dados do site, com acesso restrito à equipe.{' '}
                    <Lacuna>confirmar se citar os fornecedores de hospedagem/banco e se há envio de dados para fora do Brasil</Lacuna>
                </p>

                <h2>Seus direitos</h2>
                <p>Pela Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018), você pode pedir para:</p>
                <ul>
                    <li>saber quais dados seus a gente tem;</li>
                    <li>corrigir dado errado;</li>
                    <li>apagar seus dados ou tirar sua denúncia do ar;</li>
                    <li>deixar de receber a newsletter.</li>
                </ul>

                <h2>Como pedir</h2>
                <p>
                    Fale com a gente em:{' '}
                    <Lacuna>contato do titular para pedidos LGPD — L6. Candidato para o Estevam confirmar: contato@tvcomplexo.com.br</Lacuna>
                </p>
                <p>Encarregado de dados (DPO): <Lacuna>nome ou canal do encarregado, se houver</Lacuna></p>
                <p>Prazo de resposta: <Lacuna>prazo de resposta aos pedidos</Lacuna></p>

                <h2>Mudanças nesta página</h2>
                <p>Se a gente mudar a forma de tratar os dados, esta página será atualizada.</p>
                <p>Última atualização: <Lacuna>data de publicação</Lacuna></p>

                <p><em>Este texto não é parecer jurídico.</em></p>

                <p style={{ marginTop: '2rem' }}>
                    <Link href="/denuncias/enviar" className="btn btn-primary">Enviar uma denúncia</Link>
                </p>
            </article>
        </div>
    );
}
