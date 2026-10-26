# Production CSS 404 復旧（2026-10-26）

## 原因と現状

main `4c05046a73e33cf6d3c00d7790a1dc96e35a9f1a` の run 40313448583 は select で停止し、build/deploy は未実行。Pages は Actions / cname=baidu.tokyo だが html_url=http://baidu.tokyo/、https_enforced=false。旧ガードは https://baidu.tokyo/ との完全一致を要求した。

公開 publication.json は staging / SHA e6eed12f83bd1faca691ff87ecc5a81fc4fa3ae0。HTML は /baidu.tokyo/_astro/ と /baidu.tokyo/images/ を参照するため独自ドメインでは404。Production build は /_astro/ と /images/、favicon は /favicon.svg を生成する。

調査中に証明書は approved に進み、通常の証明書検証付き HTTPS HEAD は200になった。ただし HTTPS 強制は無効で、最終公開完了とは判定しない。

## 最小修正

- site=https://baidu.tokyo、base=/ は変更しない。
- Actions Source と正確な custom domain の検査を維持し、Production かつ https_enforced=false の場合のみ、Pages API の正確な http://baidu.tokyo/ を許可する。異なるドメイン・ポート・パス、HTTP Staging、HTTPS強制時のHTTPは拒否する。
- 同じ検査を select と deploy guard で共有する。main HEAD、成果物のpublication.json、公開ファイル全件のバイト照合、リダイレクト拒否を維持する。
- 配信検証は Pages API のURLに対して行い、HTTPS強制が有効ならHTTPSで再照合する。無効ならActions Summaryへ HTTPS final verification: PENDING を出す。TLS検証は無効化しない。

## 実行と完了条件

このPRはDraft。マージ・手動デプロイ・Pages/DNS変更は実施していない。

承認後にmainへマージすると通常のpush WorkflowでProductionをbuild/deployする。手動再実行はmainを指定した workflow_dispatch を使用する。現在のmainを手動実行するだけでは旧ガードで停止するためコード修正が必要。

配信後は公開publication.jsonのmode=production・url=https://baidu.tokyo/・source_sha=main HEAD、およびHTML/CSS/画像全件の成果物一致を確認する。HTTPS強制未成立なら配信成功のみで、移行完了ではない。管理者が証明書・HTTPS強制を確認した後、main Workflowを再実行し HTTPS final verification: PASS を確認する。実行中にmainが更新された場合は古いSHAを拒否し最新mainで再実行する。

## QA

npm ci、astro check（エラー・警告0）、Staging/Production build、各29テスト成功。HTTP/HTTPS準備状態・不正ターゲット・SHA不一致・リダイレクト・公開バイト不一致を検証。Productionルート参照、canonical/OGP/sitemap/robots、火風鼎SVGの既存検証を実行。

Desktop 1280px / Mobile 390px をローカルProduction成果物で確認。HTTPエラー0、画像読込成功、横はみ出しなし。画面キャプチャは .qa/css-recovery-1280.png / css-recovery-390.png（追跡対象外）。独立レビューで重要指摘なし。
