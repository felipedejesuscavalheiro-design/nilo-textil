# PROMPT: subir o site CAVELLE no tema da Nuvemshop (via FTP)

> **Como usar:** abra um chat novo com o Claude que controla o seu computador, anexe (ou deixe na Área de Trabalho) a pasta `site-cavelle-ftp` descompactada e cole **todo** o texto abaixo da linha.
> Tenha em mãos: login do painel da Nuvemshop e os dados de FTP (quem digita é **você**, nunca no chat).

---

Você vai me ajudar a colocar no ar, na minha loja Nuvemshop (**usecavelle.com.br**), o novo visual da marca **CAVELLE**, que já foi construído e aprovado como site de referência. Você vai **converter** esse site para dentro do **tema da Nuvemshop**, editando os arquivos do tema por **FTP**.

Os produtos já estão cadastrados na loja. Não crie, edite nem apague produtos.

## 1. O que você recebeu

Na pasta `site-cavelle-ftp/`:

| Pasta / arquivo | O que é |
|---|---|
| `site-referencia/` | O site pronto (HTML, CSS e JS). É o **modelo visual e de textos**. Abra `site-referencia/index.html` no navegador para ver. |
| `site-referencia/assets/css/style.css` | Todo o visual: cores, tipografia, espaçamentos, efeitos, mobile. |
| `site-referencia/assets/js/` | Carrossel, efeitos, menu. `app.js` monta o cabeçalho, o menu e o rodapé; `config.js` tem os contatos e as regras. |
| `site-referencia/assets/img/` | Banners, fotos editoriais, categorias, Instagram, logos. A subpasta `produtos/` é só do protótipo: **não enviar**. |
| `site-referencia/assets/fonts/` | Fontes (Cormorant Garamond e Poppins, licença livre). |
| `site-referencia/*.html` | Páginas: home, shop, produto, quem-somos, suporte, envio, trocas, pagamento, termos, privacidade. |
| `kit-tema/` | Kit já adaptado ao tema (seções `cvl-*` em Twig, CSS e imagens) com `LEIA-ME.md`. **Comece por ele.** |
| `TEXTOS.md` | Todos os textos oficiais (banners, Quem Somos, etc.). |
| `banners/` | Banners exportados em 1920×800 (desktop) e 1080×1440 (celular). |

Não existe outra fonte de verdade: use **só** esses textos, cores, links e imagens. Não invente conteúdo.

## 2. Regras de segurança (obrigatórias)

1. **Senhas:** nunca peça, digite, leia em voz alta, copie, salve em arquivo nem escreva no chat nenhuma senha (Nuvemshop, FTP, e-mail). Quando precisar de login, **pare e me chame**; eu digito. Se usar script, leia as credenciais de variáveis de ambiente (`FTP_HOST`, `FTP_USUARIO`, `FTP_SENHA`) que **eu** crio, e nunca imprima os valores.
2. **Backup antes de tudo:** nenhum arquivo do tema é alterado antes de existir uma cópia completa, conferida, do tema atual (Etapa 1).
3. **Não mexa** em: produtos, estoque, preços, pedidos, clientes, meios de pagamento, frete, domínio, DNS, e-mails, aplicativos, cupons, plano, dados fiscais. Se algo precisar mudar nessas áreas, **anote e me pergunte** no fim.
4. **Não apague** arquivos do tema. Para "remover" uma seção, comente o trecho (`{# ... #}`) e registre no relatório.
5. **Tudo novo com prefixo `cvl-`** (classes CSS, snipplets, imagens, JS) para não colidir com o código atual (`cav-`) nem com o tema.
6. **Passo pequeno, teste, próximo passo.** Após cada envio por FTP, recarregue a loja (desktop e celular). Se quebrar algo, **volte o arquivo do backup imediatamente** e me avise.
7. **Na dúvida, pare e pergunte.** Nunca "adivinhe" uma configuração do painel.
8. Não aceite termos, não contrate nada, não instale apps e não troque de tema sem eu confirmar.

## 3. O que NÃO vai para a Nuvemshop (a própria plataforma já faz)

O site de referência tem partes que só existiam para o protótipo. **Não tente copiar:**

- `checkout.html`, `checkout.js`, `regras.js`, `produtos.js` → carrinho, checkout, cupons, cálculo de frete e pagamentos são **nativos** da Nuvemshop.
- `admin.html`, `conta.html`, `server.js`, pasta `api/` → pedidos, painel e "minha conta" são nativos.
- Os 14 produtos de exemplo do protótipo → a loja usa os **produtos reais** já cadastrados.
- Aviso de cookies / GA4 / Pixel → só se o tema não tiver; os códigos de medição ficam no painel (Preferências de marketing), não no tema.

O que vai: **visual, estrutura das páginas, textos, imagens, fontes e efeitos.**

