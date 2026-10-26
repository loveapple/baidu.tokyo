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
- `.github/workflows/deploy.yml`: PRはQAのみ、main pushとmainの手動実行はQA成功後に自動配信
- `scripts/publication-config.mjs`: Staging/ProductionのURL設定
- `scripts/pages-deployment.mjs`: 配信先ガード、公開SHAと成果物の照合

掲載情報は [docs/sources.md](docs/sources.md)、最新の公開方式・比較・QAは [docs/pages-deployment.md](docs/pages-deployment.md) を参照。[docs/qa.md](docs/qa.md) は初期LPの検証記録。

## GitHub Pages Staging

PagesのCustom domainが未設定なら `https://loveapple.github.io/baidu.tokyo/`、`baidu.tokyo`なら `https://baidu.tokyo/` を選択する。別ドメイン・URL不一致は拒否する。PRとmain以外の手動実行は両モードのQAのみ。canonical、OGP、sitemap、robots、静的アセットは同じURL設定を使う。

Pages SourceはGitHub Actions、`github-pages` environmentはmain限定、Required reviewers・Wait timerなしを使用する。2026-10-26の確認時点ですでにこの構成で、Custom domainは未設定。Staging公開済み。今回これらの設定は変更しない。

その後、PRをmainへマージするとQA→配信→公開物検証が自動実行される。追加承認・公開ゲート変数は不要。mainのActions画面から **Run workflow** も実行可能。main以外の手動実行はQAのみでdeployしない。PRからのartifact配信・deployは行わない。

`publication.json` に `mode`・`url`・`source_sha` を保存する。配信直前・配信後にmain HEADとの一致を確認し、公開URLの全ファイルを同じrunのartifactとSHA-256照合する。HTTPエラー・リダイレクト・内容不一致を成功扱いしない。配信後の検証失敗はrunを失敗にするが、公開物を自動で巻き戻すものではない。

## 将来の独自ドメイン切替

ローカルでは `PUBLICATION_MODE=production` を環境変数に設定すると `site=https://baidu.tokyo`、`base=/` でbuild/testできる。未指定はStaging。無効な値はbuildを拒否する。PowerShellでは `$env:PUBLICATION_MODE='production'` を使用し、終了後に `Remove-Item Env:PUBLICATION_MODE` で戻す。

実際の切替は別途承認後、Pages Custom domain/DNS/HTTPSを変更・確認する。Workflowは設定された配信先を読み取るだけで、ドメイン設定を変更しない。StagingとProductionのartifactは相互に誤配信を拒否する。公開検証の成功にはEnforce HTTPSも必要。

現状のDNS不一致・メール依存・切替順序・復旧条件は [docs/custom-domain-cutover.md](docs/custom-domain-cutover.md) を参照。実切替は未実施で、DNS・ConoHa VPS・旧WordPress・MySQLの変更や停止は自動化しない。
