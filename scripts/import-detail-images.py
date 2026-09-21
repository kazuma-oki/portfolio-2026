# -*- coding: utf-8 -*-
"""
実績詳細画像 を各ページへ取り込む（一度きりの変換。何度流しても同じ結果になる）。

    python scripts/import-detail-images.py

やること
    1. ../ポートフォリオ/実績詳細画像/ の画像を WebP にして public/images/works/ へ
    2. data/works.json の各作品に、画像のブロックを入れ直す
    3. ワイヤーフレームは data/banners.json に「面」として追記する

置き場所
    完成物（サムネ・バナー）  「概要」の末尾
    ワイヤーフレーム          「Wireframe」の見出しを立てて、動かせる面に
    制作フロー                「成果・学び」の末尾に折りたたみで
    サイト全体（Portfolio）   「工夫したポイント」の末尾

原稿（実績文章.md）を取り込み直したあとは、このスクリプトも流し直す。
"""
import io
import json
import os
import re
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(os.path.dirname(ROOT), "ポートフォリオ", "実績詳細画像")
OUT_DETAIL = os.path.join(ROOT, "public", "images", "works", "detail")
OUT_WIRE = os.path.join(ROOT, "public", "images", "works", "wireframes")
WEB_DETAIL = "images/works/detail"
WEB_WIRE = "images/works/wireframes"

# ---- 完成物。「概要」の末尾に置く ----------------------------------------
MAIN = {
    "LINEミニアプリサムネ": ("article-line-miniapp", "LINEミニアプリ記事のサムネイル"),
    "SNSトレンドニュースサムネ": ("dl-sns-trend-news", "SNSトレンドニュース資料ダウンロードページのサムネイル"),
    "Wantedlyサムネ": ("note-party-report", "社内Wantedlyストーリーのサムネイル"),
    "Xアルゴリズムサムネ": ("wp-x-algorithm", "2026年Xアルゴリズム資料のサムネイル"),
    "Xアルゴリズムセミナーサムネ": ("webinar-x-algorithm", "Xアルゴリズム攻略ウェビナーの告知サムネイル"),
    "X発話数増加サムネ": ("wp-x-mentions", "X発話数増加 提案フレームワーク資料のサムネイル"),
    "インスタツール5社比較記事サムネ": ("article-instagram-tool", "Instagramキャンペーンツール比較記事のサムネイル"),
    "画像生成機能費用サムネ": ("article-genai-cost", "画像生成機能の導入費用記事のサムネイル"),
    "写真投稿キャンペーンサムネイル": ("article-photo-campaign", "写真投稿キャンペーン記事のサムネイル"),
    "対話型キャンペーンサムネイル": ("article-interactive-campaign", "対話型キャンペーン資料のサムネイル"),
    "画像合成生成サムネイル": ("article-image-composite", "画像合成・生成キャンペーン資料のサムネイル"),
    "ドリトスバナー": ("snack-campaign-banner", "菓子メーカーキャンペーンの広告バナー"),
}

# ---- 制作フロー。「成果・学び」の末尾に折りたたみで ----------------------
FLOW = {
    "写真投稿キャンペーンサムネ(制作フロー)": ("article-photo-campaign", "写真投稿キャンペーン記事のサムネイルができるまで"),
    "対話型キャンペーンサムネイル(制作フロー)": ("article-interactive-campaign", "対話型キャンペーン資料のサムネイルができるまで"),
    "画像合成・生成サムネ(制作フロー)": ("article-image-composite", "画像合成・生成キャンペーン資料のサムネイルができるまで"),
}

# ---- サイト全体。「工夫したポイント」の末尾 ------------------------------
FULL = {
    "ポートフォリオ画像": ("portfolio", "ポートフォリオサイトの全ページ"),
}

# ---- ワイヤーフレーム。面ごとにまとめる ----------------------------------
# 接頭辞 → (面のキー, 作品id, 面の小見出し)
WIRE_GROUPS = [
    ("クリアデューフレームワーク1-", "lenscare-receipt", "lenscare-campaign-wireframe", "レシート登録の流れ"),
    ("クリアデューフレームワーク2-", "lenscare-entry", "lenscare-campaign-wireframe", "応募の流れ"),
    ("ドリトスフレームワーク", "snack-entry", "snack-campaign-wireframe", "応募の流れ"),
]

WIRE_SECTION = "Wireframe"
FLOW_LABEL = "制作の流れを見る"
CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩"


def save(im, out, width, quality):
    """幅を指定して WebP にする。元より大きくはしない"""
    w = min(width, im.width)
    h = round(im.height * w / im.width)
    im.resize((w, h), Image.LANCZOS).save(out, "WEBP", quality=quality, method=6)
    return w, h, os.path.getsize(out)


def load(name):
    for ext in (".png", ".jpg", ".jpeg", ".webp"):
        p = os.path.join(SRC, name + ext)
        if os.path.isfile(p):
            return p
    # ファイル名の末尾に空白が入っているものがあるので、そこも見る
    for f in os.listdir(SRC):
        if os.path.splitext(f)[0].strip() == name:
            return os.path.join(SRC, f)
    raise SystemExit("元の画像が見つからない: " + name)


def blocks_of(work, heading):
    sec = next((s for s in work["sections"] if s["heading"] == heading), None)
    if sec is None:
        raise SystemExit("節が見つからない: %s / %s" % (work["id"], heading))
    return sec["blocks"]


def strip_mine(work):
    """このスクリプトが入れたものを取り除く（何度流しても同じ結果にするため）"""
    work["sections"] = [s for s in work["sections"] if s["heading"] != WIRE_SECTION]
    for sec in work["sections"]:
        sec["blocks"] = [
            b for b in sec["blocks"]
            if "fold" not in b and not str(b.get("image", "")).startswith(WEB_DETAIL)
        ]


