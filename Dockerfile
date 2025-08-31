# Node.jsアプリケーションのビルドと実行
FROM node:18-alpine

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール（本番環境用）
RUN npm install --production --legacy-peer-deps

# ソースコードをコピー
COPY . .

# Reactアプリケーションをビルド
RUN npm run build

# Cloud Runがリッスンするポート
EXPOSE 8080

# Express.jsサーバーを実行
CMD ["npm", "run", "serve"]
