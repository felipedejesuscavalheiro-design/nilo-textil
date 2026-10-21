# PROMPT PARA O CODEX — Cadastrar produtos CAVELLE na Nuvemshop

Copie tudo abaixo da linha e envie ao Codex, junto com esta pasta inteira (`cadastro-produtos`).

---

Você vai operar o meu computador para **cadastrar produtos na minha loja Nuvemshop** (CAVELLE, usecavelle.com.br) usando o navegador. Siga as regras e os passos exatamente como estão.

## Regras de segurança (obrigatórias)
1. **Não peça, não digite e não salve senhas.** Se o painel pedir login, **pare e me chame**. Eu faço o login.
2. **Não altere, não apague e não oculte nenhum produto que já existe na loja.** Só crie produtos novos.
3. **Não mexa em:** pagamentos, frete, domínio, layout/tema, cupons, dados da empresa ou qualquer configuração da loja.
4. **Crie todos os produtos como OCULTOS**, com a opção "Mostrar na loja" desligada. Não publique nada.
5. Em qualquer dúvida, tela diferente do esperado ou erro, **pare e me pergunte** antes de continuar.
6. Não invente dados. Use **somente** o que está em `produtos.csv`, `produtos.json` e na pasta `fotos/`.

## Arquivos desta pasta
- `produtos.json`: um item por produto, com categoria, preços, descrição, SEO, peso, medidas e, para cada cor, a lista de fotos e o estoque por tamanho. **Use este como fonte principal.**
- `produtos.csv`: os mesmos dados, uma linha por variação (cor × tamanho), para conferência.
- `fotos/<produto>/<cor>-1.jpg, -2.jpg…`: fotos de cada cor, **na ordem certa**. A foto 1 é a principal.

## Passo a passo

### Passo 1: Abrir o painel
1. Abra o navegador em `https://www.nuvemshop.com.br/login` e **me chame para fazer o login**.
2. Depois do login, confirme que está no painel da loja **CAVELLE**.

### Passo 2: Categorias
1. Vá em **Produtos → Categorias**.
2. Estas categorias precisam existir: **Leggings, Shorts, Macacões, Blusas, Acessórios**.
3. Se alguma já existir com o mesmo nome, use a existente. Se existir **"Macacão"** (no singular), **me pergunte** se devo usá-la ou criar "Macacões".
4. Crie apenas as que faltarem. Não renomeie nem apague nenhuma.

### Passo 3: Cadastrar cada produto (repita para os 14 produtos do `produtos.json`)
**Antes de criar cada produto**, pesquise o nome em **Produtos**. Se já existir um produto com o **mesmo nome**, **pare e me pergunte** o que fazer. Na minha loja já existem **"Top Serena"** e **"Macacão Curve"**, que são peças antigas diferentes destas.

Em **Produtos → Adicionar produto**:

1. **Nome:** campo `produto`.
2. **Fotos:** envie **todas** as fotos de todas as cores do produto (pasta `fotos/<nome-do-produto>/`). Deixe como **foto principal a `<primeira cor>-1.jpg`**.
3. **Descrição:** cole o campo `descricao` exatamente como está, mantendo as quebras de linha.
4. **Categoria:** campo `categoria`.
5. **Preço:**
   - "Preço" = `precoCheio`
   - "Preço promocional" = `precoPromocional` (só se não for `null`)
6. **Variações:**
   - Crie a propriedade **Cor** com os valores de `cores[].cor`.
   - Crie a propriedade **Tamanho** com as chaves de `estoque` (ex.: P, M, G, GG; na bolsa, "Único").
   - Em cada combinação, preencha o **estoque** com o número de `cores[].estoque[tamanho]`.
   - **Associe as fotos à cor:** em cada variação, escolha como imagem a foto `-1` daquela cor (ex.: variações "Preto" → `preto-1.jpg`), para a foto trocar quando a cliente escolher a cor.
7. **Peso e dimensões** (em todas as variações): `pesoKg`, `comprimentoCm`, `larguraCm` e `alturaCm`.
8. **Marca:** `CAVELLE`.
9. **SEO / Mecanismos de busca:** título = `seoTitulo`; descrição = `seoDescricao`.
10. **Mostrar na loja: DESLIGADO** (produto oculto).
11. Salve. Anote se deu algum erro.

### Passo 4: Conferência
Para cada produto criado, abra a edição e confira:
- [ ] Nome, preço e preço promocional batem com o `produtos.json`
- [ ] Todas as cores e tamanhos existem, com o estoque certo
- [ ] Cada cor tem a foto certa associada
- [ ] Peso e medidas preenchidos
- [ ] Produto **oculto**

### Passo 5: Relatório para mim
No final, me responda com uma tabela: **Produto | Criado? | Nº de variações | Nº de fotos | Oculto? | Observações/erros**. Não publique nenhum produto; eu publico depois de revisar.

## Resumo do que será cadastrado
| Produto | Categoria | Preço | Promocional | Cores (estoque por tamanho) | Fotos |
|---|---|---|---|---|---|
| Macaquinho Bloom | Macacões | R$ 119,90 | — | Rosa (P:4 M:5 G:3 GG:2); Marrom (P:3 M:5 G:3 GG:1); Preto (P:3 M:4 G:3 GG:1) | 8 |
| Macaquinho Lumi | Macacões | R$ 109,90 | — | Cinza (P:3 M:5 G:4 GG:2); Azul (P:3 M:4 G:3 GG:1) | 5 |
| Macacão Curve | Macacões | R$ 149,90 | — | Marrom (P:4 M:6 G:3 GG:1); Preto (P:3 M:5 G:4 GG:2) | 6 |
| Macaquinho Aura | Macacões | R$ 119,90 | — | Rosa (P:3 M:4 G:3 GG:1) | 5 |
| Macaquinho Essence | Macacões | R$ 119,90 | R$ 99,90 | Preto (P:2 M:3 G:2 GG:0) | 5 |
| Legging Sculpt | Leggings | R$ 99,90 | — | Marrom (P:5 M:6 G:4 GG:2); Preto (P:4 M:6 G:4 GG:2) | 6 |
| Calça Flare Prime | Leggings | R$ 119,90 | — | Preto (P:4 M:5 G:3 GG:2) | 3 |
| Cropped Fit | Blusas | R$ 69,90 | R$ 59,90 | Preto (P:3 M:4 G:2 GG:1) | 3 |
| Top Serena | Blusas | R$ 47,90 | — | Taupe (P:3 M:4 G:2 GG:1); Marrom (P:2 M:3 G:2 GG:0) | 5 |
| Top Essential | Blusas | R$ 69,90 | — | Preto (P:4 M:5 G:3 GG:1); Marrom (P:3 M:4 G:3 GG:1) | 4 |
| Shorts Flow | Shorts | R$ 69,90 | — | Taupe (P:4 M:5 G:3 GG:2) | 3 |
| Shorts Breeze | Shorts | R$ 69,90 | R$ 59,90 | Cinza (P:3 M:4 G:3 GG:1) | 3 |
| Camiseta Oversized | Blusas | R$ 89,90 | — | Rosa (P:4 M:6 G:4 GG:2) | 4 |
| Bolsa Puffer | Acessórios | R$ 149,90 | — | Off-white (Único:6) | 3 |
