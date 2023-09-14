# huit-gcp-study

今回はGCPへの操作は**全てコンソール上でコマンドを用いて**行います。

### 必要なロール(権限)の確認

ハンズオンを進めるためには以下 **1** or **2** の何れかの IAM ロールが必要です。

1. [オーナー](https://cloud.google.com/iam/docs/understanding-roles#basic)
2. [編集者](https://cloud.google.com/iam/docs/understanding-roles#basic)、[Project IAM 管理者](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectIamAdmin)、[Cloud Run 管理者](https://cloud.google.com/iam/docs/understanding-roles#run.admin)

新規にプロジェクトを作った場合、もしくはこちらでプロジェクトを用意した場合問題ないですが、既存のプロジェクトで権限周りを触っている方は注意してください。

#### GCP のプロジェクト ID を環境変数に設定

環境変数 `PROJECT_ID` に GCP プロジェクト ID を設定します。[GOOGLE_CLOUD_PROJECT_ID] 部分にご使用になられる Google Cloud プロジェクトの ID を入力してください。
例: `export PROJECT_ID=huit-dmm-study-ayumin`

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
teachme story.md
```

### **3. gcloud のデフォルト設定**

```bash
source vars.sh
```

途中まで進めていたチュートリアルのページまで `Next` ボタンを押し、進めてください。

## [ハッカソン閉幕寸前]

[最終動作サンプルはこちら](https://huit-todo.web.app/)

3人チームで開発していたあなたは、ハッカソンで画期的なプロダクト「HUIT TODO」を完成させた。
ハッカソンもあと2時間で結果発表というところで、チームリーダーのHaruはあることを口にする。

**「あれ？ このアプリってローカルでしかアクセスできないんですか？」**

残された時間は2時間。インフラ担当のあなたはGoogle Cloud(以下GCP)のことを思い出す。

**「任せてくださいHaru部長！私が2時間でGCP上にアプリをデプロイしてみせます！」**

## chapter 2 アーキテクチャ

(ストーリー考えるの面倒になったので以下普通に解説します)

今回は以下のようなアーキテクチャでWebアプリケーションを構築する。

![architecture](./image/architecture.png)

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

## chapter 3 GCPを使い始める