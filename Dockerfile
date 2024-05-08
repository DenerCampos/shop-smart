FROM node:18.10

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# RUN npm run migration:run

# CMD [ "npm", "run", "start:dev" ]

CMD [ "node", "dist/src/main.js" ]
