# jopt-schedule-web

**Japan Open Poker Tour 2026 Grand Final** のトーナメントスケジュールを独立 Web ページとして公開するためのリポジトリ。japanopenpoker.com のサブドメインから参照／リンクされる前提。

## 目的

- [jopt-gf-app](https://github.com/Anpanmank2/jopt-gf-app)（来場者向け PWA）の `/schedule` 画面を、アプリ外から閲覧可能な独立 Web として切り出す
- IT 部が japanopenpoker.com 側で本ページへリンクまたはサブドメインマッピングを行う前提

## 機能

- **ALL モード（初期値）**：全 13 日間 220 トーナメントを日別セクション + sticky day header で一覧
- **日別モード**：日付タブをクリックして1日分を詳細カードで表示
- **day-jump pills**：ALL 時に日付タブをクリックすると該当 day section へスムーズスクロール
- **検索**：トーナメント名（部分一致・全角半角正規化・大小無視）で絞り込み
  - URL に `?q=xxx` として保持 → SNS でシェアしてもフィルタ済み結果が再現される
- **Game/Stake フィルタ**：NLH/PLO/MIX/SAT × Low/Medium/High Stake、検索と AND 連携
- **レスポンシブ**：モバイル〜デスクトップ 1列、各カード/行は `max-w-2xl` 中央寄せ

## 技術スタック

- Next.js 16.2.2 (App Router + Turbopack)
- React 19.2
- TypeScript
- Tailwind CSS v4
- フォント: Noto Serif JP（Google Fonts）
- デプロイ: Vercel（手動 `npx vercel --prod`）

## データ更新フロー

スケジュール本体は `src/data/jopt_gf2026_data.json` に静的に持つ。

1. 運営がローカルで `src/data/jopt_gf2026_data.json` を編集
2. `git commit && git push origin main`
3. `npx vercel --prod --yes` で本番デプロイ
4. キャッシュバストして目視確認

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
    └── jopt_gf2026_data.json  # 220トーナメント (59,731行)

public/
└── jopt-logo.png         # フッター用 JOPT ロゴ（1022x1218 RGBA）
```

## 関連リポジトリ

- [Anpanmank2/jopt-gf-app](https://github.com/Anpanmank2/jopt-gf-app) — 同じスケジュールデータを内包した PWA（アプリ内ナビゲーション付き）

## フォント注意

現状は Noto Serif JP（Google Fonts）を使用。JOPT サイト側のデザインに合わせてフォント差し替えが発生する可能性あり（Google Fonts 近似を後日指定される想定）。
