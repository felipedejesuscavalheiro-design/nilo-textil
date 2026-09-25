#!/usr/bin/env python3
"""
Gera todas as imagens do site a partir das fotos originais.

    pip install pillow
    python3 scripts/build-images.py

Cada recorte é definido por: foto, centro (cx, cy) e largura do recorte,
tudo em frações da foto original (0 a 1), mais a proporção final (altura/largura).
Para trocar uma foto, basta substituir o arquivo em fotos-originais/ e rodar de novo.
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "fotos-originais"
OUT = ROOT / "public" / "assets" / "img"

_cache = {}


def load(name):
    if name not in _cache:
        im = Image.open(SRC / f"{name}.jpg")
        _cache[name] = ImageOps.exif_transpose(im).convert("RGB")
    return _cache[name]


def crop(name, cx, cy, w, ratio):
    """Recorte com centro (cx, cy) e largura w (frações), proporção ratio = altura/largura."""
    im = load(name)
    W, H = im.size
    cw = w * W
    ch = cw * ratio
    if ch > H:  # limita pela altura
        ch = H
        cw = ch / ratio
    x0 = min(max(cx * W - cw / 2, 0), W - cw)
    y0 = min(max(cy * H - ch / 2, 0), H - ch)
    return im.crop((round(x0), round(y0), round(x0 + cw), round(y0 + ch)))


def pad(name, ratio, bg=(255, 255, 255)):
    """Encaixa a foto inteira numa tela com a proporção pedida (fundo liso)."""
    im = load(name)
    W, H = im.size
    if H / W < ratio:
        nw, nh = W, round(W * ratio)
    else:
        nw, nh = round(H / ratio), H
    canvas = Image.new("RGB", (nw, nh), bg)
    canvas.paste(im, ((nw - W) // 2, (nh - H) // 2))
    return canvas


def clarear(im, ponto_branco=246):
    """Leva o fundo quase-branco do estúdio para branco puro (some a borda da foto no site)."""
    f = 255 / ponto_branco
    return im.point(lambda v: min(255, round(v * f)))


def save(im, out, width, quality=80):
    path = OUT / out
    path.parent.mkdir(parents=True, exist_ok=True)
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(path, "JPEG", quality=quality, optimize=True, progressive=True)
    print(f"{out:40s} {im.width}x{im.height}  {path.stat().st_size // 1024} KB")


# ── Carrossel da home ────────────────────────────────────────
# Desktop: fotos horizontais em tela cheia; verticais inteiras (o CSS posiciona).
save(crop("banner-1", 0.5, 0.5, 1, 1334 / 2000), "banners/banner-1.jpg", 2000)
save(clarear(load("banner-2")), "banners/banner-2.jpg", 1200)
save(load("banner-3"), "banners/banner-3.jpg", 1200)
save(crop("banner-4", 0.5, 0.5, 1, 1334 / 2000), "banners/banner-4.jpg", 2000)
# Mobile: recortes verticais 3:4 (o texto fica sobre a parte clara de baixo)
save(crop("banner-1", 0.64, 0.5, 0.55, 4 / 3), "banners/banner-1-m.jpg", 900)
save(crop("banner-2", 0.5, 0.52, 1, 4 / 3), "banners/banner-2-m.jpg", 900)
save(crop("banner-3", 0.5, 0.45, 1, 4 / 3), "banners/banner-3-m.jpg", 900)
save(crop("banner-4", 0.6, 0.5, 0.55, 4 / 3), "banners/banner-4-m.jpg", 900)

# ── Categorias (quadradas, exibidas em círculo) ─────────────
save(crop("shorts", 0.52, 0.72, 0.62, 1), "categorias/shorts.jpg", 640)
save(crop("legging", 0.5, 0.6, 0.55, 1), "categorias/leggings.jpg", 640)
save(crop("macacao", 0.53, 0.47, 0.7, 1), "categorias/macacoes.jpg", 640)
save(crop("camiseta", 0.48, 0.36, 0.7, 1), "categorias/blusas.jpg", 640)
save(crop("bolsa", 0.48, 0.6, 0.9, 1), "categorias/acessorios.jpg", 640)

# ── Produtos (3:4) ───────────────────────────────────────────
P = 4 / 3
products = {
    "macacao-curve-marrom": [crop("banner-2", 0.33, 0.37, 0.52, P), crop("banner-2", 0.34, 0.72, 0.52, P), pad("banner-2", P, (253, 250, 247))],
    "macacao-curve-preto": [crop("banner-2", 0.6, 0.37, 0.52, P), crop("banner-2", 0.6, 0.72, 0.52, P), pad("banner-2", P, (253, 250, 247))],
    "macaquinho-aura-rosa": [crop("macacao", 0.52, 0.42, 0.78, P), crop("macacao", 0.6, 0.6, 0.6, P), crop("macacao", 0.5, 0.3, 0.5, P)],
    "macaquinho-essence-preto": [crop("banner-1", 0.62, 0.5, 1, P), crop("banner-1", 0.65, 0.55, 0.28, P), crop("banner-1", 0.42, 0.6, 0.5, P)],
    "legging-sculpt-marrom": [crop("legging", 0.5, 0.52, 0.92, P), crop("legging", 0.5, 0.66, 0.55, P), crop("legging", 0.48, 0.3, 0.45, P)],
    "calca-flare-prime-preto": [crop("banner-4", 0.36, 0.5, 0.5, P), pad("banner-4", P), crop("banner-4", 0.62, 0.5, 0.5, P)],
    "cropped-fit-preto": [crop("banner-4", 0.68, 0.34, 0.34, P), crop("banner-4", 0.62, 0.5, 0.5, P), pad("banner-4", P)],
    "top-serena-taupe": [crop("shorts", 0.52, 0.34, 0.7, P), crop("shorts", 0.52, 0.52, 1, P), crop("shorts", 0.5, 0.3, 0.45, P)],
    "top-serena-marrom": [crop("legging", 0.47, 0.3, 0.42, P), crop("legging", 0.5, 0.52, 0.92, P)],
    "shorts-flow-taupe": [crop("shorts", 0.52, 0.7, 0.7, P), crop("shorts", 0.52, 0.52, 1, P), crop("shorts", 0.55, 0.68, 0.4, P)],
    "shorts-breeze-cinza": [crop("banner-3", 0.42, 0.78, 0.62, P), crop("camiseta", 0.47, 0.78, 0.5, P), crop("banner-3", 0.5, 0.45, 1, P)],
    "camiseta-oversized-rosa": [crop("camiseta", 0.5, 0.48, 1, P), crop("camiseta", 0.47, 0.34, 0.5, P), crop("banner-3", 0.5, 0.45, 1, P)],
    "bolsa-puffer-off-white": [crop("bolsa", 0.5, 0.5, 1, P), crop("bolsa", 0.47, 0.62, 0.5, P), crop("bolsa", 0.5, 0.36, 0.72, P)],
}
for slug, imgs in products.items():
    for i, im in enumerate(imgs, 1):
        save(im, f"produtos/{slug}-{i}.jpg", 900)

# ── Banner lifestyle (dois retratos) ─────────────────────────
save(crop("macacao", 0.52, 0.45, 0.9, P), "lifestyle/lifestyle-1.jpg", 1000)
save(crop("legging", 0.5, 0.52, 0.92, P), "lifestyle/lifestyle-2.jpg", 1000)

# ── Zoom Parallax da home (imagem central que ocupa a tela) ──
save(crop("macacao", 0.5, 0.42, 1, 10 / 16), "lifestyle/zoom-centro.jpg", 1600, 84)

# ── Grade do Instagram (quadradas) ───────────────────────────
save(crop("banner-1", 0.6, 0.45, 0.62, 1), "instagram/ig-1.jpg", 600)
save(crop("banner-2", 0.47, 0.45, 0.85, 1), "instagram/ig-2.jpg", 600)
save(crop("banner-3", 0.5, 0.28, 0.85, 1), "instagram/ig-3.jpg", 600)
save(crop("bolsa", 0.47, 0.55, 0.85, 1), "instagram/ig-4.jpg", 600)
save(crop("banner-4", 0.62, 0.45, 0.6, 1), "instagram/ig-5.jpg", 600)
save(crop("macacao", 0.52, 0.4, 0.8, 1), "instagram/ig-6.jpg", 600)

# ── Quem Somos ───────────────────────────────────────────────
save(crop("banner-1", 0.5, 0.5, 1, 1334 / 2000), "sobre/sobre-hero.jpg", 2000)
save(crop("banner-3", 0.5, 0.4, 1, P), "sobre/sobre-1.jpg", 1000)
save(crop("banner-2", 0.47, 0.5, 1, P), "sobre/sobre-2.jpg", 1000)
save(crop("bolsa", 0.5, 0.5, 1, P), "sobre/sobre-3.jpg", 1000)

# ── Compartilhamento (Open Graph 1200x630) ───────────────────
save(crop("banner-1", 0.55, 0.45, 1, 630 / 1200), "og-cavelle.jpg", 1200)

# ============================================================
# FOTOS NOVAS (segundo ensaio)
# ============================================================
P45 = 5 / 4

# ── Produtos novos e fotos extras ────────────────────────────
novos = {
    # Macaquinho Bloom — manga curta, decote quadrado
    "macaquinho-bloom-rosa": [crop("macaquinho-rosa", 0.5, 0.5, 1, P), crop("macaquinho-rosa", 0.47, 0.4, 0.55, P), crop("duo-marrom-rosa", 0.62, 0.4, 0.5, P)],
    "macaquinho-bloom-marrom": [crop("duo-marrom-rosa-costas", 0.3, 0.4, 0.5, P), crop("duo-marrom-rosa", 0.37, 0.42, 0.5, P), crop("ed-duo-preto-marrom", 0.41, 0.62, 0.52, P)],
    "macaquinho-bloom-preto": [crop("ed-duo-preto-marrom", 0.62, 0.33, 0.46, P), crop("ed-duo-preto-marrom", 0.5, 0.5, 1, P)],
    # Macaquinho Lumi — alças finas
    "macaquinho-lumi-cinza": [crop("macaquinho-cinza", 0.5, 0.48, 1, P), crop("duo-azul-cinza", 0.66, 0.5, 0.55, P), crop("macaquinho-cinza", 0.52, 0.42, 0.6, P)],
    "macaquinho-lumi-azul": [crop("duo-azul-cinza", 0.27, 0.42, 0.55, P), crop("duo-azul-cinza", 0.5, 0.47, 1, P)],
    # Top Essential
    "top-essential-preto": [crop("duo-leggings", 0.3, 0.33, 0.42, P), crop("duo-leggings", 0.5, 0.52, 1, P)],
    "top-essential-marrom": [crop("duo-leggings", 0.67, 0.33, 0.42, P), crop("duo-leggings", 0.5, 0.52, 1, P)],
    # Fotos extras de produtos existentes
    "legging-sculpt-preto": [crop("duo-leggings", 0.28, 0.56, 0.55, P), crop("duo-leggings", 0.5, 0.52, 1, P)],
}
for slug, imgs in novos.items():
    for i, im in enumerate(imgs, 1):
        save(im, f"produtos/{slug}-{i}.jpg", 900)
save(crop("duo-leggings", 0.66, 0.56, 0.5, P), "produtos/legging-sculpt-marrom-4.jpg", 900)
save(crop("duo-marrom-rosa-costas", 0.68, 0.56, 0.55, P), "produtos/macaquinho-aura-rosa-4.jpg", 900)
save(crop("duo-marrom-rosa-costas-2", 0.58, 0.62, 0.55, P), "produtos/macaquinho-aura-rosa-5.jpg", 900)
save(crop("camiseta-shake", 0.5, 0.45, 1, P), "produtos/camiseta-oversized-rosa-4.jpg", 900)
save(crop("ed-retrato-camisa", 0.5, 0.5, 1, P), "produtos/macaquinho-essence-preto-4.jpg", 900)
save(crop("quem-somos", 0.5, 0.5, 1, P), "produtos/macaquinho-essence-preto-5.jpg", 900)

# ── Editoriais (3:4 e 4:5) ───────────────────────────────────
editoriais = {
    "ed-duo-preto-marrom": ("ed-duo-preto-marrom", 0.5, 0.5),
    "duo-azul-cinza": ("duo-azul-cinza", 0.5, 0.47),
    "duo-marrom-rosa": ("duo-marrom-rosa", 0.5, 0.5),
    "duo-leggings": ("duo-leggings", 0.5, 0.52),
    "ed-retrato": ("ed-retrato-camisa", 0.5, 0.5),
    "ed-leitura": ("ed-leitura", 0.5, 0.45),
    "quem-somos": ("quem-somos", 0.5, 0.5),
    "ed-sentada": ("ed-sentada-camisa", 0.55, 0.55),
    "camiseta-shake": ("camiseta-shake", 0.5, 0.45),
}
for nome, (src, cx, cy) in editoriais.items():
    save(crop(src, cx, cy, 1, P), f"editorial/{nome}.jpg", 1000)
    save(crop(src, cx, cy, 1, P45), f"editorial/{nome}-45.jpg", 1000)

# ── Instagram (quadradas) ────────────────────────────────────
ig_novas = [
    ("ed-leitura", 0.5, 0.36, 0.82), ("duo-azul-cinza", 0.5, 0.4, 0.92), ("ed-retrato-camisa", 0.5, 0.33, 0.88),
    ("camiseta-shake", 0.5, 0.33, 0.85), ("ed-duo-preto-marrom", 0.5, 0.5, 0.92), ("macaquinho-rosa", 0.5, 0.35, 0.8),
    ("duo-leggings", 0.5, 0.45, 0.92), ("quem-somos", 0.5, 0.45, 0.92),
]
for k, (src, cx, cy, w) in enumerate(ig_novas, 7):
    save(crop(src, cx, cy, w, 1), f"instagram/ig-{k}.jpg", 600)

# ============================================================
# LOGO OFICIAL (baixado da loja na Nuvemshop, versão branca)
# Gera versões preta e branca, com e sem a assinatura "SCULPTING FIT".
# ============================================================
def logo(cor, recorte, nome):
    im = Image.open(SRC / "logo-oficial.png").convert("RGBA").crop(recorte)
    alfa = im.getchannel("A")
    solido = Image.new("RGBA", im.size, cor + (255,))
    solido.putalpha(alfa)
    caminho = OUT / "marca" / nome
    caminho.parent.mkdir(parents=True, exist_ok=True)
    solido.save(caminho, optimize=True)
    print(f"marca/{nome:34s} {im.width}x{im.height}")

COMPLETO = (49, 67, 526, 174)   # CAVELLE + SCULPTING FIT
MARCA = (49, 67, 526, 141)      # só CAVELLE
logo((15, 15, 15), COMPLETO, "logo-preto.png")
logo((255, 252, 252), COMPLETO, "logo-branco.png")
logo((15, 15, 15), MARCA, "logo-marca-preto.png")
logo((255, 252, 252), MARCA, "logo-marca-branco.png")
