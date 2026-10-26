# QA結果

実施日: 2026-10-26（日本時間）。Windows / Node.js v24.11.1 / npm 11.6.2。

## ローカル検証

| 項目 | 結果 |
| --- | --- |
| `npm ci` | 成功。lockfileから271パッケージを再インストール。audit 0 vulnerabilities。 |
| `npm run check` | 0 errors / 0 warnings / 0 hints。 |
| `npm run build` | 成功。静的LP 1ページ、robots.txt、sitemapを生成。 |
| `npm test` | 4件成功 / 失敗0件。日本語構造・書籍同一性・禁止内容、SEO URL整合、ローカルアセット・アンカー・画像寸法属性、deploy条件を検証。 |
| `git diff --cached --check` | 成功。 |
| HTTPスモーク | LP、robots.txt、sitemap-index.xml、OGP PNG、書籍表紙で数値HTTP 200を確認。 |
| 静的出力 | 9ファイル、合計88,053 bytes（圧縮前、最終ローカルbuild）。ブラウザーでscript数0、表紙読み込み成功を確認。 |

テストを先に作成し、実装・生成物がない状態で4件が失敗することを確認した。実装後のテストは、robots.txtのbase末尾による二重スラッシュを検出した。baseを正規化して解消。禁止語検査がCSS classの`byline`にも一致する誤検出は、`LINE`の単語境界指定に修正した。

Windowsではプレビュー実行中の`npm ci`がnative moduleのファイルロックで一度失敗した。自分が起動したプレビューを停止し、`npm ci`からcheck/build/testまで再実行してすべて成功した。管理者権限の使用や他プロセスの停止は行っていない。

## ブラウザーQA

ローカルのbuild済み成果物をChromiumで確認した。

- 320 / 375 / 390 / 768 / 1280 / 1440px の6幅で `scrollWidth <= clientWidth` を確認。
- 390pxとデスクトップで全ページスクリーンショットを目視確認。書籍表紙、背景色、見出し、各セクションの配置を確認。
- 320px検査で円形装飾の回転に起因する横はみ出しを検出。円の不要な回転を外し、6幅を再検証して解消。
- Tabで「本文へ移動」にfocusし、Enterで`main`にfocusが移ることを確認。ナビゲーションの「書籍」で`#books`へ移動することを確認。
- h1は1つ、日本語lang、意味のある見出し階層、画像alt、focus-visible、装飾aria-hidden、reduced-motion対応をソースとアクセシビリティツリーで確認。
- 最終画像はローカル `.qa/desktop.png` と `.qa/mobile.png` に保存（Git対象外）。エミュレーションは解除済み。検証用サーバーは停止。

## レビュー・公開境界

自己レビューで承認条件・生成URL・ワークフロー・最終差分を確認。別コンテキストのSolレビューは、ソース・公開条件・テスト・出典について重大/重要の指摘なし。外部資料の再取得やブラウザー操作は独立レビュアーの対象外。

Amazon商品・著者ページの確認記録は [sources.md](sources.md)。本文は要約で、既刊を易経の本として扱わず、今後のテーマと区別した。未出版書籍やサービスの日程・開始予告なし。

GitHub repository variablesは未設定、Pages APIのGETは404。設定変更・デプロイ・DNS/VPS操作は行っていない。`main`の比較先は空の初期コミットのみ。

## 未実施・残課題

- GitHub ActionsのLinux上の結果は [Draft PR #1 のChecks](https://github.com/loveapple/baidu.tokyo/pull/1/checks) で、最新headに対応する結果を確認する。ローカルの成功とは区別する。公開ジョブの実行は対象外。
- 実機iOS/Android、Safari/Firefox、スクリーンリーダー実機、SNSプラットフォームのOGP取得は未検証。
- 最終的な表紙利用権の確認、マージ・公開承認、Pages Sourceと承認変数の設定は公開担当者の作業。独自ドメイン切替は別途承認・計画する。
