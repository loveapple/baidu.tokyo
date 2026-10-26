# baidu.tokyo

燊然居士の日本語著者・電子書籍紹介LP。Astroで静的HTMLを生成し、クライアントJavaScript、外部フォント、DB、フォームを使わない。

## 開発・QA

Node.js 24（`.node-version`）とnpmを使用。

```sh
npm ci
npm run check
npm run build
npm test
npm run preview -- --host 127.0.0.1
```

プレビュー: http://127.0.0.1:4321/baidu.tokyo/ 。`npm test` はbuild済みの `dist/` を検査する。Windows・Linux共通のNode標準test runnerを使用。

- `src/pages/index.astro`: 文面・SEO/OGP・構造
- `src/styles/global.css`: 和紙色・墨色・朱色、レスポンシブ表示とfocus表示
- `astro.config.mjs`: Pagesのsite/baseとsitemap
- `src/pages/robots.txt.ts`: 同じsite/baseからrobots.txtを生成
- `public/images/`: 確認済み書籍表紙、独自のOGP画像とSVG原稿
- `tests/site.test.mjs`: 出力HTML、ローカルアセット、リンク、SEO、公開条件の検証
- `.github/workflows/pages.yml`: PR/mainで検証、承認されたmain pushだけデプロイ

掲載情報の根拠は [docs/sources.md](docs/sources.md)、検証結果は [docs/qa.md](docs/qa.md) を参照。

## 公開切替（このPRでは実施しない）

初期の公開候補URLは `https://loveapple.github.io/baidu.tokyo/`。まだデプロイしていない。`https://baidu.tokyo/` は既存サイトのためcanonicalに使用していない。

1. Draft PRの内容、書籍情報、表紙の利用権を確認し、公開担当者がマージと公開を明示承認する。
2. GitHubの Settings → Pages → Source を **GitHub Actions** に設定する。必要なら `github-pages` environmentに承認者を設定する。これらの設定は本作業では変更しない。
3. 承認後にPRをmainへマージする。承認変数が未設定の間はbuild/testのみで、公開しない。
4. 公開担当者が repository variable **`PAGES_DEPLOY_ENABLED=true`** を設定し、mainに次の承認済みコミットをpushする。またはマージ前に変数を設定して、そのマージを公開トリガーにする。
5. Actionsのbuild/deploy完了後、上記URLのHTTP応答、画像・CSS、canonical、OGP、sitemap、robotsを確認する。失敗時は `PAGES_DEPLOY_ENABLED` をfalseに戻して追加配信を止め、修正をPRでレビューする。変数の無効化だけでは既存の公開物は取り下げられない。

ワークフローを手動実行するトリガーはなく、PRイベントからのdeployもない。Pages自動有効化の処理やCNAMEは追加していない。

独自ドメインを使う将来の切替では、別途承認した作業として、`astro.config.mjs` のsiteを `https://baidu.tokyo`、baseを `/` に変更し、URLの回帰テストを更新する。その後にPagesのCustom domain、DNS、HTTPS、旧URLや旧VPSの扱いを計画・確認する。本PRはDNS・旧VPS・本番公開設定を変更しない。ドメイン切替と旧VPS停止は自動化しない。

空リポジトリのため、PR比較先のmainはファイルのない初期コミットのみ。LP・依存関係・CIはすべて作業ブランチに含める。
