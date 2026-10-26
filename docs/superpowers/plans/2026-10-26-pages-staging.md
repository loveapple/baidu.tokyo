# Pages Staging Implementation Plan

Goal: happinesea-siteの公開方式を単一LPに必要な範囲で採用する。mainマージ・設定変更・実デプロイは行わない。

Architecture: PUBLICATION_MODEでAstroのURLを選択。PRはQAのみ。main push/manual dispatchはQA成功後にPages設定・Environment・main SHAを確認して配信。公開ファイルは同じrunのdistとhash照合する。

- [x] URL選択・誤配信拒否・公開物照合の失敗テストを追加する。
- [x] config、Pages guard、publication.json、配信後検証を実装する。
- [x] Workflowをmain/dispatch自動配信に変更し、旧承認変数を削除する。
- [x] npm ci/check/build/test、両URLモード、Desktop/Mobile/SVGを検証する。
- [x] 比較・設定状態・初回配信条件・未確認事項を文書化し、自己レビューとDraft PR作成を行う。

Constraints: DNS/ConoHa/WordPress/MySQLに触れない。production設定は将来用でありドメイン切替を承認するものではない。異なるorigin/base、redirect、SHA不一致は成功扱いしない。
