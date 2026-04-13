# jopt-schedule-web

JOPT 2026 Grand Final のトーナメントスケジュールを独立 Web ページとして公開するためのリポジトリ。japanopenpoker.com の `/events/` もしくは専用サブドメインから参照される想定。

## 目的

- [jopt-gf-app](https://github.com/Anpanmank2/jopt-gf-app)（来場者向け PWA）の `/schedule` 画面を、アプリ外から閲覧可能な独立 Web として切り出す
- IT 部が japanopenpoker.com 側で本ページへリンクまたはサブドメインマッピングを行う前提

## 技術スタック

- Next.js 16.2.2 (App Router + Turbopack)
- React 19.2
- TypeScript
- Tailwind CSS v4
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
curl -sL "https://<prod-url>/?t=$(date +%s%N)" | grep "Grand Final"
```

Vercel は git push で自動デプロイされない。必ず `npx vercel --prod` を実行すること。

## 関連リポジトリ

- [Anpanmank2/jopt-gf-app](https://github.com/Anpanmank2/jopt-gf-app) — 同じスケジュールデータを内包した PWA（アプリ内ナビゲーション付き）

## ライセンス・フォント注意

現状は Noto Serif JP（Google Fonts）を使用。JOPT サイト側のデザインに合わせてフォント差し替えが発生する可能性あり（こぶりなゴシック + Univers 等）。
