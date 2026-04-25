# Deploy — Nilo Têxtil Sistema de Produção

## Credenciais padrão após primeiro deploy
- **E-mail:** admin@nilotextil.com.br
- **Senha:** Nilo@2024
- ⚠️ Troque a senha logo após o primeiro login!

---

## Opção 1 — Railway.app (RECOMENDADO, grátis)

1. Crie conta em https://railway.app
2. Clique em **New Project → Deploy from GitHub**
3. Faça upload do projeto (ou conecte ao GitHub)
4. Railway detecta o Dockerfile automaticamente
5. Vá em **Variables** e adicione:
   - `JWT_SECRET` → uma string longa aleatória (ex: `nilo_prod_2024_xyz123`)
   - `NODE_ENV` → `production`
6. Aguarde o build (2-3 min)
7. Acesse a URL gerada pelo Railway

---

## Opção 2 — Render.com (grátis)

1. Crie conta em https://render.com
2. Clique em **New → Web Service**
3. Conecte o repositório GitHub com o projeto
4. Render usa o `render.yaml` automaticamente
5. Adicione a variável `JWT_SECRET` nas configurações
6. Deploy automático

---

## Opção 3 — Docker local / VPS

```bash
# Build
docker build -t nilo-textil .

# Run
docker run -d \
  -p 3000:3000 \
  -e JWT_SECRET=sua_chave_secreta_aqui \
  -e NODE_ENV=production \
  -v $(pwd)/data:/app/data \
  --name nilo-textil \
  nilo-textil
```

Acesse: http://localhost:3000

---

## Rodando localmente (desenvolvimento)

```bash
# Instale dependências
npm install

# Inicie o servidor
npm start
# ou
npm run dev  # com auto-reload

# Acesse
http://localhost:3000
```

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta do servidor |
| `JWT_SECRET` | (valor padrão inseguro) | **Troque em produção!** |
| `DB_PATH` | `./data/nilotextil.db` | Caminho do banco SQLite |
| `NODE_ENV` | `development` | Ambiente |

---

## Estrutura do projeto

```
nilo-backend/
  server.js        — API Express (rotas, auth, lógica)
  db.js            — Schema SQLite + seed inicial
  package.json     — Dependências Node.js
  Dockerfile       — Container para deploy
  railway.json     — Configuração Railway.app
  render.yaml      — Configuração Render.com
  public/
    index.html     — Frontend (interface web)
  data/
    nilotextil.db  — Banco de dados (gerado automaticamente)
```
