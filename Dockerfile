FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --no-fund --no-audit

COPY . .

ENTRYPOINT ["node", "mongodb-lens.js"]
