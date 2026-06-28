FROM node:20-alpine

WORKDIR /usr/src/app

RUN sed -i 's#https://dl-cdn.alpinelinux.org/alpine#https://mirrors.aliyun.com/alpine#g' /etc/apk/repositories \
    && apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --registry=https://registry.npmmirror.com

COPY . .

RUN mkdir -p /usr/src/app/data

EXPOSE 7010

CMD ["node", "src/server.js"]
