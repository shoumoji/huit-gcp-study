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

今回は以下のようなアーキテクチャでWebアプリケーションを構築します。

![architecture](https://raw.githubusercontent.com/shoumoji/huit-gcp-study/main/image/architecture.png)

### 技術詳細

#### フロントエンド

デプロイ先: Firebase Hosting
フレームワーク: Next.js (Reactのフレームワーク)
Firebase Hostingは静的コンテンツを配信するためのサービスで、Next.jsなどのサーバサイドの処理が含まれるフレームワークも最近使用可能になりました。

#### バックエンド

デプロイ先: Cloud Run
フレームワーク: Flask (Python)
Cloud Runはコンテナを簡単にデプロイできるサービスです。コンテナ化できるWebアプリケーションであれば、Python以外にもGoやRuby, PHPなど様々な言語で同じように利用できます。今回はPython(Flask)で書かれたAPIサーバをデプロイします。

#### データベース

ホスト先: Cloud SQL (PostgreSQL)
Cloud SQLはMySQLやPostgreSQLなどのリレーショナルデータベースを提供するサービスです。今回はPostgreSQLを使用します。

## VPCネットワークを作成する

まずはVPCネットワークを作成します。これはCloud SQLを作成する際にVPCネットワーク内に構築するためです。(後でCloud Runを接続する際に必要になります)
なお今回VPCはAPI-DB間の通信にしか使用しないため、インターネットとアクセスするためのゲートウェイやルーティングなどの設定はせず、サブネットを1つ作成するだけで終わります。

- 今後のハンズオンで必要なAPIを一括で有効化しておきます
	```bash
	gcloud services enable \
	run.googleapis.com \
	compute.googleapis.com \
	sqladmin.googleapis.com
	```

- VPCネットワークを作成します
	```bash
	gcloud compute networks create huit-gcp-study-vpc \
	--subnet-mode=custom \
	--mtu=1460 \
	--bgp-routing-mode=regional
	```
- VPC内にサブネットを切ります。今回はIPv4のみ使用し、privateなサブネットを作成します。
	```bash
	gcloud compute networks subnets create private-subnet1 \
	--range=10.0.128.0/22 \
	--stack-type=IPV4_ONLY \
	--network=huit-gcp-study-vpc \
	--region=asia-northeast1
	```

## Cloud SQL にデータベースを作成する

まずはCloud SQLにデータベースを作成します。今回はAPIがPostgreSQLを使用しているので、PostgreSQLで作成します。

- Cloud SQL で PostgreSQL インスタンスを作成します
	```bash
	gcloud beta sql instances create huit-gcp-study-db \
	--tier=db-f1-micro \
	--region=ap-northeast-1 \
	--network=huit-gcp-study-vpc \
	--no-assign-ip \
	--enable-google-private-path
	```

## firebase にフロントエンドをデプロイする

次にfirebaseにフロントエンドをデプロイします。

- frontend ディレクトリに移動します
	```bash
	cd frontend
	```
- フロントエンドからアクセスするバックエンドAPIのURLを設定します
	```bash
	echo "NEXT_PUBLIC_API_ENDPOINT=<Cloud RunのURLを設定する>" > .env.production
	```
- フロントエンドの依存関係をインストールします
	```bash
	npm install
	```
- フロントエンドをビルドします
	```bash
	npm run build
	```
- firebase にログインします
	```bash
	firebase login --no-localhost
	```
	以下のような表示が出るので、表示されたURLにアクセスし、ログインします。
	```bash
	i  Firebase optionally collects CLI and Emulator Suite usage and error reporting information to help improve our products. Data is collected in accordance with Google's privacy policy (https://policies.google.com/privacy) and is not used to identify you.

	? Allow Firebase to collect CLI and Emulator Suite usage and error reporting information? <y/n> <n> (どちらでもOK)

	To sign in to the Firebase CLI:

	1. Take note of your session ID:

	   <セッションID>

	2. Visit the URL below on any device and follow the instructions to get your code:

	   <ログイン用URL、ここをクリックしてログインコードを取得する>

	3. Paste or enter the authorization code below once you have it:

	? Enter authorization code: <ここにブラウザから取得したコードを入力>
	```
- firebaseのプロジェクトを作成します
	```bash
	firebase projects:create $PROJECT_ID
	```
	[firebase のコンソール](https://console.firebase.google.com/)にアクセスし、プロジェクトが作成されたか確認してください(Googleアカウントが複数ある場合は、ログインしているアカウントがGCPで使用しているものか要確認)
- firebase hosting の実験的機能を有効化します (Next.jsを使用するため)
	```bash
	firebase experiments:enable webframeworks
	```

- firebase hosting の初期化を行います
	```bash
	firebase init hosting
	```
	```bash

     ######## #### ########  ######## ########     ###     ######  ########
     ##        ##  ##     ## ##       ##     ##  ##   ##  ##       ##
     ######    ##  ########  ######   ########  #########  ######  ######
     ##        ##  ##    ##  ##       ##     ## ##     ##       ## ##
     ##       #### ##     ## ######## ########  ##     ##  ######  ########

	You're about to initialize a Firebase project in this directory:

	  /home/<Cloud ShellのUSER名>/cloudshell_open/huit-gcp-study/frontend


	=== Project Setup

	First, let's associate this project directory with a Firebase project.
	You can create multiple project aliases by running firebase use --add,
	but for now we'll just set up a default project.

	? Please select an option: Use an existing project
	? Select a default Firebase project for this directory: huit-gcp-study-ayumin (huit-gcp-study-ayumin)
	<先ほど作ったfirebaseのプロジェクトを選択>

	=== Hosting Setup
	? Detected an existing Next.js codebase in the current directory, should we use this? <Y/n> <Y>
	? In which region would you like to host server-side content, if applicable? <asia-east1 (Taiwan)>(どこでもOK, 距離的にus-westでも良いかも)
	? Set up automatic builds and deploys with GitHub? <No> (今回は自動デプロイ設定しないので)

	i  Writing configuration info to firebase.json...
	i  Writing project information to .firebaserc...

	✔  Firebase initialization complete!
	```

- デプロイします
	```bash
	firebase deploy
	```
