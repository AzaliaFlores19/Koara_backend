FROM docker.io/node:lts-bookworm AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:lts-bookworm AS runner

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate
ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/src/main.js"]