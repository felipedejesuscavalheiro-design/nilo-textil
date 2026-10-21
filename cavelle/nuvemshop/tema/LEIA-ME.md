# Kit de seções CAVELLE para o tema da Nuvemshop

A loja atual usa o tema **Simple** (nome interno `new_linkedman`) com código personalizado: as seções `cav-slider`, `cav-marquee`, `cav-hbanner` e `cav-editorial` foram colocadas direto nos arquivos do tema. Por isso **dá para editar o código do tema**, provavelmente pelo acesso FTP que está ativo.

Este kit acrescenta as seções da home do briefing no mesmo formato. Testei injetando as seções na loja publicada, em um navegador de teste, no desktop e no celular.

| Arquivo | Para onde vai |
|---|---|
| `cvl-secoes.tpl` | Template da home do tema (`templates/home.tpl`), **logo abaixo do carrossel** |
| `cvl-secoes.css` | Final do CSS do tema, ou o campo de CSS personalizado |
| `imagens/cvl-*.jpg` | Pasta `static/images/` do tema |

Todas as classes começam com `cvl-` e não conflitam com o código atual (`cav-`).

## O que o kit coloca na home (ordem do briefing)
1. **Benefícios:** 2x sem juros · 5% off no Pix · Frete grátis acima de R$499
2. **Shop por categoria:** 4 círculos (Shorts, Leggings, Macacões, Blusas) e "Ver todos"
3. *(a seção nativa de produtos em destaque; renomeie "A COLEÇÃO" para **NEW IN**)*
4. **Banner lifestyle:** "Da rotina ao treino. Sempre com você."
5. **Instagram:** @usecavelle com 6 fotos
6. **Grupo VIP:** fundo preto, com o link do WhatsApp, no lugar da newsletter

## Ajustes no código atual
- **Remover** a faixa `cav-hbanner` ("FRETE GRÁTIS ACIMA DE R$ 299 · CUPOM BEMVINDA 10% OFF"): ela contradiz o briefing e o checkout.
- **Remover** a faixa `cav-marquee` ("Activewear Premium • Feita para Mover…"): o briefing pede poucos elementos decorativos.
- **Carrossel `cav-slider`:** troque as imagens pelos 4 banners de `../banners/com-texto/`, ou pelas fotos limpas com os textos do briefing.
- **Faixa superior:** mude o texto para `FRETE GRÁTIS ACIMA DE R$499 | 5% OFF NO PIX | PARCELE EM ATÉ 2X SEM JUROS`.

## Antes de publicar
- Confira os endereços das categorias (`/shorts/`, `/leggings/`, `/macacoes/`, `/blusas/`). Crie as categorias Leggings e Acessórios, se ainda não existirem.
- Faça tudo em um **tema rascunho** e publique só depois de conferir no celular.
- Guarde uma cópia dos arquivos originais do tema antes de editar.
