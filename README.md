---
noteId: "9e40784056c411f19acea3466e5046bb"
tags: []

---

# フォーム半自動送信ツール

B2B営業のお問い合わせフォーム送信を半自動化するデスクトップアプリ。

---

## 概要

企業名リストを入力すると、Google検索→公式サイトへのアクセス→お問い合わせページの検出→フォーム解析→自動入力→送信 の流れを自動で処理する。

完全自動化が難しいケース（CAPTCHA・Cloudflare・バリデーションエラーなど）は Chromium タブを開いたまま一時停止し、手動対応後に次の企業へ進む設計。

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| デスクトップフレームワーク | Tauri |
| フロントエンド | React + TypeScript + TailwindCSS |
| ブラウザ自動化 | Playwright |
| AI（フォーム解析） | OpenAI API (GPT-4o / GPT-4o-mini) |

---

## セットアップ

### 必要なもの

- Node.js 18+
- Rust（Tauri 用）
- OpenAI API キー

### 手順

```bash
cd client
npm install
```

`.env` を作成：

```
OPENAI_API_KEY=your_key_here
```

### 起動

```bash
# デスクトップアプリとして起動
npm run tauri dev
```

---

## 使い方

1. **ユーザープロフィール**（画面下部）に送信者情報と営業メッセージを入力
2. **営業先リスト**に企業名を1行1社で入力
3. **一括送信開始** をクリック

### 自動処理の流れ

```
企業名入力
→ Google検索で公式サイトを特定
→ お問い合わせページを検索・移動
→ フォームを解析（AI支援）
→ フォームに自動入力
→ 送信
→ 次の企業へ
```

### 手動対応が必要な場合

送信に失敗した場合（CAPTCHA・Cloudflare・バリデーションエラー等）：

1. Chromium のタブが開いたまま自動化が一時停止する
2. アプリに **「○ 送信できた」「× 送信できなかった」** のボタンが表示される
3. 手動でフォームを確認・送信してからボタンを選択
4. 次の企業の自動処理が再開する

---

## ステータス一覧

| ステータス | 意味 |
|---|---|
| `success` | 送信完了 |
| `no_contact_page` | お問い合わせページが見つからなかった |
| `inquiry_type_mismatch` | 個人向けフォームなどスキップ |
| `submit_failed` | 送信ボタン押下に失敗 |
| `validation_failed` | バリデーションエラーが解消できなかった |
| `form_parse_failed` | フォーム構造を解析できなかった |
| `cloudflare_blocked` | Cloudflare によりブロックされた |
| `captcha_detected` | CAPTCHA が検出された |
| `unknown_error` | 不明なエラー |

---

## ディレクトリ構成

```
client/
├── src/
│   ├── components/       # UI コンポーネント
│   ├── hooks/            # useAutomation（キュー管理）
│   └── types/            # 型定義
├── scripts/
│   ├── automation.js     # 自動化メインスクリプト
│   ├── formAnalyzer.js   # フォーム解析
│   ├── formFiller.js     # フォーム入力
│   ├── formSubmitter.js  # フォーム送信
│   ├── contactFinder.js  # お問い合わせページ検索
│   ├── aiAnalyzer.js     # OpenAI API 連携
│   └── blockDetector.js  # CAPTCHA・Cloudflare 検出
└── src-tauri/            # Tauri バックエンド（Rust）
```
