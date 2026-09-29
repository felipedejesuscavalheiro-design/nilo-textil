# CAVELLE na Nuvemshop — guia de aplicação

Este guia leva o novo site (pasta `public/`) para a sua loja na Nuvemshop.
Ele segue o **briefing final** e resolve os pontos da **auditoria** feita no painel.

> Os textos prontos para colar estão em [`TEXTOS.md`](TEXTOS.md).
> Os banners prontos estão em [`banners/com-texto/`](banners/com-texto/). As fotos sem texto estão em `public/assets/img/banners/`.

---

## 🧭 0. Caminho recomendado

**O que a análise mostrou:**
- **A GUEP (site de referência) também é Nuvemshop**, com o tema **Rio**. A estrutura que o briefing pede (carrossel, faixa de benefícios, vitrine New In, banners grandes, rodapé completo) existe de forma nativa no Rio.
- **A sua loja usa o tema Simple com código editado** (seções `cav-…` feitas por alguém com acesso ao código do tema). Então dá para levar o design novo direto para o tema.

**Duas opções:**
1. **Continuar no tema atual e aplicar o kit de seções** em [`tema/`](tema/LEIA-ME.md). Mantém o que já foi feito, mas exige acesso ao código do tema (FTP).
2. **Migrar para o tema Rio**, em rascunho, e montar a home só com as seções nativas, seguindo a ordem da seção 2 deste guia. Não precisa de código, e fica mais perto da GUEP.

Se você me passar o acesso FTP do tema, **com segurança, pelas configurações do ambiente e nunca pelo chat**, eu mesmo aplico a opção 1.

---

## 🔴 1. Bloqueios do lançamento (fazer primeiro)

### 1.1 Centro de distribuição e frete
**Configurações → Meios de envio → Centro de distribuição → Adicionar**

| Campo | Valor |
|---|---|
| Endereço | Rua Pacajás, 82 |
| Bairro | Vila Cosmopolita (Itaquera/Guaianases) |
| Cidade/UF | São Paulo / SP |
| CEP | 08421-110 |

Depois:
1. Ative o **Nuvem Envio** (Correios e transportadoras com desconto) ou os **Correios**.
2. Apague o meio "Envío a domicilio · Nos comunicaremos…", que está em espanhol e sem valor.
3. Crie o **frete grátis acima de R$499** em **Marketing → Promoções → Frete grátis**, com valor mínimo de R$499 e válido para todo o Brasil.

### 1.2 Peso e dimensões de TODOS os produtos
Sem peso e medida, a Nuvemshop não calcula frete. Referência para roupa fitness dobrada:

| Tipo | Peso | Embalagem (C × L × A) |
|---|---|---|
| Top, cropped, shorts | 0,15 kg | 20 × 15 × 3 cm |
| Legging, calça, camiseta | 0,25 kg | 25 × 20 × 4 cm |
| Macacão, macaquinho | 0,30 kg | 25 × 20 × 5 cm |
| Bolsa | 0,50 kg | 35 × 25 × 10 cm |

Pese uma peça embalada de cada tipo para confirmar.

### 1.3 Pagamentos
- **Nuvem Pago:** mantenha o Pix com 5% e o cartão em 2x sem juros, que já estão certos. **Cadastre a conta bancária** para conseguir sacar as vendas.
- **Boleto:** o briefing não fala de boleto. Desative, ou inclua na página "Formas de Pagamento".

### 1.3.1 Cupons: descontos não cumulativos
O site novo não soma cupom com o desconto do Pix: vale sempre o maior. Na Nuvemshop, ao criar o cupom (**Marketing → Cupons**), procure a opção de **não combinar com outras promoções ou descontos por forma de pagamento**, se o seu plano tiver. Depois, **faça um pedido de teste** com cupom e Pix para confirmar que os dois descontos não se somam. Deixe a regra escrita também na página "Formas de Pagamento" (o texto está em `TEXTOS.md`).

### 1.4 Promessas antigas nos banners
O briefing substitui as faixas antigas. **Apague** a faixa "Frete grátis acima de R$299 · Cupom BEMVINDA 10%". Hoje ela promete o que o checkout não cumpre, e pelo CDC a oferta anunciada obriga a loja.
A nova faixa superior é: `FRETE GRÁTIS ACIMA DE R$499 | 5% OFF NO PIX | PARCELE EM ATÉ 2X SEM JUROS`.

