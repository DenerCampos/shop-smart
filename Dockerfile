FROM node:18.10-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Instala apenas dependências de produção
ENV NODE_ENV=production
RUN npm ci --only=production

COPY . .

RUN npm run build

# CMD [ "node", "dist/src/main.js" ]

# Adicione este novo comando para limpar cache desnecessário:
CMD node --v8-pool-size=1 --optimize-for-size --max-old-space-size=256 dist/src/main.js
