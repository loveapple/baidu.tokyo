# GA4・Amazonクリック・運営情報（2026-10-27）

## 範囲

基点 main 3f5cb08。mainには単一LPのみで、記事・ニュース・Pages CMS設定・既存GA/GTM・同意管理・問い合わせページは存在しない。存在しないCMS等は作らず、公開Workflow・Pages/DNS設定は変更しない。共通SiteLayout/Footerに既存head/footerを移し、LP本文・書籍URLとアソシエイトタグは維持する。

## 計測

設定は src/config/site.mjs に一元化。本番buildのみタグを出力し、実行時も正確な https://baidu.tokyo origin を要求する。localhost・Staging・webdriver・DNT・GPCではGAを読まない。E2E専用buildは PUBLICATION_MODE=production ANALYTICS_DISABLED=true を併用可能。IDの出力と配信モードのテストもこれに対応する。

configは一度だけで自動page_viewを使用し、手動page_viewを重ねない。ページURLはquery/hashを除き、referrerは空、page_titleは固定。Amazonイベントのパラメータはarticle_pathとamazon_domainのみ。自由入力の書籍名やリンクqueryは送らない。

Amazon電子書籍の購入・紹介リンクには data-amazon-book 属性を付ける。既存の購入リンクと出典商品ページの2リンクが対象で、著者紹介は対象外。将来CMSで追加する場合も、電子書籍の対象リンクだけに同属性を付け、共通SiteLayoutを使うこと。動的に追加された属性付きリンクもdocumentの委譲イベントで扱う。明示属性とAmazonの許可ホストの両方が必要で、単なる外部リンクは対象にしない。

clickは左クリック・Enter・修飾キー、auxclickは中クリックのみ。preventDefaultや遷移遅延を使わない。amazon_1はクリック数であり、購入・成約件数ではない。

Googleの拡張計測や管理画面側設定は変更・検証していない。Googleによる情報処理の説明はプライバシーページから公式資料へリンクする。
- https://developers.google.com/analytics/devguides/collection/ga4/events?hl=ja
- https://policies.google.com/technologies/partner-sites?hl=ja

## 運営とLINE

operator / privacy / contact の3ページを追加。ブランド「燊然」、運営「個人事業主 happinesea」。既存の著者名・燊然居士ブランドは維持。所有者指定によりお問い合わせはLINE公式アカウントへ案内する。住所・電話・個人氏名や架空の店舗、フォーム、EC・有料相談は追加しない。将来の学習ツール・AI支援は検討中かつ未提供と明記し、開始予告はしない。

LINE ID・表示名・URLは共通設定。指定URLはLINEの「Add LINE friend」ページに応答し指定IDを含むが、アプリ上の表示名・所有権・チャット受付可否までは確認できない。友だち追加やメッセージ送信・管理画面変更は行っていない。

## QA

npm ci（監査0 vulnerabilities）、check、Staging/Production build/test 各32件。追加テストは本番タグ一度・非本番/自動ブラウザ/プライバシー信号で無送信・対象Amazonのみ・遷移非阻害・共通footer/IDの出力を確認。

npm run test:e2e はPlaywrightが利用可能な環境でProduction build後に実行する。外部通信を全てローカル応答に置換し、本番GAへ送信しない。4ページ×Desktop1280/Mobile390の表示、横はみ出し、読込エラー、footer、webdriverで無計測、模擬本番でclick/Enter/middle/Ctrl各1回を確認。画面は .qa/analytics-*.png（追跡対象外）。PLAYWRIGHT_MODULEに既存Playwrightのindex.mjs、BROWSER_EXECUTABLEに既存ブラウザの絶対パスを指定可能。リポジトリの追加依存はない。

## 所有者の確認事項

- 公開後にGA4リアルタイム/DebugViewでpage_view・amazon_1の受信を確認する。ローカル/E2Eはキューを検査するだけで実受信成功ではない。
- LINEアプリで表示名・対象アカウントを確認し、LINE Official Account Managerでチャット受付と対応運用を確認する。
- LINE認証申請が追加の本人情報等を要求する場合は所有者が判断する。申請代行・設定変更や、将来の事業用の個人情報追加は今回の範囲外。
