# コンテンツページ生成ちゃん

楽天市場のコンテンツページを自動生成するツールです。

## 🌸 機能

- **チャット形式でペルソナ設定** - AIとの対話形式で店舗の設定を行います
- **商品URL自動解析** - 楽天の商品ページから情報を自動取得
- **AI画像生成** - Gemini / ChatGPT / Midjourney から選択可能
- **コンテンツ自動生成** - SEO最適化された記事を自動作成
- **楽天RMS連携** - ワンクリックでコンテンツページを公開

## 📁 ファイル構成

```
ContentPageGenerator/
├── index.html          # メインHTML
├── css/
│   └── style.css       # スタイルシート
├── js/
│   ├── config.js       # 設定ファイル
│   ├── api.js          # API通信
│   ├── chat.js         # チャットUI
│   └── app.js          # メインアプリ
├── CNAME               # カスタムドメイン設定
└── README.md           # このファイル
```

## 🚀 セットアップ

### 1. GitHub Pages の有効化

1. リポジトリの **Settings** を開く
2. 左メニューの **Pages** を選択
3. **Source** を `Deploy from a branch` に設定
4. **Branch** を `main` / `/ (root)` に設定
5. **Save** をクリック

### 2. API URLの設定

`js/config.js` の `API_BASE_URL` を実際のGAS WebアプリURLに変更：

```javascript
API_BASE_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
```

### 3. カスタムドメインの設定（オプション）

詳細は下記「カスタムドメイン設定」セクションを参照

---

## 🌐 カスタムドメイン設定

GitHub PagesにカスタムドメインOを設定する方法です。

### 必要なもの

- 独自ドメイン（例: `content-tool.jp`）
- ドメインのDNS管理画面へのアクセス

### 手順

#### Step 1: DNSレコードの設定

ドメイン管理画面（お名前.com、ムームードメインなど）で以下を設定：

**Aレコード（4つ全て追加）:**
```
@ → 185.199.108.153
@ → 185.199.109.153
@ → 185.199.110.153
@ → 185.199.111.153
```

**CNAMEレコード（www用）:**
```
www → ginzasugiden.github.io
```

#### Step 2: GitHub側の設定

1. リポジトリの **Settings** → **Pages** を開く
2. **Custom domain** に取得したドメインを入力
   - 例: `content-tool.jp`
3. **Save** をクリック
4. DNS確認が完了するまで待機（数分〜数時間）
5. **Enforce HTTPS** にチェック

#### Step 3: CNAMEファイルの確認

リポジトリのルートに `CNAME` ファイルが自動作成されます。
内容は設定したドメイン名のみ：

```
content-tool.jp
```

### DNS設定の確認方法

ターミナルで以下のコマンドを実行：

```bash
# Aレコードの確認
dig content-tool.jp +short

# 期待される結果
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

### トラブルシューティング

| 問題 | 解決方法 |
|------|----------|
| DNS確認が終わらない | 24-48時間待つ（DNS伝播に時間がかかる） |
| HTTPSが有効にならない | DNS設定を確認、証明書発行まで待つ |
| 404エラー | `index.html` がルートにあるか確認 |

---

## 🔧 GAS（バックエンド）のデプロイ

Google Apps Scriptのデプロイ手順：

1. GASエディタで **デプロイ** → **新しいデプロイ** を選択
2. **種類** を「ウェブアプリ」に設定
3. **実行ユーザー** を「自分」に設定
4. **アクセス** を「全員」に設定
5. **デプロイ** をクリック
6. 表示されたURLを `config.js` に設定

---

## 📝 ライセンス

MIT License

## 👤 作者

Silver Mint / 銀座東京フラワー
