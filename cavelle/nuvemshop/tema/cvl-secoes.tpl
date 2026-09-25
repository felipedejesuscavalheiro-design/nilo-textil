{# ============================================================
   CAVELLE — seções da home (Twig / Nuvemshop)
   Onde colar: no template da home do tema (templates/home.tpl),
   logo abaixo do carrossel de banners. As imagens vão para a pasta
   static/images/ do tema (arquivos cvl-*.jpg desta pasta).
   Os links de categoria usam os endereços planejados; ajuste se as
   categorias tiverem outro endereço na loja.
   ============================================================ #}

<div class="cvl">

  {# ── Benefícios ── #}
  <section class="cvl-beneficios" aria-label="Benefícios da compra">
    <div class="cvl-container">
      <div class="cvl-beneficio">
        <svg viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3 10h18M7 15h4"/></svg>
        <div><strong>2x sem juros</strong><span>Parcele sua compra em até 2x sem juros.</span></div>
      </div>
      <div class="cvl-beneficio">
        <svg viewBox="0 0 24 24"><path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12 12 3.5z"/><path d="M8.5 12h7"/></svg>
        <div><strong>5% off no Pix</strong><span>Economize no pagamento via Pix.</span></div>
      </div>
      <div class="cvl-beneficio">
        <svg viewBox="0 0 24 24"><path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5v-9z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/></svg>
        <div><strong>Frete grátis</strong><span>Nas compras acima de R$499. Válido para todo o Brasil.</span></div>
      </div>
    </div>
  </section>

  {# ── Shop por categoria ── #}
  <section class="cvl-categorias">
    <div class="cvl-container">
      <h2 class="cvl-titulo">Shop por categoria</h2>
      <div class="cvl-categorias__grade">
        <a class="cvl-categoria" href="/shorts/"><div class="cvl-categoria__img"><img src="{{ 'images/cvl-shorts.jpg' | static_url }}" alt="Shorts" loading="lazy"></div><span>Shorts</span></a>
        <a class="cvl-categoria" href="/leggings/"><div class="cvl-categoria__img"><img src="{{ 'images/cvl-leggings.jpg' | static_url }}" alt="Leggings" loading="lazy"></div><span>Leggings</span></a>
        <a class="cvl-categoria" href="/macacoes/"><div class="cvl-categoria__img"><img src="{{ 'images/cvl-macacoes.jpg' | static_url }}" alt="Macacões" loading="lazy"></div><span>Macacões</span></a>
        <a class="cvl-categoria" href="/blusas/"><div class="cvl-categoria__img"><img src="{{ 'images/cvl-blusas.jpg' | static_url }}" alt="Blusas" loading="lazy"></div><span>Blusas</span></a>
      </div>
      <div class="cvl-ver-todos"><a href="/produtos/">Ver todos →</a></div>
    </div>
  </section>

  {# ── (aqui entra a seção nativa de produtos em destaque, renomeada para NEW IN) ── #}

  {# ── Banner lifestyle ── #}
  <section class="cvl-lifestyle">
    <div class="cvl-lifestyle__foto"><img src="{{ 'images/cvl-lifestyle-1.jpg' | static_url }}" alt="" loading="lazy"></div>
    <div class="cvl-lifestyle__texto">
      <small>CAVELLE</small>
      <h2>Da rotina ao treino.<br>Sempre com você.</h2>
      <p>Peças que acompanham todos os seus momentos.</p>
      <a class="cvl-btn" href="/quem-somos/">Conheça a CAVELLE →</a>
    </div>
    <div class="cvl-lifestyle__foto"><img src="{{ 'images/cvl-lifestyle-2.jpg' | static_url }}" alt="" loading="lazy"></div>
  </section>

  {# ── Instagram ── #}
  <section class="cvl-insta">
    <h2 class="cvl-titulo">Nos acompanhe no Instagram</h2>
    <a class="cvl-insta__arroba" href="https://www.instagram.com/usecavelle/" target="_blank" rel="noopener">@USECAVELLE</a>
    <div class="cvl-insta__grade">
      {% for n in ['7', '8', '9', '11', '12', '14'] %}
        <a href="https://www.instagram.com/usecavelle/" target="_blank" rel="noopener" aria-label="Ver no Instagram"><img src="{{ ('images/cvl-ig-' ~ n ~ '.jpg') | static_url }}" alt="" loading="lazy"></a>
      {% endfor %}
    </div>
  </section>

  {# ── Grupo VIP (substitui a newsletter) ── #}
  <section class="cvl-vip">
    <div class="cvl-container">
      <div><p class="cvl-vip__rotulo">Grupo VIP</p><p class="cvl-vip__marca">CAVELLE</p></div>
      <div class="cvl-vip__texto">
        <strong>Faça parte do Grupo VIP CAVELLE.</strong>
        <p>Receba em primeira mão novidades, lançamentos, reposições e condições especiais.</p>
      </div>
      <a class="cvl-btn cvl-btn--claro" href="https://chat.whatsapp.com/Kafx8MWgLYPDkNZVzR226i" target="_blank" rel="noopener">Entrar no Grupo VIP →</a>
    </div>
  </section>

</div>
