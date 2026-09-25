# CAVELLE — site da loja

Site completo da **CAVELLE** (moda fitness e lifestyle), feito a partir do briefing final:
**clean, premium, feminino, moderno, elegante, lifestyle.**

- **Cores:** preto `#0F0F0F`, bege `#F6E7D5` e off-white `#FFFCFC`
- **Fontes:** Kingred Modern nos títulos (hoje com Cormorant Garamond no lugar; veja abaixo) e Poppins nos textos
- **Mobile em primeiro lugar**, com 2 produtos por linha e o valor no Pix sempre visível

## O que tem no site

| Página | Arquivo |
|---|---|
| Home: faixa, header fixo, carrossel com 4 banners, benefícios, categorias, New In, banner lifestyle, Instagram, Grupo VIP e rodapé | `index.html` |
| Shop, categorias, New In, **Acessórios**, Sale e busca | `shop.html?c=…` |
| Produto: galeria com zoom, cor, tamanho, guia de tamanhos, Pix, frete por CEP e "complete o look" | `produto.html?id=…` |
| Sacola lateral com barra de frete grátis | todas as páginas |
| Checkout: dados, entrega com CEP automático, frete, Pix ou cartão | `checkout.html` |
| Quem Somos | `quem-somos.html` |
| Suporte e WhatsApp fixo | `suporte.html` e botão flutuante |
| Minha conta: acompanhar pedido e ver favoritos | `conta.html` |
| Política de Troca, Privacidade, Termos, Formas de Pagamento, Envio | `*.html` |
| Painel de pedidos (com senha) | `admin.html` |

### Regras comerciais (automáticas)
- **Pix:** preço × 0,95, com arredondamento correto (R$ 279,90 → **R$ 265,91**)
- **Parcelamento:** 2x sem juros
- **Frete grátis** acima de R$ 499, com uma barra de progresso na sacola

## Onde editar

| Quero mudar… | Arquivo |
|---|---|
| WhatsApp, e-mail, Instagram, link do Grupo VIP, horário, frete, cupons, CNPJ | `public/assets/js/config.js` |
| Produtos: nome, preço, preço "de", cores, fotos e estoque por tamanho | `public/assets/js/produtos.js` |
| Textos dos banners, benefícios e seções da home | `public/index.html` |
| Cores, fontes e espaçamentos | `public/assets/css/style.css` (no topo, em `:root`) |
| Fotos | substitua em `fotos-originais/` e rode `npm run imagens` |

> ⚠️ **Os produtos, preços, estoques, composição e valores de frete são EXEMPLOS**, montados a partir das fotos enviadas. Troque pelos dados reais antes de publicar.

### Fonte Kingred Modern
A fonte é comercial e não veio junto com os arquivos. Coloque `KingredModern.woff2` em `public/assets/fonts/` e descomente a linha indicada no topo do `style.css`.

## Como rodar

```bash
cd cavelle
npm install
ADMIN_TOKEN=uma-senha-forte npm start
# abra http://localhost:3000   (painel: http://localhost:3000/admin.html)
npm test                        # testes das regras e da API
```

**Sem servidor (hospedagem estática):** a pasta `public/` funciona sozinha em Netlify, Vercel, GitHub Pages etc. Nesse modo o pedido é finalizado direto pelo WhatsApp, com o resumo pronto.

**Com servidor (Render, Railway, VPS ou Docker):** os pedidos ficam salvos em `data/pedidos.json`, a cliente acompanha o pedido em "Minha conta" e você gerencia status e rastreio no `/admin.html`.
- Na Render ou Railway, crie um serviço apontando para a pasta `cavelle` como *Root Directory*, com o comando `npm start` e a variável `ADMIN_TOKEN`. Use um disco persistente em `/app/data` (ou defina `DATA_DIR`).
- Com Docker: `docker build -t cavelle . && docker run -p 3000:3000 -e ADMIN_TOKEN=… -v $(pwd)/data:/app/data cavelle`

### Pagamento
O checkout calcula tudo e registra o pedido. A cobrança acontece pelo WhatsApp: a equipe envia a chave Pix ou o link de pagamento do cartão. Para cobrar automaticamente no site, o próximo passo é integrar um gateway (Mercado Pago, Pagar.me ou o Nuvem Pago na Nuvemshop).

## Nuvemshop
A loja em produção está na Nuvemshop. A pasta **`nuvemshop/`** tem:
- `GUIA-NUVEMSHOP.md`: passo a passo para aplicar este design e resolver os bloqueios da auditoria (frete, peso, conta bancária, páginas legais etc.)
- `TEXTOS.md`: todos os textos prontos para colar (páginas, SEO, produtos, banners)
- `banners/com-texto/`: os 4 banners do carrossel com texto, em 1920×800 (desktop) e 1080×1860 (celular). Para gerar de novo: `node scripts/exportar-banners.js`

## Estrutura

```
cavelle/
  server.js              API de pedidos + site
  public/                o site (HTML, CSS, JS, imagens, fontes)
    assets/js/config.js    configurações da loja
    assets/js/produtos.js  catálogo
    assets/js/regras.js    Pix, parcelas, frete e total (usado no site e no servidor)
    assets/js/app.js       header, rodapé, sacola, busca, favoritos, compra rápida
  fotos-originais/       fotos enviadas (fonte das imagens do site)
  scripts/               geração de imagens e exportação de banners
  nuvemshop/             guia, textos e banners para a Nuvemshop
  test/                  testes automáticos
```

## Efeitos e referências de design

Os efeitos em `public/assets/js/efeitos.js` são implementações próprias, sem dependências, inspiradas em componentes do [21st.dev](https://21st.dev). O código de lá é React + Tailwind e não foi copiado.

| Efeito no site | Referência |
|---|---|
| Títulos dos banners letra por letra, saindo do desfoque | [Soft Blur In](https://21st.dev/@educalvolpz/components/soft-blur-in) |
| Letras do menu que rolam no hover | [Text Roll](https://21st.dev/@ibelick/components/text-roll) |
| Faixa editorial que acelera e inverte com a rolagem | [Scroll Based Velocity](https://21st.dev/@dillionverma/components/scroll-based-velocity) |
| Banner lifestyle com zoom em camadas (desktop) | [Zoom Parallax](https://21st.dev/@efferd/components/zoom-parallax) |
| Faixas de imagem que se expandem (Quem Somos) | [Hover Expand](https://21st.dev/@educalvolpz/components/hover-expand) |
| Desfoque em camadas sob as legendas | [Progressive Blur](https://21st.dev/@ibelick/components/progressive-blur) |

Todos os efeitos respeitam a opção "reduzir movimento" do sistema. Sem JavaScript, o conteúdo aparece normalmente.
