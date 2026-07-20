FROM docker.io/node:lts-bookworm AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:lts-bookworm AS migrate

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
RUN npx prisma generate
COPY docker-migrate.sh ./
RUN chmod +x docker-migrate.sh
ENV NODE_ENV=production

ENTRYPOINT ["./docker-migrate.sh"]

FROM node:lts-bookworm AS runner

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/src/main.js"]