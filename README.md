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

初期公開URLは `https://loveapple.github.io/baidu.tokyo/`。WorkflowはStaging固定。canonical、OGP、sitemap、robots、静的アセットは同じURL設定を使う。

初回公開前に、管理権限で Settings → Pages → Source を **GitHub Actions** に変更する（現在のlegacy設定ではガードが拒否する）。Custom domainは未設定を維持する。`github-pages` environmentはmain限定、Required reviewers・Wait timerなしにする。今回これらの設定は変更しない。

その後、PRをmainへマージするとQA→配信→公開物検証が自動実行される。追加承認・公開ゲート変数は不要。mainのActions画面から **Run workflow** も実行可能。main以外の手動実行はQAのみでdeployしない。PRからのartifact配信・deployは行わない。

`publication.json` に `mode`・`url`・`source_sha` を保存する。配信直前・配信後にmain HEADとの一致を確認し、公開URLの全ファイルを同じrunのartifactとSHA-256照合する。HTTPエラー・リダイレクト・内容不一致を成功扱いしない。配信後の検証失敗はrunを失敗にするが、公開物を自動で巻き戻すものではない。

## 将来の独自ドメイン切替

ローカルでは `PUBLICATION_MODE=production` を環境変数に設定すると `site=https://baidu.tokyo`、`base=/` でbuild/testできる。未指定はStaging。無効な値はbuildを拒否する。PowerShellでは `$env:PUBLICATION_MODE='production'` を使用し、終了後に `Remove-Item Env:PUBLICATION_MODE` で戻す。

公開切替には別途承認したPRでWorkflowのmodeと独自ドメイン配信禁止ガードを変更し、Pages Custom domain/DNS/HTTPSを確認する必要がある。URL選択だけでドメイン切替はできない。Staging成果物はCustom domainが存在するPagesへの配信を拒否する。DNS・ConoHa VPS・旧WordPress・MySQLの変更や停止は自動化しない。
