/* ============================================================
   CAVELLE — Configurações da loja
   Tudo que é informação comercial fica aqui, em um só lugar.
   Este arquivo é usado pelo site (navegador) e pelo servidor.
   ============================================================ */
(function (root) {
  const CONFIG = {
    marca: 'CAVELLE',
    slogan: 'Movimento para todos os momentos.',
    assinatura: 'Vista sua força. Vista sua melhor versão.',

    // ── Contato ───────────────────────────────────────────
    whatsapp: '5511914966038',            // só números, com 55 + DDD
    whatsappExibicao: '(11) 91496-6038',
    email: 'usecavelle@gmail.com',
    horario: 'Segunda a sexta, das 09h às 18h',
    instagram: 'https://www.instagram.com/usecavelle/',
    instagramUsuario: '@usecavelle',
    grupoVip: 'https://chat.whatsapp.com/Kafx8MWgLYPDkNZVzR226i',

    // ── Regras comerciais ─────────────────────────────────
    freteGratisAcima: 499,   // R$
    descontoPix: 0.05,       // 5%
    parcelasSemJuros: 2,

    // Cupons de desconto (código: percentual), ex.: { CODIGO: 0.10 } = 10% off.
    // Os descontos não são cumulativos (o cupom não se soma ao Pix).
    cupons: {},

    // Dados da empresa exibidos no rodapé (obrigatórios para e-commerce —
    // Decreto 7.962/2013). Preencha antes de publicar.
    razaoSocial: '',
    documento: '',   // CNPJ ou CPF

    // Medição (cole os códigos quando tiver). Só carregam depois que a
    // visitante aceitar os cookies no aviso do site (LGPD).
    googleAnalytics: '',   // ex.: 'G-XXXXXXXXXX'
    pixelMeta: '',         // ex.: '123456789012345'

    // ── Frete (valores de EXEMPLO — ajuste com a tabela real
    //    da transportadora / Nuvem Envio / Melhor Envio) ─────
    // A região é identificada pelo 1º dígito do CEP de destino.
    // Origem dos envios: São Paulo/SP (Zona Leste).
    frete: {
      '0': { regiao: 'Grande São Paulo',            economico: [15.9, '1 a 3 dias úteis'],  expresso: [24.9, '1 dia útil'] },
      '1': { regiao: 'Interior e litoral de SP',    economico: [21.9, '2 a 5 dias úteis'],  expresso: [32.9, '1 a 2 dias úteis'] },
      '2': { regiao: 'RJ e ES',                     economico: [26.9, '3 a 7 dias úteis'],  expresso: [42.9, '2 a 3 dias úteis'] },
      '3': { regiao: 'Minas Gerais',                economico: [26.9, '3 a 7 dias úteis'],  expresso: [42.9, '2 a 3 dias úteis'] },
      '4': { regiao: 'BA e SE',                     economico: [34.9, '5 a 10 dias úteis'], expresso: [54.9, '3 a 5 dias úteis'] },
      '5': { regiao: 'PE, AL, PB e RN',             economico: [34.9, '5 a 10 dias úteis'], expresso: [54.9, '3 a 5 dias úteis'] },
      '6': { regiao: 'Norte, CE, PI e MA',          economico: [39.9, '7 a 12 dias úteis'], expresso: [62.9, '4 a 6 dias úteis'] },
      '7': { regiao: 'Centro-Oeste, TO e RO',       economico: [32.9, '5 a 9 dias úteis'],  expresso: [52.9, '3 a 4 dias úteis'] },
      '8': { regiao: 'PR e SC',                     economico: [28.9, '4 a 8 dias úteis'],  expresso: [44.9, '2 a 3 dias úteis'] },
      '9': { regiao: 'Rio Grande do Sul',           economico: [28.9, '4 a 8 dias úteis'],  expresso: [44.9, '2 a 3 dias úteis'] },
    },

    // ── Categorias (a ordem define os menus) ──────────────
    categorias: [
      { id: 'leggings',   nome: 'Leggings',   home: true },
      { id: 'shorts',     nome: 'Shorts',     home: true },
      { id: 'macacoes',   nome: 'Macacões',   home: true },
      { id: 'blusas',     nome: 'Blusas',     home: true },
      { id: 'acessorios', nome: 'Acessórios', home: false },
    ],

    // Guia de tamanhos (cm) — medidas de REFERÊNCIA, confirme com a modelagem
    guiaTamanhos: {
      colunas: ['Tamanho', 'Busto', 'Cintura', 'Quadril'],
      linhas: [
        ['P',  '82 – 88',   '62 – 68', '90 – 96'],
        ['M',  '88 – 94',   '68 – 74', '96 – 102'],
        ['G',  '94 – 100',  '74 – 80', '102 – 108'],
        ['GG', '100 – 106', '80 – 86', '108 – 114'],
      ],
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = CONFIG;
  else root.CAVELLE_CONFIG = CONFIG;
})(typeof self !== 'undefined' ? self : this);
