FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

ENV DATA_DIR=/data

EXPOSE 3001

CMD ["npx", "tsx", "server.ts"]