### 1.5 Dados da empresa e páginas obrigatórias
**Configurações → Dados da loja:** preencha razão social (ou nome), CNPJ/CPF, endereço, telefone e e-mail. O Decreto 7.962/2013 exige que a loja mostre esses dados. Confirme com seu contador.

Crie as páginas em **Minha Nuvemshop → Páginas**, com os textos de `TEXTOS.md`:
- Quem Somos
- Política de Troca
- Política de Privacidade
- Termos e Condições
- Formas de Pagamento
- Envio e Entrega

### 1.6 Descrição dos produtos
Cada produto precisa ter descrição, composição, cuidados e guia de tamanhos. Os modelos estão em `TEXTOS.md → Produtos`.

---

## 🎨 2. Visual (Layout)

**Minha Nuvemshop → Layout → Personalizar tema atual**

### Cores
| Uso | Cor |
|---|---|
| Fundo | `#FFFCFC` (off-white) |
| Textos, botões e header | `#0F0F0F` (preto) |
| Faixa superior, destaques, área do Pix | `#F6E7D5` (bege) |
| Texto sobre botão preto | `#FFFCFC` |

### Tipografia
- **Textos:** Poppins, que já está na lista de fontes da Nuvemshop.
- **Títulos e logo:** Kingred Modern, a fonte da identidade. Se o tema não permitir subir fonte própria, use a serifada mais parecida da lista, como Cormorant Garamond, Playfair Display ou Lora. Títulos em CAIXA ALTA com espaçamento entre letras.
- **Logo:** use o logo oficial em **preto**. No checkout o logo atual é branco sobre fundo branco e não aparece. Suba uma versão preta em **Layout → Logo**.

### Tema
O tema ativo é o **Simple**, e o banner atual usa uns 8 KB de CSS personalizado. Recomendação:
1. Em um tema **rascunho**, reative os banners nativos do tema e remova o CSS antigo.
2. Monte a home na ordem do briefing (abaixo). Publique só quando estiver pronta.
3. Exclua o rascunho antigo do Uyuni, parado há 2 meses, para não confundir.

### Ordem da home
1. Faixa superior (texto acima)
2. Header fixo com logo centralizado
3. **Carrossel com 4 banners**, na ordem de `banners/com-texto/` (01 Conceito, 02 Nova coleção, 03 Rotina, 04 Instagram)
4. Benefícios: 2x sem juros · 5% off no Pix · Frete grátis acima de R$499
5. Categorias com 4 fotos redondas: `public/assets/img/categorias/` (shorts, leggings, macacoes, blusas)
6. New In (produtos em destaque)
7. Banner lifestyle: "DA ROTINA AO TREINO. SEMPRE COM VOCÊ."
8. Instagram @usecavelle
9. Grupo VIP no WhatsApp, no lugar da newsletter
10. Rodapé

**Banners:**
- Se o tema permite **texto sobre o banner**, use as fotos limpas de `public/assets/img/banners/` (`banner-N.jpg` no desktop e `banner-N-m.jpg` no celular) e digite os textos do briefing.
- Se não permite, use as versões **com texto** de `banners/com-texto/`: 1920×800 no desktop e 1080×1860 no celular.

Link do botão de cada banner:
| Banner | Botão | Link |
|---|---|---|
| 01 | Conheça a CAVELLE → | página Quem Somos |
| 02 | Conheça a coleção → | categoria New In |
| 03 | Shop CAVELLE → | todos os produtos |
| 04 | Siga no Instagram → | https://www.instagram.com/usecavelle/ |

**Grupo VIP:** se o tema tiver seção de "texto + botão" ou "HTML personalizado", use fundo preto e o botão **ENTRAR NO GRUPO VIP →** com o link:
`https://chat.whatsapp.com/Kafx8MWgLYPDkNZVzR226i`
Desative a newsletter, como o briefing pede.

**WhatsApp fixo:** instale o app de botão de WhatsApp da Nuvemshop (ou use o do tema) com o número **(11) 91496-6038**, na cor preta.

---

## 🧭 3. Menu e categorias

