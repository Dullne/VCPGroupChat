FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --registry=https://registry.npmmirror.com

COPY . .

RUN mkdir -p /usr/src/app/data

EXPOSE 7010

CMD ["node", "src/server.js"]