## 4. Mapa: site de referência → tema da Nuvemshop

| Site de referência | Onde entra no tema |
|---|---|
| Faixa superior rolando, cabeçalho fixo, menu com mega menu "Shop", busca, rodapé, botão fixo do WhatsApp | `layouts/layout.tpl` e os snipplets de header/footer do tema |
| `index.html` (carrossel de 4 banners, benefícios, 4 categorias em círculo, New In, bloco zoom, lifestyle, Instagram, Grupo VIP) | `templates/home.tpl` + snipplets `cvl-*` (o kit já traz parte) |
| `shop.html` (cabeçalho com foto por categoria, filtros, grade de cards) | `templates/category.tpl` e `templates/search.tpl` |
| Card de produto (preço, **2x sem juros**, **preço no Pix**) | snipplet de item de produto do tema (ex.: `snipplets/grid/item.tpl`; confira o nome real) |
| `produto.html` (galeria, cores, tamanhos, guia de medidas, relacionados) | `templates/product.tpl` + snipplets de produto |
| "Sale" | categoria/listagem de produtos em promoção (link do menu) |
| `quem-somos.html`, `suporte.html`, `envio.html`, `politica-de-troca.html`, `formas-de-pagamento.html`, `termos.html`, `privacidade.html` | **Páginas** do painel (conteúdo) + `templates/page.tpl` (visual) |
| `404.html` | `templates/404.tpl` |
| `style.css` | novo arquivo `static/css/cvl-site.css` carregado **depois** do CSS do tema |
| `efeitos.js`, carrossel de `home.js` | novo `static/js/cvl-site.js` (só a parte visual; sem carrinho) |
| `assets/fonts/*` | `static/fonts/` (ou a pasta de estáticos que o tema usa) |
| `assets/img/*` (menos `produtos/`) | `static/images/` com prefixo `cvl-` |

## 5. Passo a passo

### Etapa 0: Preparação (comigo)
1. Me pergunte: **a loja ainda está com "página em construção" ligada?** Se sim, dá para editar o tema atual com pouco risco. Se não, combine comigo um horário de pouco movimento.
2. Peça para eu abrir o painel da Nuvemshop e **fazer o login**. Não digite a senha.
3. Comigo, localize no painel os dados de **FTP do tema** (costuma ficar em *Loja online › Layout/Tema › opções avançadas › Editar código / FTP*; o nome pode variar). Veja se é FTP, FTPS ou SFTP e a porta.
4. Se o painel oferecer **editar o código de um tema em rascunho/teste** (sem publicar), prefira ele e me diga. Se não oferecer, siga no tema atual com o backup.
5. Escolha o cliente FTP:
   - **Com terminal:** Python (`ftplib`/`paramiko`) ou `lftp`, lendo `FTP_HOST`, `FTP_USUARIO` e `FTP_SENHA` que eu defino na minha máquina.
   - **Só com a tela:** FileZilla (ou WinSCP). **Eu** preencho o Gerenciador de Sites e salvo; você só clica em Conectar.

### Etapa 1: Backup completo do tema (obrigatório)
1. Conecte e baixe **todo** o tema para `Área de Trabalho/cavelle-backup-tema-AAAA-MM-DD/`.
2. Confira: mesma quantidade de arquivos e pastas do servidor; `layouts/`, `templates/`, `snipplets/`, `static/`, `config/` presentes.
3. Compacte em `.zip` e me mostre o caminho, a quantidade de arquivos e o tamanho. **Só siga depois disso.**

### Etapa 2: Estudar o tema atual (sem alterar nada)
1. Liste a estrutura e leia `layouts/layout.tpl`, `templates/home.tpl`, `templates/category.tpl`, `templates/product.tpl`, `templates/page.tpl` e o snipplet do card de produto.
2. Encontre o código personalizado que já existe (`cav-slider`, `cav-marquee`, `cav-hbanner`, `cav-editorial`) e onde o CSS/JS é carregado.
3. Aprenda a sintaxe **com o próprio tema** (ex.: `{% snipplet '...' %}`, `{{ 'css/x.css' | static_url | css_tag }}`, `| money`, `product.price`, `product.compare_at_price`, variáveis de parcelas e de desconto por meio de pagamento, `sections.primary.products`). Se precisar, consulte a documentação oficial de temas da Nuvemshop e o tema aberto **Cubo** (`github.com/TiendaNube/cubo`). Não use sintaxe de outra plataforma.
4. Confira no painel (só olhando): as URLs das categorias (Leggings, Shorts, Macacões, Blusas, Acessórios), se existe a categoria/listagem de promoções, e se o **desconto de 5% no Pix** está configurado nos meios de pagamento.

