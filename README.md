# jopt-schedule-web

**Japan Open Poker Tour 2026 Grand Final** のトーナメントスケジュールを独立 Web ページとして公開するためのリポジトリ。japanopenpoker.com のサブドメインから参照／リンクされる前提。

## 目的

- [jopt-gf-app](https://github.com/Anpanmank2/jopt-gf-app)（来場者向け PWA）の `/schedule` 画面を、アプリ外から閲覧可能な独立 Web として切り出す
- IT 部が japanopenpoker.com 側で本ページへリンクまたはサブドメインマッピングを行う前提

## 機能

- **ALL モード（初期値）**：全 13 日間 257 トーナメントを日別セクション + sticky day header で一覧
- **日別モード**：日付タブをクリックして1日分を詳細カードで表示
- **day-jump pills**：ALL 時に日付タブをクリックすると該当 day section へスムーズスクロール
- **検索**：event name / eventNumber / gameType / gameCategory いずれかに部分一致（全角半角正規化・大小無視）
  - URL に `?q=xxx` として保持 → SNS でシェアしてもフィルタ済み結果が再現される
- **Game Category フィルタ（4 カテゴリ、v2.5 改訂）**：Hold'em / Omaha / Other / Satellite、検索と AND 連携
- **Satellite Seat 付与率表示（v2.5）**：Satellite event の Prize 部に「Seat 付与率: N エントリーにつき 1 Seat」を自動表示
- **Multi-day Structure**：Day 1/Day 2/Day 3 の phase filter で該当 Day 範囲のみ表示、D1 END / D2 START / D2 END / D3 START バッジ + CLOSE NBB マーカー
- **Sponsorship セクション**：スポンサー付き event（#33 Colossus 等）の協賛品情報を独立表示
- **レスポンシブ**：モバイル〜デスクトップ 1列、各カード/行は `max-w-2xl` 中央寄せ

## 技術スタック

- Next.js 16.2.2 (App Router + Turbopack)
- React 19.2
- TypeScript
- Tailwind CSS v4
- フォント: Noto Serif JP（Google Fonts）
- デプロイ: Vercel（手動 `npx vercel --prod`）

## データ更新フロー（v2.5 改訂）

v2.5 から **transformer 方式**に変更。データソースは 3 層優先順位:

| 優先 | ファイル | 用途 |
|---|---|---|
| 1 | `src/data/pdf-overrides.json` | Owner 提供 PDF の正式値（Day 2 structure / reg close / notes override） |
| 2 | `src/data/extract.json` | Google Sheets Apps Script export（SSOT、約 10MB） |
| 3 | `src/data/jopt_gf2026_data.json` | legacy 手作業 snapshot（structure/notes fallback のみ有効、scalar 値 fallback は無効） |

`src/lib/transformer.ts` が `/api/schedule` runtime endpoint でこの 3 層を merge した結果を返す。

更新手順:

1. **通常の schedule 更新**: 運営が Google Sheets 編集 → Apps Script で `extract.json` 更新 → commit
2. **Day 2 structure / reg close 等 PDF のみの情報**: `pdf-overrides.json` の該当 event セクションに追記
3. **extract 側 notes 混線等の復旧**: `pdf-overrides.json` の `notes` field で override（例: `#33 Colossus`）
4. **全件監査**: `node scripts/audit-report.mjs` で transformed vs current の差分を確認
5. `git commit && git push origin main`
6. `npx vercel --prod --yes` で本番デプロイ
7. キャッシュバストして目視確認

リアルタイム更新は不要（GF 期間前日までに確定データを反映する運用）。

## セットアップ

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## デプロイ（Push Gate 手順）

```bash
npm run build                                         # ローカルビルド確認
npm run dev                                           # localhost:3000 目視
git add -A && git commit -m "..."
git push origin main
npx vercel --prod --yes                               # 手動デプロイ
curl -sL "https://jopt-schedule-web.vercel.app/?t=$(date +%s%N)" | grep "Grand Final"
```

Vercel は git push で自動デプロイされない。必ず `npx vercel --prod` を実行すること。

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx        # metadata + flex構造 + Footer呼び出し
│   ├── page.tsx          # SchedulePage（ALL / 日別 / 検索）
│   ├── globals.css       # Tailwind v4 @theme
│   └── favicon.ico
├── components/
│   ├── EventDetail.tsx   # 展開時の Structure/Info タブ（EventCard+EventRow共通）
│   ├── EventRow.tsx      # ALL モード用の1行コンパクト表示
│   ├── EventCard.tsx     # 日別タブ用の詳細アコーディオンカード
│   ├── EventFilter.tsx   # Game/Stake フィルタピル
│   └── Footer.tsx        # JOPT ロゴ + コピーライト
├── hooks/
│   └── useEventFilter.ts # Game/Stake + トーナメント名検索（NFKC+lowerCase）
├── config/
│   └── filterConfig.ts   # Game/Stake フィルタ定義
└── data/
    ├── extract.json               # Google Sheets SSOT export (約 10MB)
    ├── pdf-overrides.json         # Owner 提供 PDF の正式値（structure/reg close/notes）
    └── jopt_gf2026_data.json      # legacy 手作業 snapshot（fallback 専用）

scripts/
├── transform-extract.mjs          # CLI 版 transformer（audit 用）
├── diff-vs-current.mjs            # legacy vs transformed の差分
├── audit-report.mjs               # 全 event × 全 field 数値監査
└── fetch-flickr-albums.mjs        # Flickr メタ取得（prebuild）

public/
└── jopt-logo.png         # フッター用 JOPT ロゴ（1022x1218 RGBA）
```

## 関連リポジトリ

- [Anpanmank2/jopt-gf-app](https://github.com/Anpanmank2/jopt-gf-app) — 同じスケジュールデータを内包した PWA（アプリ内ナビゲーション付き）

## フォント注意

現状は Noto Serif JP（Google Fonts）を使用。JOPT サイト側のデザインに合わせてフォント差し替えが発生する可能性あり（Google Fonts 近似を後日指定される想定）。