### Categorias (Produtos → Categorias)
Estrutura final pedida no briefing, mais a aba de Acessórios:

| Categoria | O que fazer com a atual |
|---|---|
| **Shorts** | manter |
| **Leggings** | **criar**. Inclui leggings e calças flare |
| **Macacões** | renomear "Macacão" para "Macacões" |
| **Blusas** | manter e mover para cá os produtos de **Tops** |
| **Acessórios** | **criar**. Inclui bolsas etc. |
| **New In** | **criar** e marcar os lançamentos |
| **Sale** | manter e **colocar produtos com preço promocional**; se não houver, tire do menu |
| Conjuntos | decidir: mover as peças para as categorias acima ou manter fora do menu |
| Tops | esvaziar depois de mover para Blusas |

### Menu principal (Minha Nuvemshop → Menus)
```
INÍCIO | NEW IN | SHOP | ACESSÓRIOS | SALE | QUEM SOMOS | SUPORTE
```
- **SHOP** tem os submenus Shorts, Leggings, Macacões, Blusas, Acessórios e Todos os produtos.
- **SUPORTE** leva para o link do WhatsApp: `https://wa.me/5511914966038`
- **Não** coloque Política de Troca no menu principal, só no rodapé.

### Rodapé
- **Navegação:** Início, New In, Shop, Acessórios, Sale, Quem Somos
- **Atendimento:** WhatsApp, E-mail, Horário de atendimento
- **Ajuda:** Política de Troca, Política de Privacidade, Termos e Condições, Formas de Pagamento
- **Contato:** (11) 91496-6038 · Segunda a sexta, das 09h às 18h · usecavelle@gmail.com
- **Redes:** Instagram @usecavelle
- CNPJ/CPF e razão social na linha final

---

## 🛍️ 4. Produtos

Para cada produto:
1. **Fotos por cor:** suba as fotos de cada cor e **associe cada foto à variação**. Assim o Macacão Curve preto mostra a foto preta. Use pelo menos 3 fotos: frente, detalhe e look completo.
2. **Descrição:** use o modelo de `TEXTOS.md`.
3. **Marca:** troque os nomes de fornecedor (JCG, FIERCE, COLORÊ, MISS) por **CAVELLE**. Esse campo vai para o Google Shopping e para o catálogo da Meta.
4. **SEO:** título e descrição em `TEXTOS.md`.
5. **Estoque:** 6 dos 12 produtos estão esgotados. Reponha ou **oculte** até repor, e deixe os esgotados fora do carrossel da home.
6. **Preço promocional:** para aparecer em SALE, preencha "preço promocional" e mantenha o preço original.

O valor no Pix aparece sozinho quando o desconto do Pix está ativo no Nuvem Pago. Confira se o tema mostra "R$ X no Pix". O briefing quer o **valor final**, não só "5% OFF".

---

## ⚙️ 5. Ajustes finais

- [ ] **Domínio:** vincule `usecavelle.com.br` sem "www" (**Configurações → Domínios**).
- [ ] **Checkout:** peça **telefone** como obrigatório (**Configurações → Checkout**).
- [ ] **Nota fiscal:** NF-e se tiver CNPJ, ou declaração de conteúdo se for CPF.
- [ ] **SEO da home:** **Configurações → SEO**. Título e descrição em `TEXTOS.md`.
- [ ] **Rastreamento:** instale GA4 e o Pixel da Meta e conecte a conta da Meta antes de anunciar.
- [ ] **Pedidos #100 e #101** (vencidos em agosto): arquive ou cancele.
- [ ] **Segurança:** ative a verificação em 2 etapas e feche o acesso FTP se não usar.
- [ ] **E-mail profissional:** crie contato@usecavelle.com.br (opcional).
- [ ] **Página em construção:** mantenha ligada até resolver a seção 1.

---

## ✅ Teste antes de abrir

1. Pelo **celular**, entre na home, escolha um produto, veja o valor no Pix, escolha o tamanho e compre.
2. No checkout, digite um CEP de SP e um de outro estado. O frete deve aparecer com valor. Com R$499 ou mais, o frete deve sair grátis.
3. Pague um pedido de teste de valor baixo com Pix e confira se o desconto de 5% entrou.
4. Clique em todos os links do rodapé e no botão do WhatsApp.
