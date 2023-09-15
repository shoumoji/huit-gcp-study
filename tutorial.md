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

[最終動作サンプルはこちら](https://huit-gcp-study-ayumin.web.app/)

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

## 事前準備 (Cloud shell)

今回はCloud shellを使用してハンズオンを進めますが、Open in Cloud Shell をクリックすると別のプロジェクトが開いてしまう方は、ブラウザ上でプロジェクトを切り替えてください。

その上で以下のコマンドを実行してください。

- cloud shell のディレクトリを作成する (既にある場合は無視してOK)
	```bash
	mkdir -p ~/cloudshell_open
	```
- ディレクトリに移動する
	```bash
	cd ~/cloudshell_open
	```
- 今回使用するリポジトリをクローンする
	```bash
	git clone https://github.com/shoumoji/huit-gcp-study.git
	```
- リポジトリ内にディレクトリを移動する
	```bash
	cd huit-gcp-study
	```

## VPCネットワークを作成する

まずはVPCネットワークを作成します。

このVPCは、Cloud Run(API)をVPC経由でCloud SQL(DB)に接続するために使用します。

今回VPCはAPI-DB間の通信にしか使用しないため、インターネットにアクセスするためのインターネットゲートウェイ(IGW)やルーティングなどの設定はしません。

- 今後のハンズオンで必要なAPIを一括で有効化しておきます
	```bash
	gcloud services enable \
	run.googleapis.com \
	compute.googleapis.com \
	sqladmin.googleapis.com \
	servicenetworking.googleapis.com \
	dns.googleapis.com \
	networkconnectivity.googleapis.com \
	artifactregistry.googleapis.com
	```
- VPCネットワークを作成します
	```bash
	gcloud compute networks create huit-gcp-study-vpc \
	--subnet-mode=custom \
	--mtu=1460 \
	--bgp-routing-mode=regional
	```
- VPCにCloud Runに割り当てるためのサブネットを作成します
	```bash
	gcloud compute networks subnets create huit-gcp-study-subnet \
	--network=huit-gcp-study-vpc \
	--range=10.0.1.0/24 \
	--region=asia-northeast1
	```
- VPCネットワークの持つIPの中で、Cloud SQLに割り当てるIP範囲を作成します。
	```bash
	gcloud compute addresses create google-managed-services-ips \
	--global \
	--purpose=VPC_PEERING \
	--prefix-length=24 \
	--network=huit-gcp-study-vpc
	```
- VPCネットワークピアリング接続を作成します。これはCloud SQLとVPCの接続に使います。
	```bash
	gcloud services vpc-peerings connect \
    --service=servicenetworking.googleapis.com \
    --ranges=google-managed-services-ips \
    --network=huit-gcp-study-vpc
	```

## Cloud SQL にデータベースを作成する

まずはCloud SQLにデータベースを作成します。今回はAPIがPostgreSQLを使用しているので、PostgreSQLで作成します。

先ほど作成したVPCを指定することで、Cloud SQLとVPCを接続しています。

- Cloud SQL で PostgreSQL インスタンスを作成します
	```bash
	gcloud beta sql instances create huit-gcp-study-postgres \
	--database-version=POSTGRES_15 \
	--tier=db-f1-micro \
	--region=asia-northeast1 \
	--network=huit-gcp-study-vpc \
	--no-assign-ip \
	--enable-google-private-path
	```
- postgres ユーザにパスワードを設定します
	```bash
	gcloud sql users set-password postgres \
	--instance=huit-gcp-study-postgres \
	--password=postgres
	```
- todo_db データベースを作成します
	```bash
	gcloud sql databases create todo_db --instance=huit-gcp-study-postgres
	```

## Cloud Run にバックエンドをデプロイする

Cloud Run は、コンテナをデプロイするためのサービスです。

### コンテナのbuild&push
まず、今回使用するAPIサーバをコンテナ化し、コンテナを保存するサービスであるArtifact Registryにコンテナをpushします。

- apiディレクトリにcdします。
	```bash
	cd ~/cloudshell_open/huit-gcp-study/api
	```
- コンテナ用 Artifact Registry を作成します
	```bash
	gcloud artifacts repositories create huit-gcp-study \
    --repository-format=docker \
    --location=asia-northeast1 \
    --async
	```
- Artifact Registryに対するリクエストを認証します
	```bash
	gcloud auth configure-docker asia-northeast1-docker.pkg.dev
	```
- コンテナをビルドします (エラーが出る場合、PROJECT_ID 環境変数にGCPのプロジェクトIDが入っているか確認してください)
	```bash
	docker build -t asia-northeast1-docker.pkg.dev/$PROJECT_ID/huit-gcp-study/api:latest .
	```
- コンテナを Artifact Registry に push します
	```bash
	docker push asia-northeast1-docker.pkg.dev/$PROJECT_ID/huit-gcp-study/api:latest
	```
	これで[Artifact Registry の huit-gcp-study/api に latest タグのついたコンテナが保存](https://console.cloud.google.com/artifacts)されました

### Cloud Run にデプロイ

- 先ほど Artifact Registry に保存したコンテナを Cloud Run にデプロイします
	```bash
	gcloud beta run deploy huit-gcp-study-api \
	--allow-unauthenticated \
	--image asia-northeast1-docker.pkg.dev/$PROJECT_ID/huit-gcp-study/api:latest \
	--region asia-northeast1 \
	--network=huit-gcp-study-vpc \
	--subnet=huit-gcp-study-subnet \
	--vpc-egress=private-ranges-only \
	--region=asia-northeast1 \
	--set-env-vars="POSTGRES_HOST=$(gcloud sql instances describe huit-gcp-study-postgres --format="value(ipAddresses.ipAddress)"),POSTGRES_USER=postgres,POSTGRES_PASSWORD=postgres,POSTGRES_DB=todo_db"
	```
	成功すると、Service URLが出力されます。これがAPIのURLになります。
	```bash
	Deploying container to Cloud Run service [huit-gcp-study-api] in project [huit-gcp-study-ayumin] region [asia-northeast1]
	OK Deploying... Done.
	  OK Creating Revision...
	  OK Routing traffic...
	  OK Setting IAM Policy...
	Done.
	Service [huit-gcp-study-api] revision [huit-gcp-study-api-00006-lok] has been deployed and is serving 100 percent of traffic.
	Service URL: https://huit-gcp-study-api-ikfpjobicq-an.a.run.app
	```
- APIのURLを取得します
	```bash
	export API_ENDPOINT=$(gcloud run services describe huit-gcp-study-api --region asia-northeast1 --format="value(status.address.url)")
	```
- APIにtodoタスクを登録してみましょう
	```bash
	curl -X POST -H "Content-Type:application/json" -d '{"content":"test"}' $API_ENDPOINT/todo
	```
- todo が登録されたことを確認してみましょう
	```bash
	curl $API_ENDPOINT/todo/list
	```
	jsonで登録したtodoが返れば成功です。(idは任意の数値)
	```json
	{"content":"test","id":1}
	```

## firebase にフロントエンドをデプロイする

次にfirebaseにフロントエンドをデプロイします。

- frontend ディレクトリに移動します
	```bash
	cd ~/cloudshell_open/huit-gcp-study/frontend
	```
- フロントエンドからアクセスするバックエンドAPIのURLを設定します
	```bash
	echo "NEXT_PUBLIC_API_ENDPOINT=$API_ENDPOINT" > .env.production
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
	デプロイが成功すると、フロントエンドのURLが表示されます。
	```bash
	=== Deploying to 'huit-gcp-study-ayumin'...

	i  deploying hosting
	i  hosting[huit-gcp-study-ayumin]: beginning deploy...
	i  hosting[huit-gcp-study-ayumin]: found 25 files in .firebase/huit-gcp-study-ayumin/hosting
	✔  hosting[huit-gcp-study-ayumin]: file upload complete
	i  hosting[huit-gcp-study-ayumin]: finalizing version...
	✔  hosting[huit-gcp-study-ayumin]: version finalized
	i  hosting[huit-gcp-study-ayumin]: releasing new version...
	✔  hosting[huit-gcp-study-ayumin]: release complete

	✔  Deploy complete!

	Project Console: https://console.firebase.google.com/project/huit-gcp-study-ayumin/overview
	Hosting URL: https://huit-gcp-study-ayumin.web.app
	```
- 最後に、上で表示されたHosting URLにアクセスしましょう
