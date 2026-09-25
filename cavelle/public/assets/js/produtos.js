/* ============================================================
   CAVELLE — Catálogo de produtos
   ⚠️ Nomes, preços, estoque e composição são EXEMPLOS montados a
   partir das fotos enviadas. Substitua pelos dados reais.

   Campos:
   id          identificador único usado na URL (sem acento/espaço)
   nome        nome exibido
   categoria   shorts | leggings | macacoes | blusas | acessorios
   preco       preço atual (R$)
   precoDe     preço anterior (opcional) → o produto aparece em SALE
   novo        true → aparece em NEW IN
   cores       lista de cores; cada cor tem suas fotos e estoque por tamanho
   ============================================================ */
(function (root) {
  const img = (slug, n) => Array.from({ length: n }, (_, i) => `assets/img/produtos/${slug}-${i + 1}.jpg`);

  const PRODUTOS = [
    {
      id: 'macacao-curve',
      nome: 'Macacão Curve',
      categoria: 'macacoes',
      preco: 299.9,
      novo: true,
      cores: [
        { nome: 'Marrom', hex: '#5A3A28', fotos: img('macacao-curve-marrom', 3), estoque: { P: 4, M: 6, G: 3, GG: 1 } },
        { nome: 'Preto',  hex: '#0F0F0F', fotos: img('macacao-curve-preto', 3),  estoque: { P: 3, M: 5, G: 4, GG: 2 } },
      ],
      descricao: 'Macacão de alças com costas nadador e perna flare. Uma peça única que desenha a silhueta do treino ao café da tarde.',
      detalhes: ['Modelagem flare, alongada', 'Costas nadador', 'Compressão média', 'Toque macio e acetinado'],
      composicao: '80% poliamida, 20% elastano',
    },
    {
      id: 'macaquinho-aura',
      nome: 'Macaquinho Aura',
      categoria: 'macacoes',
      preco: 229.9,
      novo: true,
      cores: [
        { nome: 'Rosa', hex: '#EE9AC0', fotos: img('macaquinho-aura-rosa', 3), estoque: { P: 3, M: 4, G: 3, GG: 1 } },
      ],
      descricao: 'Macaquinho de manga curta com decote nas costas e tira de ajuste. Feminino, confortável e pronto para qualquer momento.',
      detalhes: ['Costas abertas com tira', 'Manga curta', 'Cós alto que modela', 'Não marca'],
      composicao: '80% poliamida, 20% elastano',
    },
    {
      id: 'macaquinho-essence',
      nome: 'Macaquinho Essence',
      categoria: 'macacoes',
      preco: 199.9,
      precoDe: 249.9,
      cores: [
        { nome: 'Preto', hex: '#0F0F0F', fotos: img('macaquinho-essence-preto', 3), estoque: { P: 2, M: 3, G: 2, GG: 0 } },
      ],
      descricao: 'O preto essencial. Macaquinho de alças com recorte limpo, perfeito com camisa aberta, blazer ou sozinho no treino.',
      detalhes: ['Alças finas', 'Decote reto', 'Compressão leve', 'Versátil do treino ao dia a dia'],
      composicao: '80% poliamida, 20% elastano',
    },
    {
      id: 'legging-sculpt',
      nome: 'Legging Sculpt',
      categoria: 'leggings',
      preco: 279.9,
      novo: true,
      cores: [
        { nome: 'Marrom', hex: '#4A3024', fotos: img('legging-sculpt-marrom', 3), estoque: { P: 5, M: 6, G: 4, GG: 2 } },
      ],
      descricao: 'Legging de cintura alta com brilho acetinado e costura que valoriza as curvas. Sustentação para o treino, elegância para o resto do dia.',
      detalhes: ['Cintura alta', 'Tecido com brilho suave', 'Alta compressão', 'Não fica transparente'],
      composicao: '75% poliamida, 25% elastano',
    },
    {
      id: 'calca-flare-prime',
      nome: 'Calça Flare Prime',
      categoria: 'leggings',
      preco: 239.9,
      novo: true,
      cores: [
        { nome: 'Preto', hex: '#0F0F0F', fotos: img('calca-flare-prime-preto', 3), estoque: { P: 4, M: 5, G: 3, GG: 2 } },
      ],
      descricao: 'Calça flare de cós alto, ajustada até o joelho e com abertura elegante na barra. Do pilates ao almoço sem trocar de roupa.',
      detalhes: ['Cós alto e largo', 'Perna flare', 'Compressão média', 'Toque macio'],
      composicao: '80% poliamida, 20% elastano',
    },
    {
      id: 'cropped-fit',
      nome: 'Cropped Fit',
      categoria: 'blusas',
      preco: 149.9,
      precoDe: 179.9,
      cores: [
        { nome: 'Preto', hex: '#0F0F0F', fotos: img('cropped-fit-preto', 3), estoque: { P: 3, M: 4, G: 2, GG: 1 } },
      ],
      descricao: 'Cropped de manga curta com decote arredondado e ajuste ao corpo. Combina com as calças e leggings de cintura alta.',
      detalhes: ['Manga curta', 'Comprimento cropped', 'Com bojo removível', 'Ajuste ao corpo'],
      composicao: '80% poliamida, 20% elastano',
    },
    {
      id: 'top-serena',
      nome: 'Top Serena',
      categoria: 'blusas',
      preco: 129.9,
      cores: [
        { nome: 'Taupe',  hex: '#8A7568', fotos: img('top-serena-taupe', 3),  estoque: { P: 3, M: 4, G: 2, GG: 1 } },
        { nome: 'Marrom', hex: '#4A3024', fotos: img('top-serena-marrom', 2), estoque: { P: 2, M: 3, G: 2, GG: 0 } },
      ],
      descricao: 'Top de alças finas com decote delicado e sustentação média. Leve para o treino, bonito para usar com camisa aberta.',
      detalhes: ['Alças finas', 'Bojo removível', 'Sustentação média', 'Faixa inferior firme'],
      composicao: '80% poliamida, 20% elastano',
    },
    {
      id: 'shorts-flow',
      nome: 'Shorts Flow',
      categoria: 'shorts',
      preco: 169.9,
      novo: true,
      cores: [
        { nome: 'Taupe', hex: '#8A7568', fotos: img('shorts-flow-taupe', 3), estoque: { P: 4, M: 5, G: 3, GG: 2 } },
      ],
      descricao: 'Shorts leve com cós alto bordado CAVELLE e bermuda interna. Movimento livre, sem marcar e sem subir.',
      detalhes: ['Cós alto com logo', 'Bermuda interna', 'Tecido leve e fluido', 'Bolsos laterais'],
      composicao: 'Tecido externo 100% poliéster · forro 85% poliamida, 15% elastano',
    },
    {
      id: 'shorts-breeze',
      nome: 'Shorts Breeze',
      categoria: 'shorts',
      preco: 119.9,
      precoDe: 149.9,
      cores: [
        { nome: 'Cinza', hex: '#77707A', fotos: img('shorts-breeze-cinza', 3), estoque: { P: 3, M: 4, G: 3, GG: 1 } },
      ],
      descricao: 'Shorts de compressão de comprimento médio. O básico que acompanha a camiseta oversized e o treino de todos os dias.',
      detalhes: ['Cintura alta', 'Comprimento médio', 'Não fica transparente', 'Não enrola na perna'],
      composicao: '80% poliamida, 20% elastano',
    },
    {
      id: 'camiseta-oversized',
      nome: 'Camiseta Oversized',
      categoria: 'blusas',
      preco: 159.9,
      novo: true,
      cores: [
        { nome: 'Rosa', hex: '#F2C9CF', fotos: img('camiseta-oversized-rosa', 3), estoque: { P: 4, M: 6, G: 4, GG: 2 } },
      ],
      descricao: 'Camiseta ampla de algodão com logo CAVELLE discreto no peito. Para vestir por cima do look de treino ou com jeans.',
      detalhes: ['Modelagem oversized', 'Ombro caído', 'Logo bordado em tom sobre tom', 'Toque de algodão'],
      composicao: '100% algodão',
    },
    {
      id: 'bolsa-puffer',
      nome: 'Bolsa Puffer',
      categoria: 'acessorios',
      preco: 259.9,
      novo: true,
      tamanhos: ['Único'],
      cores: [
        { nome: 'Off-white', hex: '#F4F0E8', fotos: img('bolsa-puffer-off-white', 3), estoque: { 'Único': 6 } },
      ],
      descricao: 'Bolsa tote acolchoada com logo CAVELLE. Espaçosa para levar o essencial do treino e da rotina, com alças confortáveis no ombro.',
      detalhes: ['Acolchoada e leve', 'Alças de ombro', 'Fechamento em zíper', 'Cabe tênis, garrafa e necessaire'],
      composicao: 'Náilon acolchoado',
    },
  ];

  const TAMANHOS = ['P', 'M', 'G', 'GG'];
  PRODUTOS.forEach((p) => { if (!p.tamanhos) p.tamanhos = TAMANHOS; });

  if (typeof module !== 'undefined' && module.exports) module.exports = PRODUTOS;
  else root.CAVELLE_PRODUTOS = PRODUTOS;
})(typeof self !== 'undefined' ? self : this);