### Etapa 3: Plano por escrito (aprovação)
Antes de editar, me mande um plano curto: quais arquivos serão criados, quais serão editados (com o trecho), o que será comentado e o que **não** será possível fazer no tema e por quê. **Espere o meu "ok".**

### Etapa 4: Arquivos estáticos (não mudam nada na loja ainda)
1. Envie as fontes para `static/fonts/` (mantenha os `LICENSE-*.txt`).
2. Envie as imagens de `site-referencia/assets/img/` (menos `produtos/`) e de `kit-tema/imagens/` para `static/images/`, renomeando com prefixo `cvl-` e mantendo a subpasta no nome (ex.: `editorial/quem-somos-45.jpg` → `cvl-editorial-quem-somos-45.jpg`). Guarde a tabela "nome antigo → nome novo" para trocar os caminhos no CSS.
3. Crie `static/css/cvl-site.css` a partir de `style.css`:
   - troque `url(../img/...)` e `url(../fonts/...)` pelos novos nomes;
   - remova regras que só servem ao protótipo (checkout, admin, conta, gaveta do carrinho próprio);
   - mantenha as **cores em variáveis**: `#0F0F0F` (preto), `#F6E7D5` (bege), `#FFFCFC` (off-white);
   - títulos: `"Kingred Modern"` com reserva `"Cormorant Garamond"`; texto: `"Poppins"`.
4. Crie `static/js/cvl-site.js` com **só** a parte visual: carrossel (relógio de 6,5 s, pontos com progresso, setas, deslizar no celular, pausa com o mouse), revelação dos títulos, Text Roll do menu, zoom da home e parallax. Tudo respeita `prefers-reduced-motion`. **Sem** carrinho, favoritos ou busca própria (usa os nativos).
5. Carregue os dois no `layout.tpl` **depois** do CSS/JS do tema. Recarregue a loja e confirme que nada mudou de lugar nem quebrou.

### Etapa 5: Layout global (todas as páginas)
Siga o visual de `site-referencia/index.html` e o HTML que `app.js` gera:
1. **Faixa superior** rolando: `FRETE GRÁTIS ACIMA DE R$499 | 5% OFF NO PIX | PARCELE EM ATÉ 2X SEM JUROS`.
2. **Cabeçalho fixo** com o logo da marca, menu **Início · New In · Shop · Sale · Quem Somos · Suporte**, busca, conta e sacola **nativas** do tema.
   - **Shop** abre o mega menu na ordem **Leggings, Shorts, Macacões, Blusas, Acessórios**, mais os cards New In e Acessórios.
   - **Acessórios não aparece** no menu principal (só dentro de Shop).
   - **Suporte** abre o WhatsApp `https://wa.me/5511914966038`.
3. **Rodapé** como no site de referência (logo preto, links institucionais, contatos, Instagram, Grupo VIP, formas de pagamento). **Não** mostre o endereço de envio.
4. **Botão fixo do WhatsApp** (44 px no celular).
5. Se o menu vier do painel (*Navegação*), **não altere sozinho**: me diga exatamente o que mudar e faça só com o meu ok.

### Etapa 6: Home (`templates/home.tpl`)
Ordem exata:
1. **Carrossel com 4 banners**, com os textos do `TEXTOS.md` e as posições de foto do `index.html`. Use as fotos limpas + texto em HTML (melhor no celular) ou os banners de `banners/`. Passa sozinho e também pelas setas e pontos. **Sem numeração** "01 — 04".
2. **Benefícios**: 2x sem juros · 5% off no Pix · Frete grátis acima de R$499.
3. **Categorias em círculo**: Leggings, Shorts, Macacões, Blusas, com links para as categorias **reais**.
4. **New In** com os produtos reais mais recentes (ou os "em destaque" do painel). Cada card mostra: preço, **"2x de R$ X sem juros"** e **"R$ Y no Pix"**.
5. **Bloco zoom** (fotos que abrem com a rolagem) e **lifestyle** ("Da rotina ao treino. Sempre com você.").
6. **Instagram** @usecavelle com as **6 fotos** fixas.
7. **Grupo VIP** (fundo preto, logo branco), botão para `https://chat.whatsapp.com/Kafx8MWgLYPDkNZVzR226i`. **Não** usar newsletter.
8. Remova (comentando) as seções antigas que contradizem o briefing: `cav-hbanner` (frete R$ 299 / cupom BEMVINDA) e `cav-marquee`.

### Etapa 7: Card de produto, categorias, busca e Sale
1. No card (vale para home, categoria, busca e relacionados):
   - nome, preço, preço "de" riscado quando houver promoção;
   - **2x sem juros** = preço ÷ 2;
   - **Pix** = preço × 0,95, com arredondamento normal (ex.: R$ 279,90 → **R$ 265,91**).
   - Se o tema já tiver variáveis nativas de parcelas e de desconto por pagamento, **use as nativas** (assim fica igual ao checkout). Se o 5% no Pix não estiver configurado no painel, **me avise** em vez de configurar.
