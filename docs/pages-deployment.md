# GitHub Pagesの公開方式・比較・QA

確認日: 2026-10-26（日本時間）。参考repoは読み取りのみ。下記はGitHub APIと最新origin/mainから取得した時点の状態であり、将来の設定を保証しない。

## 比較対象

- baidu.tokyo baseline: `1bf21a89386f55e2b58c95ebfbfdd550493f9cc9`（PR #1はすでにマージ済み。本作業ではマージしない）。
- happinesea-site baseline: `d673d5c144956bb3c473016e5e5c9806f8da50a9`。
- 参考: `.github/workflows/deploy.yml`、`astro.config.mjs`、`scripts/publication-deployment.mjs`、GitHub Pages/EnvironmentsのAPI。

| 項目 | happinesea-site | baidu.tokyoの変更・判断 |
| --- | --- | --- |
| トリガー | main push / workflow_dispatch | 同じ。PRのQAも同一Workflowに統合 |
| 公開先 | 本番Custom domain `happinesea.com` とStagingモード | 今回はproject PagesをStagingとして使用。Production URL設定は将来用 |
| 追加承認 | github-pagesは承認者なし。別途production-cutoverに承認者あり | github-pagesに承認者・タイマーを要求しない。production-cutoverは移植しない |
| 公開ゲート | 掲載モード・記事差分などを独自検証 | 旧PAGES_DEPLOY_ENABLEDを削除。URL・SHA・Environmentだけ検証 |
| QA・build | CMS/記事・manual・Googleサービス・ブラウザーを含む | 単一LPのci/check/build/test。CMS・記事公開判定・分析サービス・広告は移植しない |
| 競合対策 | Workflow concurrency、cancel-in-progress=false | main配信を同じgroupで直列化。PRはPR別group |
| 誤配信対策 | モードとPages Custom domainをbuild/deploy前に確認 | Staging固定。Custom domain、URL不一致、legacy Source、main SHA不一致をdeploy前に拒否 |
| 配信後検証 | 同じartifactのHTML・assets・hash・browser | 同じartifact内の全11ファイルをHTTP 200・SHA-256照合。リダイレクトは拒否。ブラウザーは今回ローカルで実施 |
| Actions版 | checkout v7 / setup-node v6 / Pages artifact v5 / deploy v5 / download-artifact v6 | 同じmajorを採用。Node 24 |

## GitHub側の設定状態（読み取り確認のみ）

| 項目 | baidu.tokyo | happinesea-site |
| --- | --- | --- |
| Pages Source | **legacy、main:/**。初回配信前に管理権限でGitHub Actionsへ変更が必要 | workflow |
| Custom domain | null | happinesea.com |
| Pages URL | https://loveapple.github.io/baidu.tokyo/ | https://happinesea.com/ |
| HTTPS | enforced | enforced |
| github-pages承認者/タイマー | なし | なし |
| github-pages許可branch | main | main, gh-pages |
| repository variables | 未設定 | 本作業で変更・移植しない |

APIで現在の認証ユーザーにadmin権限があることは確認したが、今回の作業はDraft PRと設定確認まで。Pages Source/Environment設定は変更していない。Workflowのdefault権限はcontents:read、deploy jobだけpages:write / id-token:writeと読み取り用contents/actions/deploymentsを要求する。PRに配信権限を付与しない。

公開URLとpublication.jsonはどちらも現時点でHTTP **404**。最新Pages build APIは404、Pages deployments一覧は空。このため「公開SHA＝main HEAD」のライブ一致は未成立で、公開完了とは報告しない。

## 初回配信条件

1. 管理者がPages SourceをGitHub Actionsに変更し、Custom domainなし・github-pagesがmain許可かつ承認者/タイマーなしであることを維持する。
2. PRをmainへマージする（本作業では行わない）。main pushによりQA→artifact→guard→deploy→verifyが自動実行される。追加承認変数は不要。
3. マージ時点でSource切替が未完了ならguardで失敗する。切替完了後、mainのRun workflowで再実行する。古いSHAのrun再実行はmain HEAD不一致なら拒否する。
4. 配信後のログで公開URL・GITHUB_SHA・main HEADの一致と全ファイル照合を確認する。`publication.json`のsource_shaがbuild由来の公開SHAとなる。mainが検証中に更新された場合は古いrunを成功扱いしない。

WorkflowはStaging固定。URL設定は`PUBLICATION_MODE`で切替可能だが、Productionの自動配信を有効化するものではない。独自ドメイン切替前には別途承認したPRでWorkflow modeと禁止ガードを更新し、Custom domain/DNS/HTTPSの切替順序・旧URL・復旧手順を確認する。

## QA

- `npm ci`: 成功。271パッケージ、audit 0 vulnerabilities。
- `npm run check`: 0 errors / warnings / hints。
- StagingとProductionの両方で`npm run build`と`npm test`: 各19テスト成功。最終distはStagingへ戻した。
- modeの誤入力、Custom domainへのStaging配信、URL/Source/過去SHA/branchの不一致、Environment承認者・タイマー、公開データの差異・リダイレクト・空成果物を拒否するテストを実施。
- StagingローカルHTTPサーバーへ、配信後と同じverifyFilesを実行。HTML/CSS、OGP、favicon、火風鼎SVG、表紙、sitemap、robots、publication.jsonの全11ファイルがbuildと完全一致。
- Chromium: 320 / 390 / 768 / 1280pxで横はみ出しなし、全画像読み込み成功、canonicalがStaging URL。Desktop/Mobileの全ページスクリーンショットをローカル `.qa/pages-1280.png` / `.qa/pages-390.png` に保存し目視確認。
- 火風鼎SVGとOGP/faviconの爻の検査は既存テストで継続。既存LPの文章・見た目は変更しない。
- 最終diffの自己レビューと独立レビューを実施。GitHub Actions上のQA結果は作成したDraft PRのChecksで確認する。

## 未実施・制限

- mainマージ、実deploy、公開SHAライブ照合は未実施（現在404）。これらの検証コードをWorkflowに実装済み。
- 設定変更、DNS/ConoHa VPS/旧WordPress/MySQL操作は行わない。
- 実機モバイル・Safari/Firefox・SNS側OGP取得は未実施。
- 配信後の照合失敗はrunを失敗にする。自動rollbackや公開物の削除は行わない。
