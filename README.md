# Future Kaihatu

レシートをスキャンして植物を育てるライフスタイルゲームアプリ。
購買行動がそのままゲームの栄養になる。

## 概要

Google Vision API でレシートを OCR し、Gemini API で品目を分類。
食品・日用品・娯楽などのカテゴリに応じて**成長値・健康値・精神値**が変化し、プレイヤーの植物が育っていく。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | React Native (Expo) + TypeScript |
| スタイリング | StyleSheet（React Native 標準） |
| ナビゲーション | React Navigation（Bottom Tabs + Native Stack） |
| バックエンド | Supabase Edge Functions（Deno） |
| OCR | Google Vision API |
| 品目分類 | Gemini API（gemini-1.5-flash） |
| データベース | Supabase（PostgreSQL） |
| 認証 | Supabase Auth（メール＋パスワード） |

---

## ファイル構成

```
.
├── App.tsx                        # エントリーポイント
├── app.json                       # Expo 設定
├── package.json
├── tsconfig.json
├── .env.example                   # 環境変数サンプル
│
├── src/
│   ├── types/
│   │   └── index.ts               # 全型定義（PlantStatus, ItemStock, Receipt など）
│   │
│   ├── lib/
│   │   └── supabase.ts            # Supabase クライアント
│   │
│   ├── navigation/
│   │   └── AppNavigator.tsx       # Stack（Login → Main）+ Bottom Tabs
│   │
│   ├── hooks/
│   │   ├── useGameState.ts        # ステータス取得・アイテム使用ロジック
│   │   └── useTimeDecay.ts        # アプリ起動時の精神値自動減少
│   │
│   └── screens/                   # ページ別
│       ├── login/
│       │   └── LoginScreen.tsx    # メール認証（ログイン／新規登録）
│       │
│       ├── home/
│       │   ├── HomeScreen.tsx     # 植物表示・ステータス・アイテムストック
│       │   └── components/
│       │       ├── PlantDisplay.tsx   # 植物画像（4段階 + 枯れ木、scale でアニメ）
│       │       ├── StatusBars.tsx     # 成長値・健康値・精神値・娯楽バフ表示
│       │       └── ItemStock.tsx      # アイテム一覧（10枠）・使用操作
│       │
│       ├── scan/
│       │   ├── ScanScreen.tsx     # カメラ撮影 → Edge Function 呼び出し
│       │   └── components/
│       │       └── ResultModal.tsx    # スキャン結果モーダル（ステータス変化・取得アイテム）
│       │
│       ├── analysis/
│       │   ├── AnalysisScreen.tsx # 月次データ集計・表示
│       │   └── components/
│       │       ├── SpendingChart.tsx  # 支出比率の円グラフ
│       │       └── PersonaCard.tsx    # 支出比率から5種類のペルソナを生成
│       │
│       └── settings/
│           └── SettingsScreen.tsx # 植物名・データリセット・ログアウト
│
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql # 全テーブル定義 + RLS
    │
    └── functions/                 # 機能別 Edge Functions
        ├── ocr/
        │   └── index.ts           # Google Vision API → OCR テキスト抽出
        ├── classify/
        │   └── index.ts           # Gemini API → 品目分類 JSON を返す
        └── receipt-scan/
            └── index.ts           # パイプライン統合（重複チェック・ゲーム計算・DB 保存）
```

---

## ゲームシステム

### ステータス

| ステータス | 範囲 | 説明 |
|---|---|---|
| 成長値 | 0〜 | 植物の成長段階に直結。500 / 1500 / 3000 / 5000 で段階が変わる |
| 健康値 | 0〜150 | 50 以下で枯れ木状態。100 以上で成長値にバフ（最大 ×1.25） |
| 精神値 | 0〜150 | アプリ未使用時に自然減少（24h で −12）。×0.5〜×1.25 の倍率 |

### 植物の成長段階

| 段階 | 成長値 |
|---|---|
| 苗木 (seedling) | 0〜499 |
| 幼木 (sapling) | 500〜1499 |
| 青木 (young) | 1500〜2999 |
| 花咲き (blooming) | 3000〜 |
| 枯れ木 (withered) | 健康値 50 以下で強制 |

### アイテムカテゴリと効果

| カテゴリ | 健康値 | 精神値 | 成長値 |
|---|---|---|---|
| 食品（健康系） | +15〜+25 | ±0 | +30〜+50 |
| 食品（ジャンク系） | −15〜−25 | ±0 | +10〜+20 |
| 食品（その他） | +5〜+8 | ±0 | +10〜+20 |
| 日用品（消耗品・文具） | +1〜+5 | +5〜+8 | +10 |
| 日用品（家具・インテリア） | +1〜+5 | +20〜+25 | +15 |
| 日用品（衣類） | +1〜+5 | +10〜+15 | +10 |
| 娯楽（軽度） | −5〜−8 | +5〜+15 | バフ +2回 |
| 娯楽（中度） | −10〜−15 | +10〜+15 | バフ +3回 |
| 娯楽（重度） | −20〜−25 | +20〜+25 | バフ +4回 |

### 成長値の最終計算式

```
最終成長値 = (基礎成長値 + ジャンクボーナス)
           × 娯楽バフ          （上限 ×1.5）
           × (1 + 健康バフ + 精神バフ)  （上限 ×1.5）

最大倍率 = ×2.25
```

---

## Edge Functions のパイプライン

```
撮影（Expo Camera）
  ↓
ocr/          Google Vision API → OCR テキスト
  ↓
classify/     Gemini API → 品目・金額・カテゴリ JSON
  ↓
receipt-scan/ 重複チェック → ゲーム計算 → DB 保存 → 結果返却
```

### 重複検知

`日付 + 店名 + 合計金額` の組み合わせで判定。

---

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、Supabase の URL と匿名キーを設定する。

```bash
cp .env.example .env
```

### 3. DB マイグレーション

Supabase CLI でマイグレーションを実行する。

```bash
supabase db push
```

### 4. Edge Functions へのシークレット設定

```bash
supabase secrets set GOOGLE_VISION_API_KEY=xxx
supabase secrets set GEMINI_API_KEY=xxx
```

### 5. Edge Functions のデプロイ

```bash
supabase functions deploy ocr
supabase functions deploy classify
supabase functions deploy receipt-scan
```

### 6. アプリの起動

```bash
npx expo start
```
