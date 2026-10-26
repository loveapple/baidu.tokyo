# Production移行準備計画

Goal: 現在のStagingを検証し、独自ドメインでの自動配信と切替・復旧を準備する。mainマージ・Custom domain設定・DNS変更・VPS停止・DB変更は行わない。

- [x] main SHAと公開成果物、Pages/DNS/VPS依存を読み取り確認する。
- [x] Production/Stage選択と双方向誤配信ガードを失敗テストから整備する。
- [x] URLモードをPages設定に合わせて選択し、main/手動の追加承認なし運用を維持する。
- [x] 両URL build/test、Productionの全ローカルURL/assetと表示を確認する。
- [x] DNS不一致・メールなどの未確認項目、DNS値、切替順序と復旧条件を文書化する。
- [x] 自己レビュー・独立レビューを行い、専用branchでDraft PRを作成する。

Design: PRは両モードのQAのみ。main push/dispatchはPagesのCustom domainがnullならStaging、baidu.tokyoならProductionを選択し、他ドメインは拒否。artifactのmode/url/SHAとPagesの一致をdeploy直前・公開後に再確認する。Custom domainそのものはWorkflowから変更しない。
