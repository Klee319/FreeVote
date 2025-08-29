# Node.js アプリケーション用 Dockerfile
FROM node:20-alpine AS base

# 作業ディレクトリ設定
WORKDIR /app

# 依存関係のインストール用ステージ
FROM base AS deps
# 日本語ロケール設定用パッケージ
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# 開発用ステージ
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]

# ビルド用ステージ
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

# 本番用ステージ
FROM base AS production
ENV NODE_ENV=production

# セキュリティ向上のため非rootユーザーを作成
RUN addgroup -g 1001 nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]