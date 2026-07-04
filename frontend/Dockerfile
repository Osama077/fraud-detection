FROM node:20-alpine AS base

WORKDIR /app
ENV NODE_OPTIONS="--openssl-legacy-provider"
COPY package*.json ./
RUN npm config set fetch-timeout 120000 && npm install --no-optional --no-audit --no-fund

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
