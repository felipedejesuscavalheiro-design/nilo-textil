/* Exporta os 4 banners do carrossel já com texto, prontos para subir
   na Nuvemshop (ou em qualquer outra plataforma).

     npm install && npx playwright install chromium   (só na primeira vez)
     node scripts/exportar-banners.js

   Gera nuvemshop/banners/com-texto/banner-N-desktop.jpg (1920×800)
   e banner-N-celular.jpg (1080×1440). */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const app = require('../server.js');

const SAIDA = path.join(__dirname, '..', 'nuvemshop', 'banners', 'com-texto');

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const srv = app.listen(0);
  const url = `http://127.0.0.1:${srv.address().port}/index.html`;
  const nav = await chromium.launch();

  const formatos = [
    { nome: 'desktop', largura: 1920, altura: 800, escala: 1 },
    { nome: 'celular', largura: 360, altura: 800, escala: 3 },
  ];
  for (const f of formatos) {
    const pg = await nav.newPage({ viewport: { width: f.largura, height: f.altura + 200 }, deviceScaleFactor: f.escala });
    await pg.goto(url, { waitUntil: 'networkidle' });
    await pg.addStyleTag({
      content: `.cabecalho,.whats-fixo,.hero__seta,.hero__controles{display:none!important}
        .slide,.slide__foto img{transition:none!important}.slide__foto img{transform:none!important}
        ${f.nome === 'desktop' ? `.hero__trilho{height:${f.altura}px!important}` : ''}`,
    });
    for (let i = 0; i < 4; i++) {
      await pg.evaluate((n) => {
        document.querySelectorAll('.slide').forEach((s, k) => s.classList.toggle('ativo', k === n));
        document.querySelectorAll('.slide img').forEach((im) => { im.loading = 'eager'; });
      }, i);
      await pg.waitForTimeout(600);
      const alvo = await pg.$('.slide.ativo');
      const arq = path.join(SAIDA, `banner-${i + 1}-${f.nome}.jpg`);
      await alvo.screenshot({ path: arq, type: 'jpeg', quality: 88 });
      console.log('ok', path.relative(process.cwd(), arq));
    }
    await pg.close();
  }
  await nav.close();
  srv.close();
})();