def main():
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    os.makedirs(OUT_DETAIL, exist_ok=True)
    os.makedirs(OUT_WIRE, exist_ok=True)

    works = json.load(io.open(os.path.join(ROOT, "data", "works.json"), encoding="utf-8"))
    by_id = {w["id"]: w for w in works}
    for w in works:
        strip_mine(w)

    total = 0
    done = []

    # 1. 完成物
    for name, (wid, alt) in MAIN.items():
        with Image.open(load(name)) as im:
            width = 1600 if im.width > 2000 else 1200
            out = os.path.join(OUT_DETAIL, wid + "-main.webp")
            w, h, size = save(im.convert("RGB"), out, width, 82)
        total += size
        blocks_of(by_id[wid], "概要").append(
            {"image": "%s/%s-main.webp" % (WEB_DETAIL, wid), "alt": alt, "width": w, "height": h})
        done.append(("完成物", wid, "%dx%d" % (w, h), size))

    # 2. サイト全体
    for name, (wid, alt) in FULL.items():
        with Image.open(load(name)) as im:
            out = os.path.join(OUT_DETAIL, wid + "-full.webp")
            w, h, size = save(im.convert("RGB"), out, 1400, 82)
        total += size
        blocks_of(by_id[wid], "工夫したポイント").append(
            {"image": "%s/%s-full.webp" % (WEB_DETAIL, wid), "alt": alt, "width": w, "height": h})
        done.append(("全体", wid, "%dx%d" % (w, h), size))

    # 3. 制作フロー（折りたたみ）
    for name, (wid, alt) in FLOW.items():
        with Image.open(load(name)) as im:
            out = os.path.join(OUT_DETAIL, wid + "-flow.webp")
            w, h, size = save(im.convert("RGB"), out, 1200, 74)
        total += size
        blocks_of(by_id[wid], "成果・学び").append(
            {"fold": FLOW_LABEL, "image": "%s/%s-flow.webp" % (WEB_DETAIL, wid),
             "alt": alt, "width": w, "height": h})
        done.append(("制作フロー", wid, "%dx%d" % (w, h), size))

    # 4. ワイヤーフレーム
    banners_path = os.path.join(ROOT, "data", "banners.json")
    banners = json.load(io.open(banners_path, encoding="utf-8"))
    banners = {k: v for k, v in banners.items() if not k.startswith(("lenscare-", "snack-"))}

    files = sorted(os.listdir(SRC))
    for prefix, key, wid, sub in WIRE_GROUPS:
        names = [f for f in files if os.path.splitext(f)[0].startswith(prefix)]
        if not names:
            raise SystemExit("ワイヤーフレームが見つからない: " + prefix)

        def order(f):
            rest = os.path.splitext(f)[0][len(prefix):]
            m = next((i for i, c in enumerate(CIRCLED) if c in rest), 99)
            return m

        items = []
        for i, f in enumerate(sorted(names, key=order), start=1):
            rest = os.path.splitext(f)[0][len(prefix):].strip()
            title = re.sub(r"^[%s]" % CIRCLED, "", rest).strip() or ("画面%d" % i)
            bid = "%s-%02d" % (key, i)
            with Image.open(os.path.join(SRC, f)) as im:
                im = im.convert("RGB")
                w, h, size = save(im, os.path.join(OUT_WIRE, bid + ".webp"), 520, 78)
                lw, lh, lsize = save(im, os.path.join(OUT_WIRE, bid + "-lg.webp"), im.width, 82)
            total += size + lsize
            items.append({
                "id": bid,
                "src": "%s/%s.webp" % (WEB_WIRE, bid),
                "large": "%s/%s-lg.webp" % (WEB_WIRE, bid),
                "w": w, "h": h,
                "ratio": round(w / h, 4),
                "title": title,
            })
        banners[key] = items
        done.append(("ワイヤー", key, "%d枚" % len(items), sum(1 for _ in items)))

    # ワイヤーフレームの節を作る（「担当範囲」の次に入れる）
    for wid in ("snack-campaign-wireframe", "lenscare-campaign-wireframe"):
        work = by_id[wid]
        groups = [g for g in WIRE_GROUPS if g[2] == wid]
        blocks = []
        one = len(groups) == 1
        for _, key, _, sub in groups:
            if not one:
                blocks.append({"sub": sub})
            blocks.append({"canvas": key, "mode": "strip"})
        at = next(i for i, s in enumerate(work["sections"]) if s["heading"] == "担当範囲") + 1
        work["sections"].insert(at, {"heading": WIRE_SECTION, "blocks": blocks})

    # 5. Portfolio の作品URL
    url = "https://kazuma-oki.github.io/portfolio-2026/"
    pf = by_id["portfolio"]
    pf["info"] = [i for i in pf["info"] if i["label"] != "作品URL"]
    pf["info"].append({"label": "作品URL", "value": "[%s](%s)" % (url, url)})
    pf["url"] = url

    io.open(os.path.join(ROOT, "data", "works.json"), "w", encoding="utf-8", newline="\n").write(
        json.dumps(works, ensure_ascii=False, indent=2) + "\n")
    io.open(banners_path, "w", encoding="utf-8", newline="\n").write(
        json.dumps(banners, ensure_ascii=False, indent=2) + "\n")

    for kind, who, size, n in done:
        print("  %-8s %-28s %s" % (kind, who, size))
    print("\n%d件を配置 ／ 画像の合計 %.1f MB" % (len(done), total / 1048576))
    print("Portfolio の作品URL: %s" % url)


if __name__ == "__main__":
    main()
