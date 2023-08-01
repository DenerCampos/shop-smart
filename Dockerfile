FROM node:18.10

WORKDIR /

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# RUN npm run migration:run

CMD [ "npm", "run", "start:prod" ]
