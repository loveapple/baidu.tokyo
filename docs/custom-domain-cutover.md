# baidu.tokyo 独自ドメイン移行準備

確認日: 2026-10-26（日本時間、約19:30–19:40）。**実切替は未実施。DNS不一致と依存関係の未確認事項が残るため、現時点の切替判定はNo-Go。** ソフトウェアの準備完了をDNS切替やVPS廃止の許可と扱わない。

## 現在の公開状態

- main HEAD: `e6eed12f83bd1faca691ff87ecc5a81fc4fa3ae0`。
- Staging: https://loveapple.github.io/baidu.tokyo/ 。publication.jsonのsource_shaは上記mainと一致。
- 成功した [Staging run 40303855938](https://github.com/loveapple/baidu.tokyo/actions/runs/40303855938) のartifactをダウンロードし、公開中の全11ファイルをSHA-256照合、完全一致。
- Pages: Source=workflow、Custom domain=null、HTTPS enforced=true、status=built。
- github-pages: main限定、承認者・タイマーなし。今回設定変更なし。
- 参考happinesea-site: main `d673d5c144956bb3c473016e5e5c9806f8da50a9`。main/手動の自動配信・直前ガード・公開物照合を維持し、CMS/記事差分の処理やproduction-cutover承認環境は移植しない。

## DNS観測（変更していない）

Google Public DNSのHTTPS JSON APIで取得。apex AはCloudflareのHTTPS JSON APIでも同値を確認。空回答は「この照会ではレコードなし」で、全ゾーンの不存在を保証しない。

| 名前・種類 | 観測値 |
| --- | --- |
| baidu.tokyo A（再帰DNS） | `150.95.211.101`、TTL 120秒 |
| baidu.tokyo AAAA / CNAME / CAA | Status 0、Answerなし |
| baidu.tokyo MX | priority 10、`mail.baidu.tokyo.`、TTL 120秒 |
| baidu.tokyo TXT | `v=spf1 ip4:157.7.184.30 ~all`、TTL 120秒 |
| baidu.tokyo NS（再帰DNS） | `n388.ns.yunjiasu.com.` / `n3015.ns.yunjiasu.com.` / `ns1.alidns.com.` / `ns2.alidns.com.`、TTL 120秒 |
| baidu.tokyo SOA（再帰DNS） | primary `ns1.value-domain.com.`、serial `2025112116` |
| www.baidu.tokyo | A/AAAA/CNAME/CAA/MX/NS/TXTでStatus 3（NXDOMAIN） |
| mail.baidu.tokyo | A/AAAA/CNAME/CAAでStatus 3（NXDOMAIN） |

**DNS不一致:** `nslookup -debug baidu.tokyo ns1.alidns.com` はauthoritative answerフラグ付きでA=`91.121.71.36`、TTL 600秒を返した。SOA primaryは`ns7.alidns.com`、serial=`2026082509`。再帰DNSと異なる。`n388.ns.yunjiasu.com`への直接照会はタイムアウトした。ネットワーク経路・古いゾーン・委任状態のどれが原因かは未確定。レジストラの実委任先、各権威NSのA/AAAA/MX/CAA/SOA、管理画面のゾーンを照合するまで変更対象を決めない。

現在のMXは名前解決できない宛先を指している。実際の送受信・転送・外部メール契約は未検証で、メール不使用とは判断しない。SPFのIPもWebの観測IPとは異なる。今回MX/SPFの修復や変更は行わない。

## 旧VPSの依存関係（読み取り調査）

既存の`kusanagi-readonly` / `codex_ro`でSSHし、サービス・listen状態・nginxのserver_name/root・Postfixの非機密項目だけを確認。DB内容、wp-config、秘密鍵、認証情報、メール本文は読まない。

- nginx、PHP-FPM、MariaDB、Redis、Docker、Postfix、FTP、cron、SSHが稼働。
- nginxには`baidu.tokyo`に加え、`divination.baidu.tokyo`、`cms.happinesea.com`、`happinesea.com`、`blog.loveapple.cn`の設定が存在。設定の存在と現行利用は別。
- 再帰DNSで`divination.baidu.tokyo`と`cms.happinesea.com`のAはWeb観測IP `150.95.211.101`。`blog.loveapple.cn`は別GitHub PagesへCNAME。apex移行だけでVPS全体は廃止できない。
- Postfixはlocalhost待受で、mydestinationはローカルhost名とlocalhost。外部メール受信基盤と断定しないが、cron/WordPressの通知送信への利用は未確認。
- Dockerの実コンテナ構成、root専用cron、DB利用者・他アプリからのDB接続、FTP利用者、バックアップ・監視・外部API依存はUNCONFIRMED。特権操作で調査範囲を広げていない。
- SSH別名のHostNameは`baidu.tokyo`。apexをPagesへ向けると同じ別名の接続先も変わる。切替前に、旧IPを使いhost keyを検証できる別管理経路を担当者が確保する。SSH設定やknown_hostsは今回変更しない。
- 現在の旧apex HTTPSはHTTP 200。可逆性のため旧Web・TLS・DB・他サービスを維持する。DB削除やVPS停止は別案件。

## 今回のProduction対応

- `PUBLICATION_MODE=production`はsite=`https://baidu.tokyo`、base=`/`。canonical/OGP/sitemap/robots/CSS/画像はこの設定に統一。
- PR/非mainの手動実行はStaging/Production両方をQAする。配信jobは実行しない。
- main push/手動実行はPagesのCustom domainを読む。nullならStaging、`baidu.tokyo`ならProduction。他ドメイン、SourceやURLの不一致は拒否する。Pages設定をWorkflowから書き換えない。
- build成功した同じrunのartifactだけをdeploy。直前・公開後にmode/url/source_sha/main HEADとPagesを照合。Staging artifactをCustom domainへ、Production artifactをproject Pagesへ配信しない。
- 競合防止・追加承認なしを維持。成功判定には公開URLの全ファイル一致とEnforce HTTPS=trueが必要。

## 切替先DNS値（将来、承認後のみ）

GitHub公式の[Custom domain手順](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)を2026-10-26に確認。実施直前に再確認する。

| 名前 | 種類 | 値・扱い |
| --- | --- | --- |
| @ | A | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` の4件 |
| @ | AAAA（IPv6を採用する場合のみ） | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| www（追加を別途承認した場合のみ） | CNAME | `loveapple.github.io.`。repo名やURLパスを含めない |
| @ | CNAME | 使用しない。apexのMX/TXTと競合させない |
| @ / 親 | CAA | 現状を再確認。新設や既存ポリシー変更は今回不要。制限がある場合はGitHubの証明書発行要件と照合して担当者が承認 |
| mail/MX/TXT/SPF/NS/他サブドメイン | 既存 | 保存する。apex Web移行に便乗して削除・変更しない |

最小の初回切替はapex Aの4件。現在ないAAAA/wwwは必須にしない。旧AとPages Aを混在させない。ワイルドカードやNameserver変更を追加しない。

## 切替手順・HTTPSの成立条件

以下は準備文書であり、この作業で実行しない。

1. **No-Goの解除:** DNS不一致を解消し、正しい管理ゾーンと全権威NSを特定。変更前の正規ゾーンをエクスポートする。メール・他サービス・SSH管理経路を確認し、Webだけの切替と復旧担当・許容停止時間を承認する。旧IPへ盲目的に戻す計画にしない。
2. 必要なら承認後、事前に対象A/AAAAのTTLを下げ、変更前TTL分以上待つ。今回の120/600秒という照会値だけで伝播時間を断定しない。VPS/WordPress/DB/TLSは保持する。
3. この準備PRをmainへマージした後も、Custom domainがnullならStaging配信を継続する。通常mainマージに追加承認は要求しない。
4. 別途承認した切替作業でドメイン所有権を検証し、GitHub PagesへCustom domain=`baidu.tokyo`を設定する。公式手順に従いDNSより先にPagesへ登録する。Actions方式ではCNAMEファイルは不要。
5. Pages APIが`cname=baidu.tokyo`かつ`html_url=https://baidu.tokyo/`になったらmainのRun workflowでProductionを生成・配信する。設定変更だけでは新Workflowは自動起動しないため手動実行が必要。その後のmain pushは自動配信。
6. **証明書bootstrapに注意:** APIがhttp URLを返す間は厳密URLガードで停止する。DNSが旧VPSを向いている間は公開物照合も成功しない。DNSと証明書の成立前にgreen runを要求することはできない。必要な場合は承認済みメンテナンス枠内で次のDNS切替・TLS待機を行い、成立後にmainで再実行する。HTTPへのURL書換え、証明書検証無効化、誤配信ガード解除で回避しない。
7. 正しいゾーンのapex Aだけを上記4件へ置換する。IPv6やwwwを追加する場合は承認済みの値のみ使う。MX/SPF/NS/他サービスのレコードを保持する。
8. 複数リゾルバと全権威NSでA/AAAAを確認し、GitHubの証明書発行を待ってEnforce HTTPSを有効化する。GitHub公式では反映・HTTPS有効化に最大24時間かかる場合がある。予定時間内に成立しなければ復旧条件に従う。
9. mainでWorkflowを再実行し、deployだけでなくverify成功を確認する。公開SHA＝run SHA＝main HEAD、全11ファイル一致、HTTPS enforced=trueを満たして初めて移行完了。

Custom domain登録後、旧Stagingのartifactが残る時間やDNS/証明書待ちがあり得るため、無停止移行は保証しない。準備PRのマージと実切替の承認を分け、許容時間を決めて実施する。

## HTTPS有効化後の検証

- `https://baidu.tokyo/`のTLS/HTTP 200、証明書名・期限、`http://baidu.tokyo/`からのHTTPSリダイレクト。
- canonical/og:url=`https://baidu.tokyo/`、og:image=`https://baidu.tokyo/images/ogp.png`。
- robotsのsitemap参照とsitemap内URL、CSS/画像がルートパス。Stagingパスを含めない。
- 火風鼎䷱の6爻、書籍表紙、OGP、Desktop/Mobile、アンカー、Amazon導線。
- publication.jsonとmain HEAD一致、同じrunのPages artifactと全ファイル一致。verifyが失敗ならdeploy成功だけを公開完了と扱わない。
- MX/メール・divination・cmsなど旧VPS依存サービスが切替前の状態を維持することを担当者が確認。既存MX問題を本切替の成功に紛れさせない。

## 復旧条件と方法

不一致ゾーンが未解消、TLS/HTTPSが許容時間内に成立しない、HTTP/asset異常、SHA不一致、主要導線の不具合、メール/他サービスの悪化なら完了を宣言せず復旧する。

1. 並行main変更・手動実行を止め、承認済み担当者が正しいゾーンのエクスポートからapex Webレコードを復元する。今回見えた`150.95.211.101`や`91.121.71.36`だけを根拠に復元値を決めない。追加AAAA/wwwも変更前状態へ戻す。MX/TXT/NS/他サブドメインは維持。
2. 複数リゾルバで旧Webへの復帰、旧VPSのHTTP/HTTPS、メール・他サービスを確認する。DNSキャッシュ中は混在し得る。
3. PagesをStagingへ戻す場合、Pagesを指すDNSが残っていないことを確認してからCustom domainを解除し、mainでRun workflowを実行する。nullを検出してStagingが生成され、公開SHA/asset照合を行う。DNSをPagesへ向けたままドメイン登録だけを解除しない。
4. 旧VPS・MySQL・WordPressは保持したまま原因を調査する。自動rollback・サーバー停止・DB削除は実装しない。

## 今回のQAと制限

- npm ci成功、audit 0 vulnerabilities。checkは0 errors/warnings/hints。
- Staging/Productionでbuildと各21テスト成功。誤配信・異なるドメイン・古いSHA・HTTP差異の拒否を継続検査。
- Production rootのローカルHTTPサーバーで全11ファイルをbuildとSHA-256照合。canonical/OGP/sitemap/robotsと全内部リンク・アンカー・asset参照を確認。Amazonリンクは既存の検査を維持し、外部の注文・ログイン操作は行わない。
- ProductionのChromium 320/390/1280pxで横はみ出しなし、SVG/表紙の読み込み成功。Hero・OGPを目視確認。スクリーンショットはローカル `.qa/production-390.png` / `.qa/production-1280.png`。
- 自己レビューと独立Solレビューで重大/重要な指摘なし。CI結果はDraft PRのChecksに記録する。
- Productionの実配信・Custom domain設定・DNS変更・新TLS検証は未実施。メール実送受信、特権領域、Docker/DB利用の完全棚卸し、実機Safariは未検証。