2. Na categoria: cabeçalho com a foto da categoria (enquadrada pelo rosto, conforme `shop.js` / `FOTOS`), filtros e ordenação **nativos** com o visual do site.
3. **Sale** = listagem dos produtos em promoção, com o mesmo visual.

### Etapa 8: Página do produto
Galeria com zoom ao passar o mouse; cor e tamanho no estilo do site; **a foto muda com a cor** (as fotos já estão associadas às variantes). Inclua ainda: preço + 2x + Pix, calculadora de frete **nativa**, guia de tamanhos (tabela do `config.js`), botão "Comprar" nativo e produtos relacionados.

### Etapa 9: Páginas institucionais (conteúdo no painel)
1. `templates/page.tpl` recebe o visual do site (título grande, texto em coluna, espaçamentos).
2. **Quem Somos** fica especial (template ou bloco condicional para essa página), igual a `quem-somos.html`:
   - **3 fotos**: `quem-somos-45`, `macacao-rosa-45`, `duo-leggings-45`;
   - o **texto original na ordem original**;
   - sem faixa repetitiva no meio.
3. Para as páginas Suporte, Envio, Política de Troca, Formas de Pagamento, Termos e Privacidade:
   - Se já existirem no painel, **me mostre a diferença** entre o texto atual e o do site de referência e só troque com o meu ok.
   - Se não existirem, crie com o texto do site de referência.
   - **Formas de Pagamento** precisa da seção **"Cupons de desconto"**, dizendo que **os descontos não são cumulativos** (o cupom não se soma ao desconto do Pix).
4. **404** no visual do site.

### Etapa 10: Testes (antes de dizer que terminou)
Teste no computador (1440 px) e no celular (390 px, pelo modo responsivo do navegador ou por um celular de verdade):

- [ ] Faixa superior rola; cabeçalho fica fixo; logo nítido.
- [ ] Menu na ordem certa; mega menu Shop na ordem certa; Acessórios só dentro de Shop.
- [ ] Carrossel passa sozinho, setas, pontos e deslizar funcionam; nenhum rosto ou perna cortado (banner 1 no desktop, banner 3).
- [ ] Categorias em círculo abrem as categorias certas.
- [ ] Cards com preço, 2x e Pix corretos (confira 3 produtos na calculadora).
- [ ] Produto: troca de cor muda a foto; tamanho; adicionar à sacola e **ir até a tela de pagamento** (sem finalizar).
- [ ] Cupom e Pix no checkout nativo continuam funcionando como antes.
- [ ] Quem Somos com as 3 fotos e o texto original.
- [ ] WhatsApp (botão fixo e Suporte) e Grupo VIP abrem os links certos.
- [ ] Nenhum erro vermelho no console do navegador; nenhuma imagem quebrada (404).
- [ ] Velocidade: a home abre em poucos segundos no celular.

### Etapa 11: Relatório final (me entregue)
1. Tabela de **arquivos criados** e **arquivos alterados** (com o que mudou em cada um).
2. Onde está o **backup** e **como desfazer**: reenviar por FTP os arquivos originais do backup por cima dos alterados e apagar só os `cvl-*` criados.
3. Prints da home, de uma categoria, de um produto e do Quem Somos (desktop e celular).
4. **Pendências que dependem de mim**, por exemplo:
   - menu do painel;
   - desconto de 5% no Pix;
   - fonte Kingred Modern (se eu tiver o arquivo, ela entra em `static/fonts/`);
   - CNPJ/razão social no rodapé;
   - códigos GA4/Pixel;
   - desligar a "página em construção".
5. Lembrete de segurança: **fechar/trocar a senha do FTP** depois que terminar.

## 6. Referência rápida

- **Marca:** CAVELLE, moda fitness/lifestyle, visual de luxo, minimalista, muito respiro.
- **Cores:** `#0F0F0F` · `#F6E7D5` · `#FFFCFC`.
- **Fontes:** títulos Kingred Modern (reserva Cormorant Garamond); textos Poppins.
- **Regras:** frete grátis acima de R$ 499 · 5% off no Pix · até 2x sem juros · descontos **não cumulativos**.
- **WhatsApp:** (11) 91496-6038 → `https://wa.me/5511914966038`.
- **Grupo VIP:** `https://chat.whatsapp.com/Kafx8MWgLYPDkNZVzR226i`.
- **Instagram:** `https://www.instagram.com/usecavelle/` (@usecavelle).
- **E-mail:** usecavelle@gmail.com · atendimento de segunda a sexta, das 09h às 18h.
- **Endereço de envio:** **não** aparece no site.

Comece pela **Etapa 0**: me diga o que você precisa que eu faça e me espere.
