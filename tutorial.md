# huit-gcp-study

## 事前準備

今回はGCPへの操作は**全てコンソール上でコマンドを用いて**行います。

### 必要なロール(権限)の確認

ハンズオンを進めるためには以下 **1** or **2** の何れかの IAM ロールが必要です。

1. [オーナー](https://cloud.google.com/iam/docs/understanding-roles#basic)
2. [編集者](https://cloud.google.com/iam/docs/understanding-roles#basic)、[Project IAM 管理者](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectIamAdmin)、[Cloud Run 管理者](https://cloud.google.com/iam/docs/understanding-roles#run.admin)、[Firebase 管理者](https://cloud.google.com/iam/docs/understanding-roles#firebase.admin)

新規にプロジェクトを作った場合、もしくはこちらでプロジェクトを用意した場合問題ないですが、既存のプロジェクトで権限周りを触っている方は注意してください。

#### GCP のプロジェクト ID を環境変数に設定

環境変数 `PROJECT_ID` に GCP プロジェクト ID を設定します。[GOOGLE_CLOUD_PROJECT_ID] 部分に使用する Google Cloud プロジェクトの ID を入力してください。
例: `export PROJECT_ID=huit-gcp-study-ayumin`

```bash
export PROJECT_ID=[GOOGLE_CLOUD_PROJECT_ID]
```

#### CLI（gcloud コマンド）から利用する GCP のデフォルトプロジェクトを設定

操作対象のプロジェクトを設定します。

```bash
gcloud config set project $PROJECT_ID
```

デフォルトのリージョンを設定します。

```bash
gcloud config set compute/region asia-northeast1
```

以下のコマンドで、現在の設定を確認できます。
```bash
gcloud config list
```

### ProTips
gcloud コマンドには、config 設定をまとめて切り替える方法があります。
アカウントやプロジェクト、デフォルトのリージョン、ゾーンの切り替えがまとめて切り替えられるので、おすすめの機能です。
```bash
gcloud config configurations list
```

## **参考: Cloud Shell の接続が途切れてしまったときは?**

一定時間非アクティブ状態になる、またはブラウザが固まってしまったなどで `Cloud Shell` が切れてしまう、またはブラウザのリロードが必要になる場合があります。その場合は以下の対応を行い、チュートリアルを再開してください。

### **1. チュートリアル資材があるディレクトリに移動する**

```bash
cd ~/cloudshell_open/huit-gcp-study/
```

### **2. チュートリアルを開く**

```bash
teachme tutorial.md
```

### **3. gcloud のデフォルト設定**

```bash
source vars.sh
```

途中まで進めていたチュートリアルのページまで `Next` ボタンを押し、進めてください。

## 本ハンズオンについて

[最終動作サンプルはこちら](https://huit-todo.web.app/)

今回は以下のようなアーキテクチャでWebアプリケーションを構築する。

![architecture](https://raw.githubusercontent.com/shoumoji/huit-gcp-study/main/image/architecture.png)

### 技術詳細

#### フロントエンド

デプロイ先: Firebase Hosting
フレームワーク: Next.js (Reactのフレームワーク)
Firebase Hostingは静的コンテンツを配信するためのサービスで、Next.jsなどのサーバサイドの処理が含まれるフレームワークも使用可能である。

#### バックエンド

デプロイ先: Cloud Run
フレームワーク: Flask (Python)
Cloud Runはコンテナを簡単にデプロイできるサービスで、コンテナ化できるWebアプリケーションであれば、Python以外にもGoやRuby, PHPなど様々な言語で同じように利用できる。今回はPython(Flask)で書かれたAPIサーバをデプロイする。

#### データベース

ホスト先: Cloud SQL (PostgreSQL)
Cloud SQLはMySQLやPostgreSQLなどのリレーショナルデータベースを提供するサービスで、今回はPostgreSQLを使用する。

## firebase にフロントエンドをデプロイする

1. firebaseのプロジェクトを作成する
```bash
firebase projects:create $PROJECT_ID
```

[firebase のコンソール](https://console.firebase.google.com/)にアクセスし、プロジェクトが作成されたか確認する(Googleアカウントが複数ある場合は、ログインしているアカウントがGCPで使用しているものか確認する)

2. firebase hosting の実験的機能を有効化する (Next.jsを使用するため)
```bash
firebase experiments:enable webframeworks
```

3. firebase hosting の初期化を行う
```bash
firebase init hosting
```

4. デプロイする
```bash
cd frontend && firebase deploy
```
