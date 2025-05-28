FROM node:18.10-alpine

WORKDIR /usr/src/app

# 1. Copia APENAS os arquivos necessários para instalação
COPY package.json package-lock.json ./

# 2. Instala dependências de DEV também (necessárias para o build)
RUN npm ci

# 3. Copia o restante do código
COPY . .

# 4. Executa o build
RUN npm run build

# 5. Remove as devDependencies para reduzir tamanho da imagem
RUN npm prune --production

# 6. Comando de execução
CMD [ "node", "dist/src/main.js" ]