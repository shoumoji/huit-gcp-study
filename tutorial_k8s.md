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

今回の目標は、**GKEを使ってNginxをデプロイし、インターネット経由でNginxの初期ページを表示する** ことです。

もし先に進める人はどんどん先に進んでしまって構いません。資料不備などを見つけたら教えていただける(プルリクも大歓迎)と助かります。

なお早く終わって暇な人は、ハッカソン編(part1)で使ったtodoアプリの[api](/api), [フロントエンド](/frontend), postgreSQLをデプロイしてみてください。
APIとフロントエンドはDockerfileを用意してありますので、それを使ってコンテナを作成し、Artifact Registry にpushしてGKEにデプロイが可能です。

Artifact Registry に push する方法は[tutorial_hackathon.md](/tutorial_hackathon.md)を参照してください。

### 技術詳細

#### 使用するサービス

**Google Kubernetes Engine (GKE)**

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

一言でいえば、Dockerfileを元に作る隔離された仮想環境です。

`docker build .` でDockerfileを元に**コンテナイメージ**を作成し、`docker run` でコンテナイメージを元に**コンテナ**を作成します。(コンテナイメージとコンテナは別物です。ちょうどクラスとインスタンスのような関係で、Dockerfileとコンテナイメージは1対1, コンテナイメージとコンテナは1対多の関係があります。)
より詳細にコンテナについて学びたい方は、[itmediaの記事](https://atmarkit.itmedia.co.jp/ait/articles/2108/23/news022.html)がよくまとまっているので一見の価値があります。

正確に言うと、コンテナは隔離された環境でアプリケーションを実行するための仕組み全般を指すので、Docker以外にもコンテナ技術は存在します。

ただ、この辺の背景は少し情報量が多いので、一旦Web業界においてコンテナは基本的にDockerコンテナのことと思って差し支えありません。

もっと厳密にしっかり知識を得たい方は、[コンテナランタイムについての記事](https://www.publickey1.jp/blog/20/firecrackergvisorunikernel_container_runtime_meetup_2.html)と、発表者のinductorさんのブログなどがとても参考になります。

### Kubernetesとは？

コンテナを管理するためのオーケストレーションツールです。

2000年代後半にDockerが誕生してから、取り回しがよいコンテナ技術が急速に企業に普及していきました。
その一方で、システムの複雑化により大企業が使用するコンテナは億単位の規模となり、コンテナの管理が難しくなっていきました。

当初からコンテナ技術に貢献していたGoogleは、大規模なコンテナシステムを管理するシステム「Borg」を開発します。
これが今のコンテナオーケストレーションシステムのデファクトスタンダードとなるKubernetes(以下k8s)の誕生につながります。

k8s は非常に多機能かつ仕様変更が激しいOSSですが、今回はk8sの基本的な機能を使ってコンテナをデプロイすることを目的としているので、k8sの詳細については割愛します。
k8sエコシステム全体を俯瞰したい場合、[Kubernetesの知識地図](https://gihyo.jp/book/2023/978-4-297-13573-7)という本が初心者向けで分かりやすいのでおすすめです。

## GKE クラスタを作成する

### GKE クラスタの作成

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

クラスタは、**k8sシステムの最大単位** です。クラスタはk8sの様々な機能や、実行するためのノード(マシン)を内包した概念です。一般にk8sと言った場合、厳密にはクラスタを指していることが多いです。

Linuxサーバ(自宅サーバやVPS, EC2など)を使ったことがある人であれば、それらがクラスタを構成するノードに該当する、と捉えると分かりやすいかもしれません。

クラスタは、k8sのマスターノード(コントロールプレーン)とワーカーノードの2種類のノードで構成されています。管理系の機能を持つのがマスターノード、実際にアプリケーションがデプロイされ、それを実行するのがワーカーノードです。

一般的な構成では単一障害点を防止するため、この2種類のノードを、更に複数のノード上にデプロイさせます(マスターノードを3台、ワーカーノードを6台、合計9台のマシンでk8sクラスタを作る、といった具合です)。ですので、基本的にk8sクラスタを作るにはマスター、ワーカーそれぞれ1台で2台以上のマシンが必要となります。

ただし最近では手軽にk8s環境を作るためのツールも増えており、その2ノードの機能を1つのマシン上にデプロイできるツールもあります。(kind, microk8sなどがその代表例で、ローカル開発環境としてよく使われます)

引用元: イラストでわかるDockerとKubernetes 図3-4

![k8s_arch](https://raw.githubusercontent.com/shoumoji/huit-gcp-study/main/image/k8s_arch.png)

今回作成したGKEのクラスタは、Autopilotというモードで作成したため、マスターノードとワーカーノードというノードの存在を意識する必要はありません。マシンリソースが足りなければ自動的にスケールアウトしてくれます。

GKEではAutopilotモード or Standardモードを選べますが、AutopilotはよりGCP側のマネージドな部分が大きく管理が楽になります。(一方で細かい設定ができないデメリットもあります)

引用元: G-gen Tech Blog <https://blog.g-gen.co.jp/entry/gke-explained#GKE-%E3%82%AF%E3%83%A9%E3%82%B9%E3%82%BF%E3%81%AE%E3%82%A2%E3%83%BC%E3%82%AD%E3%83%86%E3%82%AF%E3%83%81%E3%83%A3>

![gke_arch](https://cdn-ak.f.st-hatena.com/images/fotolife/g/ggen-sasashun/20221106/20221106102830.png)

### GKE クラスタに接続できるかテストする

GKEクラスタが作成されたら、k8sクラスタを操作してみましょう。
k8sクラスタへの操作はk8sクラスタのコントロールプレーンが持つWebAPIを用いて行います。

しかし、毎回WebAPIを叩いて操作するのは非常に大変なので、一般には**kubectl**という専用のコマンドラインツールを使います。
kubectl はk8sを扱う上で必須のツールなので、k8sとセットで覚えておきましょう。

余談ですが、k8sの操作の実体はWebAPIなので、当然フロントエンドツールは何でもよく、kubectlの他にもダッシュボードのような専用のGUIツールもあります。
更に言えば、GoでもPythonでもcurlでも、ブラウザ(GUIツールは基本ブラウザ上で動かします)からでもk8sクラスタを操作することができます。

プログラム言語を使うことで、例えばSlackのBotを用いてSlackからk8sクラスタの操作をトリガーして何らかの処理を行う、ということは実際に業務でも行われています。
また、なんと[Java版のMinecraftがWebAPIを叩けることを利用し、Minecraftでk8sクラスタを管理しようとする猛者もいます。](https://gigazine.net/news/20220107-kubecraftadmin/)(Pod(コンテナ)と動物が対応しているらしい。視覚的に見やすい…のか…？)

それはともかく、本ハンズオンでは一般的に使用されているkubectlを使ってクラスタに接続・操作してみます。

- GKEの認証情報をkubectlに設定します
	```bash
	gcloud container clusters get-credentials asia-northeast1
	```
- kubectlが正しくGKEと接続できているか確認するため、ノード一覧を出力します
	```bash
	kubectl get nodes
	```
	ここで何行か出力されればOKです。

## GKE クラスタにNginxをデプロイする

さて、ここからは本格的にNginxのデプロイに移ります。

その前に、Nginxのデプロイに使用する機能を少し準備します。

### namespaceを作成する

namespaceとは、k8sクラスタ内のリソースを分離するための機能です。

k8sのユースケースといえば、マイクロサービスという単語を聞いたことがある方もいらっしゃるのではないでしょうか。
マイクロサービスでは、アプリケーションを機能単位で分割し、それぞれを独立したサービスとして実装します。
例えば、ユーザー管理機能、商品管理機能、決済機能などをそれぞれ別のサービスとして実装し、それらを組み合わせてアプリケーションを構成します。

これにより、特定のサービスの修正はサービス内に閉じることができ、インタフェースさえ変更がなければ他の機能に影響が出ることを避けられます。

k8sは、一般的な1マシン1サービスのような構成でなく、1クラスタで複数サービスを動かすことを想定しているシステムです。
当然k8sクラスタには、様々な種類のコンテナが動くことが想定されます。

ですのでk8sには、コンテナを論理的に分離する機能、namespaceが備わっています。よく使われるケースとして、`チーム単位でnamespaceを分ける` という使い方があります。
例えば決済チームは `payment` というnamespaceを使い、商品チームは `product` というnamespaceを使う、といった具合です。

この機能はユーザだけでなく、k8sシステム自体でも活用されています。
具体例として、k8s自体によって作られるオブジェクト(コンテナ等)は`kube-system`というネームスペースに入っています。せっかくなのでkube-systemネームスペース内に存在するコンテナについて確認してみましょう。(-n で namespace を指定してコマンドを実行します)

```bash
# なぜpodsという名前なのかは後で説明します
# 今は pod == コンテナ と思っていただいてOKです
kubectl get pods -n kube-system
```

様々なコンテナが動いていることが確認できると思います。これらのコンテナが、GKEで構築されたk8sシステム自体の動作に必要なコンテナです。ちなみにGKEのAutopilotモードでは、kube-systemに存在するコンテナをユーザが操作することはできません。(GCP側が管理してくれます)

説明も終わったところで、Nginxをデプロイするためのnamespaceを作成します。
ここからはデプロイも含め様々な設定をk8sクラスタに行っていきますが、k8sクラスタに対する設定を全てyaml形式の「マニフェスト」という形式で作成してあります。
このファイルをクラスタにapplyすることで、k8sクラスタに対する設定やコンテナのデプロイなど、様々な操作を行うことができます。

マニフェストのapplyは、 `kubectl apply -f <マニフェストファイルのパス>` というコマンドで行います。

- まず、今回使うマニフェストを確認します
	```bash
	# cloud shell の エディタで閲覧してもOKです
	cat manifests/nginx/namespace.yaml
	```
	このマニフェストは、`huit-k8s-nginx` という名前のnamespaceを作成するためのマニフェストです。
	```yaml
	apiVersion: v1 # 使用するk8sのWebAPIバージョン。k8sクラスタのバージョンによって異なる。
	kind: Namespace # このマニフェストで行うワークロードの種類。今回はnamespaceの設定なのでNamespaceとなる。
	metadata:
	  name: huit-k8s-nginx # 作成するnamespaceの名前。任意のネームスペース名をつけられる。
	  labels:
		name: huit-k8s # このnamespaceにつけるラベル。複数のネームスペースをまとめるために使う。
	```
- `huit-k8s-nginx` という名前のnamespaceを作成します
	```bash
	# manifests/nginx/namespace.yaml にどんな namespace を作成するか記述しています
	kubectl apply -f manifests/nginx/namespace.yaml
	```
- 補足: マニフェストを使わずに kubectl で直接 namespace を作成することもできます
	```bash
	kubectl create namespace huit-k8s-nginx # namespaceを作成
	kubectl label namespaces huit-k8s-nginx name=huit-k8s --overwrite=true # 作成したnamespaceにラベルを付与
	```

### Nginx をデプロイする

さて、ここからはNginxをデプロイしていきます。

先ほどの namespace の作成ではマニフェストにも書いてあった通り、`Namespace` というワークロードを使いました。

今回はコンテナのデプロイですので、 `Deployment` というまた別のワークロードを使用します。
一般的にWebアプリケーションはDeploymentを使ってデプロイするので、namespaceと並んで使用頻度が高いワークロードです。

デプロイの前に、`Pod` という概念について説明します。Podとは、k8sクラスタにおける最小単位で、1つ以上のコンテナを含む概念です。
Podは、コンテナを論理的にまとめるための概念です。例えば、Webアプリケーションの場合、WebサーバとDBサーバは別々のPodとして作るのが一般的です。

とはいえ、なんとなくピンと来ない方もいると思います。
感覚的に複数の機能を持つコンテナ(API, DB, フロント等)を同時に起動する `docker compose` と、単一のコンテナを起動する `docker run` のちょうど間ぐらいに位置するのがPodという概念です。

一言で言えば、Podは特定機能のコンテナとその機能を補助するコンテナ(サイドカーコンテナとも)をまとめるものです。例えばログルーティングのツールであるFluentdのコンテナとWebAPIのコンテナを一緒にPodにまとめ、ログをs3に送る、といったことがよくあるユースケースです。

なお今回はNginxの公開イメージを使うので、コンテナのbuildやpushは不要です。

- 今回使うマニフェストを確認します
	```bash
	cat manifests/nginx/deployment.yaml
	```
	このマニフェストは、NginxをDeploymentとしてデプロイするためのマニフェストです。
	```yaml
	# 使用するk8sクラスタのWebAPIバージョン
	apiVersion: apps/v1
	# このマニフェストで行うワークロード
	kind: Deployment
	metadata:
	  namespace: huit-k8s-nginx # このDeploymentを作成するnamespace名
	  # Deployment自体の名前
	  # kubectl get deployments -A などをすると、この名前が表示される
	  name: nginx-deployment
	  labels:
	    # このDeployment自体のラベル
		# kubectl get deployments -l app=nginx などで絞り込むときに使う
		app: nginx
	spec:
	  # 作成・維持するPodの数。この値の数になるようにクラスタでPodを管理する
	  replicas: 3
	  selector:
		matchLabels:
		  # どのPodがこのDeploymentによって管理されるか決める
		  # 基本的にspec.template.metadata.labelsに存在するラベルと同じものを指定する
		  app: nginx
	  template:
		metadata:
		  labels:
			app: nginx # このDeploymentで作成されるPodに付与されるラベル
		spec:
		  containers:
			- name: nginx # コンテナ名
			  image: nginx:latest # コンテナイメージ名
			  ports:
				- containerPort: 80 # コンテナが公開しているポート番号(TCP)
	```
	- Nginx をデプロイします
	```bash
	kubectl apply -f manifests/nginx/deployment.yaml
	```
	- Nginx がデプロイされたか確認します
	```bash
	kubectl get pod -n huit-k8s-nginx
	```
	3つのPodが作成されていることが確認できれば成功です。

## インターネット経由で Nginx に接続できるようにする

### Service を作成する

さて、ここまででNginxはデプロイできました。

しかし、現状ではクラスタ内からしかNginxのPodにアクセスできません。
そのためには、何らかのIPアドレスを使いアクセスすることになります。

Pod自身もIPアドレスを持っているため、それを使うことは可能ですが、PodのIPアドレスでアクセスすることは障害対応などを除き**ほぼありません**。
理由として、**PodのIPアドレスは頻繁に変わってしまう**ことが挙げられます。基本的にコンテナはエフェメラル(短命)なので、アップデートや、コンテナが死んだときなどどんどん入れ替わります。そのたびにPodごと切り替わるため、IPアドレスも当然変わってしまいます。

これを解決するには、まずPodを `Service` という単位でPodをIPアドレス以外の方法でまとめる必要があります。
ここで使用するのが、先ほどDeploymentで使用した `label` という概念です。Serviceでは、Podをラベルで絞り込み、そのPodたちに対してIPアドレスを付与します。

Serviceでまとめることで、labelで選択したPodたちに対して、共通のIPアドレスを付与できるようになります。
また、Serviceはロードバランシングの機能を持っており、複数のPodに対して負荷を振り分けることができます。
PodとServiceは以下のような関係を持ちます。

引用元: イラストでわかるDockerとKubernetes 図3-14
![pod_service](https://raw.githubusercontent.com/shoumoji/huit-gcp-study/main/image/pod_service.png)

では、Serviceを作成してみます。

- 今回使うマニフェストを確認します
	```bash
	cat manifests/nginx/service.yaml
	```
	このマニフェストは、NginxのPodをServiceとして一纏めにするためのマニフェストです。
	```yaml
	```
- service を作成します
	```bash
	kubectl apply -f manifests/nginx/service.yaml
	```
- service が作成されたことを確認します
	```bash
	kubectl get service -n huit-k8s-nginx
	```

### Service をインターネットに公開する

最後に、先ほど作成したServiceをインターネットに公開します。

Serviceは `ClusterIP` というIPを持ちますが、このIPはクラスタ外部からのアクセスができません。
これをインターネットに公開するためには、以下の3つの方法があります。

- NodePort でノードの持つポートをServiceに紐づける (L4(トランスポート)レイヤ)
- LoadBalancer でロードバランサへのTCPやUDPのアクセスをServiceに紐づける (L4(トランスポート)レイヤ)
- ingress でHTTPリクエストをServiceに紐づける (L7(アプリケーション)レイヤ)

図にすると、以下のような関係になります。

引用元: イラストでわかるDockerとKubernetes 図3-17
![public_service](https://raw.githubusercontent.com/shoumoji/huit-gcp-study/main/image/public_service.png)

今回はHTTPサーバであるNginxを公開するので、ingressを使って公開します。

- 今回使うマニフェストを確認します
	```bash
	cat manifests/nginx/ingress.yaml
	```
	このマニフェストは、NginxのPodをまとめたServiceをインターネットに公開するためのマニフェストです。
	```yaml
	```
- ingress を作成します
	```bash
	kubectl apply -f manifests/nginx/ingress.yaml
	```
- ingress が作成されたことを確認します
	```bash
	kubectl get ingress -n huit-k8s-nginx
	```
- 最後に、手元のブラウザからNginxに接続できることを確認します。
