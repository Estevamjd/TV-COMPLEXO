/**
 * Listas de apoio à máscara de nomes (lib/mascara.js). Editáveis.
 *
 * Servem de âncora para achar nomes completos independentemente de caixa
 * ("joão da silva", "JOÃO DA SILVA"). Ficaram de fora nomes que também são
 * palavras comuns ou lugares (Rosa, Luz, Glória, Vitória, Graça, Paz, Cruz,
 * Penha, Ramos), para não mascarar texto que não é nome.
 * Comparação sem acento e sem diferenciar maiúsculas.
 */
export const PRIMEIROS_NOMES = [
    'Maria', 'Ana', 'Francisca', 'Antônia', 'Adriana', 'Juliana', 'Márcia', 'Fernanda', 'Patrícia', 'Aline',
    'Sandra', 'Camila', 'Amanda', 'Bruna', 'Jéssica', 'Letícia', 'Júlia', 'Luciana', 'Vanessa', 'Mariana',
    'Gabriela', 'Vera', 'Beatriz', 'Larissa', 'Cláudia', 'Simone', 'Raimunda', 'Rafaela', 'Daniela', 'Carla',
    'Cristiane', 'Fabiana', 'Tatiane', 'Renata', 'Priscila', 'Joana', 'Josefa', 'Sônia', 'Lúcia', 'Rita',
    'Tereza', 'Teresa', 'Helena', 'Eduarda', 'Isabela', 'Carolina', 'Natália', 'Débora', 'Jaqueline', 'Kelly',
    'Andreia', 'Regina', 'Rosângela', 'Rosana', 'Sueli', 'Solange', 'Denise', 'Elaine', 'Luana', 'Thaís',
    'João', 'José', 'Antônio', 'Francisco', 'Carlos', 'Paulo', 'Pedro', 'Lucas', 'Luiz', 'Luís',
    'Marcos', 'Gabriel', 'Rafael', 'Daniel', 'Marcelo', 'Bruno', 'Eduardo', 'Felipe', 'Raimundo', 'Rodrigo',
    'Manoel', 'Manuel', 'Mateus', 'Matheus', 'André', 'Fernando', 'Fábio', 'Leonardo', 'Gustavo', 'Guilherme',
    'Leandro', 'Tiago', 'Thiago', 'Anderson', 'Ricardo', 'Márcio', 'Jorge', 'Sebastião', 'Alexandre', 'Roberto',
    'Edson', 'Diego', 'Vitor', 'Victor', 'Sérgio', 'Cláudio', 'Júlio', 'Wellington', 'Washington', 'Renato',
    'Joaquim', 'Miguel', 'Arthur', 'Davi', 'Heitor', 'Bernardo', 'Samuel', 'Igor', 'Caio', 'Vinícius',
    'Wagner', 'William', 'Jefferson', 'Everton', 'Adriano', 'Fabrício', 'Rogério', 'Ronaldo', 'Reginaldo',
    'Severino', 'Geraldo', 'Benedito', 'Moisés', 'Elias', 'Josué', 'Ruan', 'Wesley', 'Fulano', 'Fulana',
    'Beltrano', 'Beltrana', 'Ciclano', 'Ciclana',
];

export const SOBRENOMES = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Sousa', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima',
    'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira',
    'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes',
    'Freitas', 'Cardoso', 'Teixeira', 'Cavalcanti', 'Araújo', 'Correia', 'Batista', 'Monteiro', 'Moura', 'Campos',
    'Pinto', 'Reis', 'Barros', 'Fonseca', 'Medeiros', 'Nogueira', 'Xavier', 'Cunha', 'Castro', 'Rezende',
    'Siqueira', 'Azevedo', 'Conceição', 'Farias', 'Figueiredo', 'Melo', 'Mello', 'Guimarães', 'Coelho', 'Macedo',
    'Tavares',
];

// Palavras que nunca contam como parte de nome, mesmo capitalizadas ou em
// CAIXA ALTA (verbos e palavras de ligação frequentes, siglas de serviços).
export const NAO_NOMES = [
    'Foi', 'É', 'Era', 'Está', 'Esta', 'Estava', 'Disse', 'Falou', 'Mora', 'Morava', 'Tem', 'Tinha', 'Não',
    'Que', 'Pra', 'Por', 'Ainda', 'Mesmo', 'Muito', 'Mais', 'Urgente', 'Socorro', 'Ajuda', 'Rua', 'Casa',
    'PM', 'UPP', 'UPA', 'BPM', 'SAMU', 'CRAS', 'CEP', 'SUS',
];
