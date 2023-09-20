# huit-gcp-study

## 事前準備

今回はGCPへの操作は**全てコンソール上でコマンドを用いて**行います。

### 必要なロール(権限)の確認

ハンズオンを進めるためには以下 **1** or **2** の何れかの IAM ロールが必要です。

1. [オーナー](https://cloud.google.com/iam/docs/understanding-roles#basic)
2. [編集者](https://cloud.google.com/iam/docs/understanding-roles#basic)、[Project IAM 管理者](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectIamAdmin)、[Cloud Run 管理者](https://cloud.google.com/iam/docs/understanding-roles#run.admin)、[Firebase 管理者](https://cloud.google.com/iam/docs/understanding-roles#firebase.admin)

新規にプロジェクトを作った場合、もしくはこちらでプロジェクトを用意した場合問題ないですが、既存のプロジェクトで権限周りを触っている方は注意してください。

### Cloud Shell の gcloud SDK をアップグレード

人によっては古いgcloud SDKが入っていて問題がおきる可能性があるので、更新します。

```bash
sudo apt update && sudo apt upgrade -y
```

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

#### 使用するサービス

**Google Kubernetes Engine (GKE)**

#### フロントエンド

デプロイ先: GKE
フレームワーク: Next.js (Reactのフレームワーク)
今回はサーバサイドレンダリングを扱うため、**フロントエンドもコンテナとしてバックエンドと同じようにデプロイします！**

#### バックエンド

デプロイ先: GKE
フレームワーク: Flask (Python)

#### データベース

デプロイ先: GKE
今回はDockerHubにあるPostgreSQLの公開コンテナイメージを使用します。

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

## コンテナについて復習

### コンテナとは？

誤解を恐れず一言でいえば、Dockerfileを元に作る隔離された環境(仮想環境のようなもの)です。
`docker build .` でDockerfileを元に**コンテナイメージ**を作成し、`docker run` でコンテナイメージを元に**コンテナ**を作成します。(コンテナイメージとコンテナは別物です。ちょうどクラスとインスタンスのような関係で、Dockerfileとコンテナイメージは1対1, コンテナイメージとコンテナは1対多の関係があります。)
より詳細にコンテナについて学びたい方は、[itmediaの記事](https://atmarkit.itmedia.co.jp/ait/articles/2108/23/news022.html)がよくまとまっているので一見の価値があります。

正確に言うと、コンテナは隔離された環境でアプリケーションを実行するための仕組み全般を指すので、Docker以外にもコンテナ技術は存在します。
歴史的にはFreeBSDのjailなどがありますが、現在ではDockerが主流となっているため、現在はコンテナ==Dockerと連想する方が多いです。
この辺りの歴史的経緯を正確にすると上の解説は間違っているのですが、今回はふんわりコンテナを知っていただくのが目的なので、この程度の説明になっています。

### Kubernetesとは？

コンテナを管理するためのオーケストレーションツールです。

2000年代後半にDockerが誕生してから、取り回しがよいコンテナ技術が急速に企業に普及していきました。
その一方で、システムの複雑化により大企業が使用するコンテナは億単位の規模となり、コンテナの管理が難しくなっていきました。

当初からコンテナ技術に貢献していたGoogleは、大規模なコンテナシステムを管理するシステム「Borg」を開発します。
これが今のコンテナオーケストレーションシステムのデファクトスタンダードとなるKubernetes(以下k8s)の誕生につながります。

k8s は非常に多機能かつ仕様変更が激しいOSSですが、今回はk8sの基本的な機能を使ってコンテナをデプロイすることを目的としているので、k8sの詳細については割愛します。
k8sエコシステム全体を俯瞰したい場合、[Kubernetesの知識地図](https://gihyo.jp/book/2023/978-4-297-13573-7)という本が初心者向けで分かりやすいのでおすすめです。

## GKE クラスタを作成する

細かい説明の前に、まずはGKEクラスタを作成してみましょう！
クラスタの作成には時間がかかるため、その間にk8sの基本的な概念を説明します。

- 最初に今後のハンズオンで必要なAPIを一括で有効化しておきます
	```bash
	gcloud services enable \
	container.googleapis.com \
	compute.googleapis.com \
	sqladmin.googleapis.com \
	servicenetworking.googleapis.com \
	dns.googleapis.com \
	networkconnectivity.googleapis.com \
	artifactregistry.googleapis.com
	```
- GKEでk8sクラスタを作成します
	```bash
	gcloud container clusters create-auto dmm-cluster
	```

クラスタを作成している間に、k8sの基本概念について説明します。

クラスタは、**k8sシステムの最大単位** です。クラスタはk8sの様々な機能や、実行するためのノード(マシン)を内包した概念です。

Linuxサーバ(自宅サーバやVPS, EC2など)を使ったことがある人であれば、それらがクラスタを構成するノードに該当する、と捉えると分かりやすいかもしれません。

クラスタは、k8sのマスターノード(コントロールプレーン)とワーカーノードの2種類のノードで構成されています。管理系の機能を持つのがマスターノード、実際にアプリケーションがデプロイされ、それを実行するのがワーカーノードです。

一般的な構成では単一障害点を防止するため、この2種類のノードを、更に複数のノード上にデプロイさせます(マスターノードを3台、ワーカーノードを6台、合計9台のマシンでk8sクラスタを作る、といった具合です)。ですので、基本的にk8sクラスタを作るにはマスター、ワーカーそれぞれ1台で2台以上のマシンが必要となります。

ただし最近では手軽にk8s環境を作るためのツールも増えており、その2ノードの機能を1つのマシン上にデプロイできるツールもあります。(kind, microk8sなどがその代表例で、ローカル開発環境としてよく使われます)

引用元: イラストでわかるDockerとKubernetes 図3-4

![k8s_arch](https://raw.githubusercontent.com/shoumoji/huit-gcp-study/main/image/image/k8s_arch.png)

今回作成したGKEのクラスタは、Autopilotというモードで作成したため、マスターノードとワーカーノードというノードの存在を意識する必要はありません。マシンリソースが足りなければ自動的にスケールアウトしてくれます。

GKEではAutopilotモード or Standardモードを選べますが、AutopilotはよりGCP側のマネージドな部分が大きく管理が楽になります。(一方で細かい設定ができないデメリットもあります)

引用元: G-gen Tech Blog <https://blog.g-gen.co.jp/entry/gke-explained#GKE-%E3%82%AF%E3%83%A9%E3%82%B9%E3%82%BF%E3%81%AE%E3%82%A2%E3%83%BC%E3%82%AD%E3%83%86%E3%82%AF%E3%83%81%E3%83%A3>

![gke_arch](https://cdn-ak.f.st-hatena.com/images/fotolife/g/ggen-sasashun/20221106/20221106102830.png)

