/* Gera o pacote de cadastro de produtos para a Nuvemshop:
   nuvemshop/cadastro-produtos/produtos.csv, produtos.json e fotos/<produto>/<cor>-N.jpg
     node scripts/exportar-cadastro.js */
'use strict';
const fs = require('fs');
const path = require('path');
const CFG = require('../public/assets/js/config.js');
const PRODUTOS = require('../public/assets/js/produtos.js');
const R = require('../public/assets/js/regras.js')(CFG, PRODUTOS);

const SAIDA = path.join(__dirname, '..', 'nuvemshop', 'cadastro-produtos');
const FOTOS = path.join(SAIDA, 'fotos');
fs.rmSync(FOTOS, { recursive: true, force: true });
fs.mkdirSync(FOTOS, { recursive: true });

// Peso e embalagem por tipo (referência do guia; pese uma peça para confirmar)
const MEDIDAS = {
  blusas: { peso: 0.15, c: 20, l: 15, a: 3 },
  shorts: { peso: 0.15, c: 20, l: 15, a: 3 },
  leggings: { peso: 0.25, c: 25, l: 20, a: 4 },
  macacoes: { peso: 0.3, c: 25, l: 20, a: 5 },
  acessorios: { peso: 0.5, c: 35, l: 25, a: 10 },
};
const CUIDADOS_ROUPA = 'Lave à mão ou na máquina em ciclo delicado, com água fria e sabão neutro. Lave do avesso e separe por cor. Não use alvejante nem amaciante. Não passe a ferro. Seque à sombra.';
const CUIDADOS_BOLSA = 'Limpe com pano macio levemente umedecido e sabão neutro. Não lave na máquina. Seque à sombra.';
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const br = (v) => v.toFixed(2).replace('.', ',');
const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const linhas = [];
const json = [];
for (const p of PRODUTOS) {
  const categoria = CFG.categorias.find((c) => c.id === p.categoria).nome;
  const m = MEDIDAS[p.categoria];
  const descricao = [
    p.descricao, '',
    ...p.detalhes.map((d) => `• ${d}`), '',
    `Composição: ${p.composicao}`,
    `Cuidados: ${p.categoria === 'acessorios' ? CUIDADOS_BOLSA : CUIDADOS_ROUPA}`,
  ].join('\n');
  const seoDesc = `${p.nome} CAVELLE. ${p.descricao.split('.')[0]}. R$ ${br(R.precoPix(p.preco))} no Pix ou 2x sem juros.`.slice(0, 160);
  const item = {
    produto: p.nome, categoria, preco: p.preco, precoPromocional: p.precoDe ? p.preco : null,
    precoCheio: p.precoDe || p.preco, descricao, seoTitulo: `${p.nome} | CAVELLE`, seoDescricao: seoDesc,
    marca: 'CAVELLE', pesoKg: m.peso, comprimentoCm: m.c, larguraCm: m.l, alturaCm: m.a, cores: [],
  };
  for (const c of p.cores) {
    const pasta = path.join(FOTOS, slug(p.nome));
    fs.mkdirSync(pasta, { recursive: true });
    const fotos = c.fotos.map((f, i) => {
      const nome = `${slug(c.nome)}-${i + 1}.jpg`;
      fs.copyFileSync(path.join(__dirname, '..', 'public', f), path.join(pasta, nome));
      return `fotos/${slug(p.nome)}/${nome}`;
    });
    item.cores.push({ cor: c.nome, fotos, estoque: c.estoque });
    for (const tam of p.tamanhos) {
      linhas.push([
        p.nome, categoria, c.nome, tam, c.estoque[tam] ?? 0,
        br(p.precoDe || p.preco), p.precoDe ? br(p.preco) : '',
        m.peso.toString().replace('.', ','), m.c, m.l, m.a, 'CAVELLE',
        fotos.join(' | '), `${p.nome} | CAVELLE`, seoDesc, descricao,
      ]);
    }
  }
  json.push(item);
}
const cab = ['Produto', 'Categoria', 'Cor', 'Tamanho', 'Estoque', 'Preço (R$)', 'Preço promocional (R$)', 'Peso (kg)', 'Comprimento (cm)', 'Largura (cm)', 'Altura (cm)', 'Marca', 'Fotos desta cor (na ordem)', 'Título SEO', 'Descrição SEO', 'Descrição'];
fs.writeFileSync(path.join(SAIDA, 'produtos.csv'), '﻿' + [cab, ...linhas].map((l) => l.map(csv).join(';')).join('\r\n'));
fs.writeFileSync(path.join(SAIDA, 'produtos.json'), JSON.stringify(json, null, 2));
console.log(`${json.length} produtos, ${linhas.length} variações, fotos em ${path.relative(process.cwd(), FOTOS)}`);
