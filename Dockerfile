# ステージ1: Reactアプリケーションのビルド
FROM node:18-alpine as builder

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# ソースコードをコピー
COPY . .

# アプリケーションをビルド
RUN npm run build

# ステージ2: Nginxで静的ファイルを配信
FROM nginx:1.23-alpine

# Nginxの設定ファイルをコピー
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ビルドされた静的ファイルをNginxのドキュメントルートにコピー
COPY --from=builder /app/build /usr/share/nginx/html

# Cloud Runがリッスンするポート
EXPOSE 8080

# Nginxをフォアグラウンドで実行
CMD ["nginx", "-g", "daemon off;"]
