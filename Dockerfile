# Node.jsアプリケーションのビルドと実行
FROM node:18-alpine

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール（本番環境用）
RUN npm install --production --legacy-peer-deps

# ソースコードをコピー
COPY . .

# ビルド時の環境変数を設定
ARG REACT_APP_GOOGLE_CLIENT_ID
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID

ARG REACT_APP_STRIPE_PUBLISHABLE_KEY
ENV REACT_APP_STRIPE_PUBLISHABLE_KEY=$REACT_APP_STRIPE_PUBLISHABLE_KEY

# Reactアプリケーションをビルド
RUN npm run build

# Cloud Runがリッスンするポート
EXPOSE 8080

# Express.jsサーバーを実行
CMD ["npm", "run", "serve"]
