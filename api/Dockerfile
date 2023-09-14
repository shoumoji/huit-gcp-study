# 依存関係のインストールステージ
FROM python:3.8-bullseye as builder
# 依存関係のインストールに必要
# ここでインストールするpostgresql用のライブラリや、コンパイラのgccはアプリ動作時には不要なので、マルチステージビルドしている
RUN apt-get update && apt-get install -y libpq-dev gcc
WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# ランタイムのステージ
FROM python:3.8-bullseye as runtime
# EXPOSE を書いておくと、どのポートで待ち受けるのかが分かりやすい
# 主にドキュメント用途なので、複数人で開発するときなどは書いておくと親切
EXPOSE 8080
# デフォルトだとrootで動くので、root以外のユーザに変更する
# 仮に任意コード実行などがあっても、rootの権限が必要なことはできないためセキュリティ向上になる
USER nobody
ARG FLASK_APP=app.py
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.8/site-packages/ /usr/local/lib/python3.8/site-packages/
COPY startup.sh .
COPY app.py .
CMD ["./startup.sh"]
