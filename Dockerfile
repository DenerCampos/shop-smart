# Estágio 1: Build da aplicação
FROM node:18.10-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:light

# Estágio 2: Imagem final
FROM node:18.10-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Criar usuário não-root
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
