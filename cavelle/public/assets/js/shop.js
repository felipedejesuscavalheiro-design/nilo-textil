/* CAVELLE — Listagem: Shop, categorias, New In, Sale, Acessórios e busca */
(function () {
  'use strict';
  const { $, CFG, PRODUTOS, card, param, esc, buscar, estoqueTotal, I } = window.CV;

  const TEXTOS = {
    todos: ['Shop', 'Peças que acompanham você no treino, no dia a dia e em todos os momentos.'],
    new: ['New In', 'Os lançamentos mais recentes da CAVELLE.'],
    sale: ['Sale', 'Peças selecionadas com condições especiais, enquanto durar o estoque.'],
    shorts: ['Shorts', 'Leves, confortáveis e com cós que valoriza. Do treino ao passeio.'],
    leggings: ['Leggings', 'Cintura alta, sustentação e caimento impecável.'],
    macacoes: ['Macacões', 'Uma peça, look completo. Do treino ao dia a dia.'],
    blusas: ['Blusas', 'Tops, croppeds e camisetas para compor com tudo.'],
    acessorios: ['Acessórios', 'Os complementos que acompanham a sua rotina.'],
  };

  const q = (param('q') || '').trim();
  let filtro = param('c') || 'todos';
  if (!TEXTOS[filtro]) filtro = 'todos';

  // Cabeçalho da página
  const [titulo, sub] = q ? [`Busca`, `Resultados para “${esc(q)}”`] : TEXTOS[filtro];
  $('[data-titulo]').textContent = titulo;
  $('[data-trilha]').textContent = titulo;
  $('[data-sub]').innerHTML = sub;
  document.title = `${titulo} | CAVELLE`;

  // Foto editorial de cada seção
  // [imagem, enquadramento no computador, enquadramento no celular (faixa baixa: pela cabeça)]
  const FOTOS = {
    todos: ['editorial/ed-duo-preto-marrom-45.jpg', '50% 30%', '50% 4%'],
    new: ['editorial/duo-azul-cinza-45.jpg', '50% 35%', '50% 12%'],
    sale: ['editorial/ed-sentada-45.jpg', '60% 50%', '60% 18%'],
    macacoes: ['editorial/duo-marrom-rosa-45.jpg', '50% 35%', '50% 10%'],
    leggings: ['editorial/duo-leggings-45.jpg', '50% 50%', '50% 12%'],
    shorts: ['produtos/shorts-flow-taupe-1.jpg', '50% 30%', '50% 6%'],
    blusas: ['editorial/camiseta-shake-45.jpg', '50% 30%', '50% 6%'],
    acessorios: ['produtos/bolsa-puffer-off-white-1.jpg', '50% 50%', '50% 55%'],
  };
  const foto = !q && FOTOS[filtro];
  if (foto) {
    const img = $('[data-foto-img]');
    img.src = `assets/img/${foto[0]}`;
    img.style.setProperty('--pos-d', foto[1]);
    img.style.setProperty('--pos-m', foto[2]);
    $('[data-foto-cabeca]').hidden = false;
  } else {
    $('[data-cabeca]').classList.remove('cabeca-pagina--foto');
  }

  // Chips de filtro
  const chips = [['todos', 'Todos'], ['new', 'New In'], ...CFG.categorias.map((c) => [c.id, c.nome]), ['sale', 'Sale']];
  $('[data-chips]').innerHTML = chips.map(([id, nome]) =>
    `<a class="chip${!q && id === filtro ? ' ativo' : ''}" href="shop.html${id === 'todos' ? '' : `?c=${id}`}">${nome}</a>`).join('');

  // Seleção
  let lista = q ? buscar(q)
    : filtro === 'todos' ? PRODUTOS.slice()
    : filtro === 'new' ? PRODUTOS.filter((p) => p.novo)
    : filtro === 'sale' ? PRODUTOS.filter((p) => p.precoDe && p.precoDe > p.preco)
    : PRODUTOS.filter((p) => p.categoria === filtro);

  const ordens = {
    destaque: (a, b) => (estoqueTotal(b) > 0) - (estoqueTotal(a) > 0),
    novos: (a, b) => (!!b.novo - !!a.novo),
    menor: (a, b) => a.preco - b.preco,
    maior: (a, b) => b.preco - a.preco,
    az: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'),
  };

  function desenhar() {
    const ordem = $('[data-ordem]').value;
    const itens = lista.slice().sort(ordens[ordem]);
    $('[data-qtd]').textContent = `${itens.length} ${itens.length === 1 ? 'produto' : 'produtos'}`;
    $('[data-lista]').innerHTML = itens.length ? itens.map(card).join('') : `
      <div class="lista-vazia" style="grid-column:1/-1">
        <p>${q ? 'Não encontramos produtos para essa busca.' : filtro === 'sale' ? 'Nenhuma peça em Sale no momento. Entre no Grupo VIP para saber das próximas condições especiais.' : 'Novas peças chegando em breve.'}</p>
        <a class="btn" href="${filtro === 'sale' ? CFG.grupoVip : 'shop.html'}"${filtro === 'sale' ? ' target="_blank" rel="noopener"' : ''}>${filtro === 'sale' ? 'Entrar no Grupo VIP' : 'Ver todos os produtos'} ${I.seta}</a>
      </div>`;
  }
  $('[data-ordem]').addEventListener('change', desenhar);
  desenhar();
})();
