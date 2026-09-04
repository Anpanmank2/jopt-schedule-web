# jopt-schedule-web

**Japan Open Poker Tour 2026 Grand Final** のトーナメントスケジュールを独立 Web ページとして公開するためのリポジトリ。japanopenpoker.com のサブドメインから参照／リンクされる前提。

## 目的

- jopt-gf-app（来場者向け PWA）のスケジュール画面を、アプリ外から閲覧可能な独立 Web として切り出す
- japanopenpoker.com 側からサブドメイン（schedule26gf）でマッピング済み

## 機能

- **ALL モード（初期値）**：全日程を日別セクション + sticky day header で一覧（日数・トーナメント数はデータ更新で変わるため、正本は `/api/schedule` が返す meta。README には固定値を書かない）
- **日別モード**：日付タブをクリックして1日分を詳細カードで表示
- **day-jump pills**：ALL 時に日付タブをクリックすると該当 day section へスムーズスクロール
- **検索**：event name / eventNumber / gameType / gameCategory いずれかに部分一致（全角半角正規化・大小無視）
  - URL に `?q=xxx` として保持 → SNS でシェアしてもフィルタ済み結果が再現される
- **Game Category フィルタ（4 カテゴリ）**：Hold'em / Omaha / Other / Satellite、検索と AND 連携
- **Satellite Seat 付与率表示**：Satellite event の Prize 部に「Seat 付与率: N エントリーにつき 1 Seat」を自動表示
- **Multi-day Structure**：Day 1/Day 2/Day 3 の phase filter で該当 Day 範囲のみ表示、D1 END / D2 START / D2 END / D3 START バッジ + CLOSE NBB マーカー
- **Sponsorship セクション**：スポンサー付き event の協賛品情報を独立表示
- **多言語（JP / EN / KOR）**：next-intl。`/` は常に JP、`/en` `/ko` のみ URL prefix（Accept-Language / cookie による自動判定は off）。UI 文言は `messages/`、データ層の日本語は `src/data/translations.json` で localize
- **公式ルールページ**：`/rules` に `src/data/rules-content.ts` の構造化テキストを多言語表示。PDF は `public/jopt-official-rule-2026.pdf`
- **Photo タブ**：`src/components/PhotoPanel.tsx` が `src/data/flickr-albums.json` を参照し、event 単位アルバムまたは全体アルバムへリンク
- **Structure 画像表示**：rotation 系など画像で見せる event は `public/structure-pdfs/`（2026-09-03時点 23 枚）を `src/data/structure-pdf-manifest.json` 経由で表示
- **当日運用の override 機構**：`src/data/pdf-overrides.json` で開始時刻・Reg.Close・notes・日付グルーピング・臨時 event を上書きできる（当日ディレイ告知などに対応）
- **ナビ**：Header / Footer から JOPT トップへ戻るリンク、Header に言語切替
- **レスポンシブ**：モバイル〜デスクトップ 1列、各カード/行は `max-w-2xl` 中央寄せ

## 技術スタック

- Next.js 16.2.2（App Router）/ React 19.2.4 / TypeScript 5 / Tailwind CSS v4
- next-intl 4（多言語ルーティング: `middleware.ts` + `src/i18n/`）
- フォント: Noto Sans JP（Google Fonts。2026-04-15 に Noto Serif JP から変更）
- Playwright（devDependency。E2E 検証用）
- Google Tag Manager を root layout で読み込み
- `next.config.ts` が CSP `frame-ancestors` を付与（既定は japanopenpoker.com とそのサブドメイン。環境変数 NEXT_PUBLIC_CSP_FRAME_ANCESTORS で上書き可）
- デプロイ: Vercel（手動 `npx vercel --prod`）

## データ更新フロー（v2.5 改訂）

v2.5 から **transformer 方式**に変更。データソースは 3 層優先順位:

| 優先 | ファイル | 用途 |
|---|---|---|
| 1 | `src/data/pdf-overrides.json` | Owner 提供 PDF の正式値（Day 2 structure / reg close / notes override） |
| 2 | `src/data/extract.json` | Google Sheets Apps Script export（SSOT。2026-09-03時点 約 10.5MB、`event.extracted_at` = 2026-04-24） |
| 3 | `src/data/jopt_gf2026_data.json` | legacy 手作業 snapshot（structure/notes fallback のみ有効、scalar 値 fallback は無効） |

`src/lib/transformer.ts` が `/api/schedule` runtime endpoint でこの 3 層を merge した結果を返す。

更新手順:

