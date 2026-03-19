# Estágio 1: Build da aplicação
FROM node:18.10-alpine AS builder

WORKDIR /usr/src/app

# CRITICAL: Força o Node a usar o Swap de 4GB da sua VPS Oracle
ENV NODE_OPTIONS="--max-old-space-size=3072"

COPY package*.json ./
# Instalamos tudo para o build
RUN npm ci

COPY . .
RUN npm run build:light

# Limpeza: Remove devDependencies para economizar RAM e espaço na imagem final
RUN npm prune --production

# ---

# Estágio 2: Imagem final (Runtime)
FROM node:18.10-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copiamos apenas o necessário
COPY --from=builder /usr/src/app/package*.json ./
# Agora copiamos apenas as dependências de produção (bem mais leve)
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Criar usuário não-root (Segurança)
RUN addgroup -S app && adduser -S app -G app
RUN chown -R app:app /usr/src/app
USER app

EXPOSE 3000

# Dica: Use o caminho relativo correto baseado no seu output do Nest
CMD ["node", "dist/src/main.js"]