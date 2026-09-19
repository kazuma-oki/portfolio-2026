# KAZUMA OKI — Portfolio 2026

公開URL: **https://kazuma-oki.github.io/portfolio-2026/**

設計図（Desktop 1440 / Tablet 768 / Mobile 390）をもとに作り直したポートフォリオ。
Next.js（App Router）+ Framer Motion で組み、GitHub Pages に静的書き出しで公開している。

旧サイト https://kazuma-oki.github.io/ はそのまま残してある。

---

## 1. 実績（Works）を追加する

さわるのは **`data/works.json`** だけ。

1. 画像を `public/images/works/` に置く
   - 一覧サムネイル：`<id>-thumb.webp`
   - 詳細ページのメイン画像：`<id>-main.webp`
   - 記事中に挟む画像（任意）：`<id>-full.webp`
2. `data/works.json` の **配列の先頭** に1件ぶん追記する（先頭が一覧の左上に並ぶ）
   - TOPは横に流れるカルーセル。必ず1枚が画面の中央にきて、左右にループする。
     何件足してもTOPが縦に長くならない
3. push する。GitHub Actions が自動でビルドして公開する

手元で確認したいときは次のコマンド。

```bash
npm run dev       # http://localhost:3000/portfolio-2026/
npm run build     # 本番と同じ静的ファイルを out/ に書き出す
npm run preview   # out/ を本番と同じURL構成で配信（http://localhost:8788/portfolio-2026/）
```

### 書き方

```json
{
  "id": "newwork",
  "title": "作品名",
  "category": "Website",
  "tag": "自主制作",
  "year": "2026",
  "role": "設計 / デザイン / コーディング",
  "tools": ["Figma", "HTML", "CSS"],
  "url": "https://example.com",
  "summary": "一覧と詳細の冒頭に出る一行紹介。",
  "thumb": "images/works/newwork-thumb.webp",
  "mainImage": "images/works/newwork-main.webp",
  "sections": [
    { "heading": "概要", "blocks": [{ "text": "どんな作品かの説明。" }] }
  ]
}
```

| キー | 役割 |
|---|---|
| `id` | URLになる英数字（`/works/<id>/`） |
| `category` | 一覧のフィルターにも使う。2種類以上になると自動でフィルターが表示される |
| `year` / `role` / `tools` / `url` | 詳細ページ右側の情報欄 |
| `summary` | 一覧カードと詳細の冒頭に出る一行 |
| `sections` | 詳細ページの本文 |

### `sections` の中身

`heading`（見出し）と `blocks`（中身）の組み合わせ。ブロックは4種類。

```json
{
  "heading": "デザインのこだわり",
  "blocks": [
    { "text": "段落。改行したいときは \n を入れる。" },
    { "sub": "太字の小見出し" },
    { "list": ["箇条書き1", "箇条書き2"] },
    { "image": "images/works/newwork-full.webp", "alt": "全体デザイン" }
  ]
}
```

`text` と `list` の中では `[表示したい文字](URL)` と書くとリンクになる。

---

## 2. Contactフォームを有効にする

送信先はGoogleフォーム。**現在は未設定で、送信ボタンは押せない状態**。

1. Googleフォームを作り、記述式の質問を3つ用意する（お名前 / メールアドレス / お問い合わせ内容）
2. 右上「︙」→ **「事前入力したURLを取得」** で出てきたURLから `entry.123456789` を3つ控える
3. `data/site.json` の `googleForm` を埋める

```json
"googleForm": {
  "actionUrl": "https://docs.google.com/forms/d/e/<フォームID>/formResponse",
  "entries": {
    "name": "entry.123456789",
    "email": "entry.987654321",
    "message": "entry.111222333"
  }
}
```

`actionUrl` は事前入力URLの `.../viewform?...` を **`.../formResponse`** に書き換えたもの。

---

## 3. 文言・プロフィールを変える

`data/site.json` にまとめてある。

| 変えたいもの | 場所 |
|---|---|
| ヒーローのコピー、肩書き | `hero` |
| 各セクションの見出しと導入文 | `worksSection` / `aboutSection` / `cta` |
| TOPのAboutに出る短い紹介文 | `aboutSection.profile`（段落ごとの配列） |
| Aboutページの本文 | `about.body` |
| 経歴 | `about.career` |
| できること3つ | `about.skills`（TOPとAboutの両方に出る） |
| プロフィール写真 | `about.image`。元画像は `scripts/assets/` に置き、`python scripts/build-about-photo.py` で 3:4 のWebPを書き出す |
| SNSリンク | `social` |

### 経歴を足す・年月を埋める

`about.career` は `period`（年月）・`title`（見出し）・`text`（説明、省略可）の3つ。

```json
{ "period": "2024.04", "title": "◯◯に入社", "text": "担当したことの説明。" }
```

**年月がまだ決まっていない項目は `period` を空文字にしてある**。決まったら埋める。
上から順に表示されるので、並べ替えは配列の順番を入れ替えるだけでよい。

---

## 4. デザインの決まりごと

`app/globals.css` の先頭にすべての値をまとめてある。色や余白を変えるときはここだけ触れば全ページに反映される。

| | 値 |
|---|---|
| 色 | 背景 `#F7F7F5` / 面 `#FFFFFF` / 文字 `#181818` / 補助 `#6B6B6B` / 罫線 `#D9D9D6` / アクセント `#D7FF4A` / 濃色 `#111111` |
| 書体 | 欧文 Inter / 和文 Noto Sans JP |
| コンテンツ幅 | 1200px（タブレット 672 / モバイル 358） |
| 角丸 | カード20px / 入力12px / ボタンは丸 |

和文は字間を広め（`0.04em`）、欧文の見出しは詰める（`-0.02em`）。国内外のポートフォリオを実測して決めた値。

---

## 5. 構成

```
app/
  page.jsx              TOP
  works/page.jsx        Works一覧
  works/[id]/page.jsx   Works詳細
  about/ contact/       各ページ
  globals.css           デザインの決まりごと
components/             ヘッダー・カード・ボタンなどの部品
  WorkCarousel.jsx      TOPの実績（中央の1枚を大きく、左右にループ。
                        見える枚数は PC 3枚 / タブレット・スマホ 1枚）
  Hero.jsx              ファーストビュー。スマホ・タブレットはスクロールで紹介文が1行ずつ出る
data/works.json         ★実績データ（普段さわるのはここだけ）
data/site.json          文言とサイト設定
public/images/          画像
scripts/
  build-about-photo.py  プロフィール写真を 3:4 のWebPにする
  build-hero-assets.py  ヒーローの空と人物の画像をつくる
  assets/               書き出しのもとになる元画像（公開はされない）
  flatten-rsc.mjs       ビルド後の調整（先読みデータの配置）
.github/workflows/      pushしたら自動で公開する設定
```

`out/` はビルドで作られる出力なので、直接編集しないこと。