1. **通常の schedule 更新**: 運営が Google Sheets 編集 → Apps Script で `extract.json` 更新 → commit
2. **Day 2 structure / reg close 等 PDF のみの情報**: `pdf-overrides.json` の該当 event セクションに追記
3. **extract 側 notes 混線等の復旧**: `pdf-overrides.json` の `notes` field で override（例: `#33 Colossus`）
4. **多言語**: データ層に新しい日本語文字列が増えたら `src/data/translations.json` に EN/KOR を追加（UI 文言は `messages/`）
5. **監査**: `node scripts/audit-report.mjs`（全 event × 全 field）／`node scripts/audit-game-category.mjs`（カテゴリ分類）／`node scripts/smoke-structure-images.mjs`（Structure 画像の存在確認）
6. `git commit && git push origin main`
7. `npx vercel --prod --yes` で本番デプロイ
8. キャッシュバストして目視確認

リアルタイム更新は不要（GF 期間前日までに確定データを反映する運用）。

## セットアップ

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # prebuild で scripts/fetch-flickr-albums.mjs が走る（ネットワーク取得。失敗しても空 fallback で継続）
```

## デプロイ（Push Gate 手順）

```bash
npm run build                                         # ローカルビルド確認
npm run dev                                           # localhost:3000 目視
git add <変更ファイル> && git commit -m "..."          # add -A は無関係な差分を巻き込むので使わない
git push origin main
npx vercel --prod --yes                               # 手動デプロイ
curl -sL "https://schedule26gf.japanopenpoker.com/?t=$(date +%s%N)" | grep "Grand Final"
```

- Vercel は git push で自動デプロイされない。必ず `npx vercel --prod` を実行すること
- 公開 URL は https://schedule26gf.japanopenpoker.com （Vercel alias: https://jopt-schedule-web.vercel.app ）。2026-09-03時点、どちらも HTTP 200
- Vercel CDN のキャッシュが強いため、検証時はクエリストリングでキャッシュバストする

## ディレクトリ構成

```
middleware.ts             # next-intl のロケール振り分け
messages/                 # UI 文言辞書 ja.json / en.json / ko.json

src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx    # metadata + Header/Footer + GTM + NextIntlClientProvider
│   │   ├── page.tsx      # SchedulePage（ALL / 日別 / 検索）
│   │   └── rules/page.tsx # JOPT 公式ルールページ
│   ├── api/schedule/route.ts # transformer 経由の display JSON（?debug=1 で meta 付き）
│   └── globals.css       # Tailwind v4 @theme
├── components/
│   ├── EventDetail.tsx   # 展開時の Info / Structure / Photo タブ
│   ├── EventCard.tsx     # ALL / 日別 共通の詳細アコーディオンカード
│   ├── EventFilter.tsx   # Game/Stake/Format フィルタピル
│   ├── PhotoPanel.tsx    # Photo タブ（Flickr アルバム参照）
│   ├── Header.tsx / HomeLink.tsx / LanguageSwitcher.tsx / Footer.tsx
│   └── rules/            # ルールページ用の描画部品
├── i18n/                 # next-intl の routing / request / navigation
├── lib/                  # transformer.ts（3 層マージ本体）/ i18n-data.ts（データ層 localize）
├── hooks/useEventFilter.ts   # Game/Stake/MultiDay + 名前検索（NFKC+lowerCase）
├── config/               # filterConfig.ts（フィルタ定義）/ eventConfig.ts（大会名・年）
└── data/
    ├── extract.json               # Google Sheets SSOT export（約 10.5MB）
    ├── pdf-overrides.json         # PDF の正式値・当日 override・臨時 event
    ├── jopt_gf2026_data.json      # legacy 手作業 snapshot（fallback 専用）
    ├── translations.json          # データ層日本語 → EN/KOR
    ├── rules-content.ts           # 公式ルールの構造化テキスト
    ├── flickr-albums.json         # Flickr アルバム lookup（prebuild で生成）
    └── structure-pdf-manifest.json # Structure 画像の対応表

scripts/                  # transform-extract / diff-vs-current / audit-report / audit-game-category
                          # convert-rule-pdf / convert-structure-pdfs / smoke-structure-images
                          # fetch-flickr-albums（prebuild）

public/
├── jopt-logo.png                  # フッター用 JOPT ロゴ（1022x1218 RGBA）
├── jopt-official-rule-2026.pdf    # 公式ルール PDF
└── structure-pdfs/                # Structure 画像
```

## 関連リポジトリ

- [Anpanmank2/jopt-gf-app](https://github.com/Anpanmank2/jopt-gf-app) — 同じスケジュールデータを内包した PWA（アプリ内ナビゲーション付き）

## フォント

Noto Sans JP（Google Fonts）で確定（2026-04-15、japanopenpoker.com 側の統一方針に合わせて Noto Serif JP から変更）。差し替える場合は同じスケジュールデータを持つ jopt-gf-app 側も同時に変更すること。
