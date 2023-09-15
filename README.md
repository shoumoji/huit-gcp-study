# huit-gcp-study

[![Open in Cloud Shell](https://gstatic.com/cloudssh/images/open-btn.png)](https://ssh.cloud.google.com/cloudshell/open?cloudshell_git_repo=https://github.com/shoumoji/huit-gcp-study&cloudshell_tutorial=tutorial.md&shellonly=true)

## 事前準備

Trust repo にチェックを入れて進んでください。

![trust_repo](https://raw.githubusercontent.com/shoumoji/huit-gcp-study/main/image/trust_repo.png)

このハンズオンを進めるには GCP のプロジェクトが必要です。個人でGCPプロジェクトを用意する場合、更にプロジェクトに[クレジットカードなどが必須となる「請求先アカウント」を紐づける](https://console.cloud.google.com/billing)必要があります。

なお、**Googleアカウントと請求先アカウントは別物です！** 請求先アカウントとGCPのプロジェクトは1:Nの関係になっており、例えばプロジェクトAとBは請求先アカウント1(に設定されているカード), プロジェクトCは請求先アカウント2(に設定されているカード)のように設定することが可能です。
![billing_account](https://cloud.google.com/static/billing/docs/images/resource-hierarchy-overview.png?hl=ja)

## やること

todo アプリをデプロイする

- project 作成
- フロントエンドのデプロイ (firebase)
- Cloud SQL の構築
- Cloud Run をデプロイ(環境変数を含む)
