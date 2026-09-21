# -*- coding: utf-8 -*-
"""
実績文章.md を data/works.json / data/study.json に取り込む（一度きりの変換）。

    python scripts/import-works-text.py

原稿の書式
    # **タイトル**        → title（直後の1行が summary）
    ## **見出し**         → sections[].heading
    ### **小見出し**      → { sub } ブロック
    * 箇条書き            → { list } ブロック
    ふつうの段落          → { text } ブロック（行末2スペースは改行として残す）
    ## **制作情報**       → 本文に入れず info[{label, value}] に構造化する

id / category / tag / year / thumb / mainImage は今の値をそのまま残す。
role / tools は info に置き換わるので取り除く。
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(os.path.dirname(ROOT), "ポートフォリオ", "実績文章.md")

# 原稿の見出し → 作品id。あいまい一致はしない
MAP = {
    "Ka!za": "kaiza",
    "Portfolio": "portfolio",
    "Green Loop": "greenloop",
    "画像合成・生成キャンペーン資料｜サムネイル": "article-image-composite",
    "対話型キャンペーン資料｜サムネイル": "article-interactive-campaign",
    "カーシェアサービス公式X｜バナー": "carshare-banners",
    "菓子メーカーキャンペーン｜広告バナー": "snack-campaign-banner",
    "菓子メーカーキャンペーン｜応募フォーム": "snack-campaign-wireframe",
    "写真投稿キャンペーン記事｜サムネイル": "article-photo-campaign",
    "社内Wantedly ストーリー｜サムネイル": "note-party-report",
    "コンタクトレンズ洗浄液メーカーキャンペーン｜応募フォーム": "lenscare-campaign-wireframe",
    "画像生成機能の導入費用記事｜サムネイル": "article-genai-cost",
    "2026年Xアルゴリズム資料｜サムネイル": "wp-x-algorithm",
    "X発話数増加 提案フレームワーク資料｜サムネイル": "wp-x-mentions",
    "LINEミニアプリ記事｜サムネイル": "article-line-miniapp",
    "Xアルゴリズム攻略ウェビナー｜告知サムネイル": "webinar-x-algorithm",
    "SNSトレンドニュース資料ダウンロードページ｜サムネイル": "dl-sns-trend-news",
    "Instagramキャンペーンツール比較記事｜サムネイル": "article-instagram-tool",
}

INFO_HEADING = "制作情報"

# いま入っている画像の置き場所（②に手をつけるときに決め直す前提で、いったん残す）
KEEP_IMAGES = {
    "carshare-banners": ("Banner Collection", {"canvas": "timescar-banners"}),
    "kaiza": ("工夫したポイント", {
        "image": "images/works/kaiza-full.webp",
        "alt": "Ka!zaコーポレートサイトの全ページ。上から順にファーストビュー、事業内容、会社概要、新着情報",
        "width": 1400,
        "height": 6606,
    }),
    "greenloop": ("工夫したポイント", {
        "image": "images/works/greenloop-full.webp",
        "alt": "Green Loop コーポレートサイトの全体デザイン",
    }),
}


def clean(s):
    """見出しの ** を外し、markdown のエスケープを解く"""
    s = s.strip()
    s = re.sub(r"^\*\*|\*\*$", "", s).strip()
    # \& \| \- などの、記号の前に付いた逃がし文字を外す
    s = re.sub(r"\\([\\`*_{}\[\]()#+\-.!&|~<>])", r"\1", s)
    return s.strip()


def inline(s):
    """本文用。太字とリンクの記法は残したまま、エスケープだけ解く"""
    return re.sub(r"\\([\\`_{}\[\]()#+\-.!&|~<>])", r"\1", s).strip()


def split_works(text):
    """原稿を作品ごとに切り分ける"""
    out, cur = [], None
    for line in text.split("\n"):
        if line.startswith("# ") and not line.startswith("## "):
            if cur:
                out.append(cur)
            cur = {"title": clean(line[2:]), "lines": []}
        elif cur is not None:
            cur["lines"].append(line)
    if cur:
        out.append(cur)
    return out


def parse_blocks(lines):
    """段落・箇条書き・小見出しを blocks に変換する"""
    blocks, para, items = [], [], []

    def flush_para():
        if para:
            # 行末2スペースは改行として残す（RichText が <br> にする）
            blocks.append({"text": "\n".join(para)})
            para.clear()

    def flush_list():
        if items:
            blocks.append({"list": list(items)})
            items.clear()

    for raw in lines:
        line = raw.rstrip()
        s = line.strip()
        if not s or s == "---":
            flush_para()
            flush_list()
            continue
        if s.startswith("### "):
            flush_para()
            flush_list()
            blocks.append({"sub": clean(s[4:])})
            continue
        if s.startswith("* "):
            flush_para()
            text = inline(s[2:])
            # 字下げされた箇条書きは、直前の項目の下位に付ける
            if len(raw) - len(raw.lstrip()) > 0 and items:
                parent = items[-1]
                if isinstance(parent, str):
                    parent = {"text": parent, "list": []}
                    items[-1] = parent
                parent["list"].append(text)
            else:
                items.append(text)
            continue
        flush_list()
        para.append(inline(s))
    flush_para()
    flush_list()
    return blocks


def parse_info(lines):
    """制作情報を [{label, value}] にする。**ラベル** の次の行以降が値"""
    info, label, value = [], None, []

    def flush():
        if label is not None:
            v = "\n".join([x for x in value if x])
            if v:
                info.append({"label": label, "value": v})

    for raw in lines:
        s = raw.strip()
        if not s or s == "---":
            continue
        m = re.match(r"^\*\*(.+?)\*\*$", s)
        if m:
            flush()
            label = clean(m.group(1))
            value = []
        elif label is not None:
            value.append(inline(s))
    flush()
    return info


def count_items(items):
    n = 0
    for it in items:
        n += 1
        if isinstance(it, dict):
            n += count_items(it.get("list", []))
    return n


def parse_work(w):
    """1作品ぶんの lines を title / summary / sections / info にする"""
    lines = w["lines"]

    # リード文：最初の ## / --- より前の、最初の非空行
    summary = ""
    for line in lines:
        s = line.strip()
        if not s:
            continue
        if s.startswith("##") or s == "---":
            break
        summary = inline(s)
        break

    # ## ごとに切る
    chunks, cur = [], None
    for line in lines:
        s = line.strip()
        if s.startswith("## "):
            if cur:
                chunks.append(cur)
            cur = {"heading": clean(s[3:]), "lines": []}
        elif cur is not None:
            cur["lines"].append(line)
    if cur:
        chunks.append(cur)

    sections, info = [], []
    for c in chunks:
        if c["heading"] == INFO_HEADING:
            info = parse_info(c["lines"])
            continue
        blocks = parse_blocks(c["lines"])
        if blocks:
            sections.append({"heading": c["heading"], "blocks": blocks})

    return {
        "title": w["title"],
        "summary": summary,
        "sections": sections,
        "info": info,
        "n_para": sum(1 for s in sections for b in s["blocks"] if "text" in b),
        "n_list": sum(count_items(b["list"]) for s in sections for b in s["blocks"] if "list" in b),
        "n_sub": sum(1 for s in sections for b in s["blocks"] if "sub" in b),
    }


def main():
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    text = io.open(SRC, encoding="utf-8").read()
    parsed = {}
    for w in split_works(text):
        if w["title"] not in MAP:
            raise SystemExit("対応づけのない見出し: " + w["title"])
        parsed[MAP[w["title"]]] = parse_work(w)
    if len(parsed) != len(MAP):
        raise SystemExit("件数が合わない: %d / %d" % (len(parsed), len(MAP)))

    total = {"works": 0, "study": 0}
    for name in ("works", "study"):
        path = os.path.join(ROOT, "data", "%s.json" % name)
        items = json.load(io.open(path, encoding="utf-8"))
        for item in items:
            p = parsed.get(item["id"])
            if p is None:
                raise SystemExit("原稿にない作品: " + item["id"])
            item["title"] = p["title"]
            item["summary"] = p["summary"]
            item["sections"] = [
                {"heading": s["heading"], "blocks": list(s["blocks"])} for s in p["sections"]
            ]
            item["info"] = p["info"]
            # info に置き換わる項目は落とす
            item.pop("role", None)
            item.pop("tools", None)
            item.pop("date", None)
            # 作品URLがあればボタンに使う
            url = next((i["value"] for i in p["info"] if i["label"] == "作品URL"), "")
            m = re.search(r"\((https?://[^)\s]+)\)", url) or re.search(r"(https?://\S+)", url)
            item["url"] = m.group(1) if m else ""
            # いま入っている画像を決めた場所に戻す
            keep = KEEP_IMAGES.get(item["id"])
            if keep:
                heading, block = keep
                sec = next((s for s in item["sections"] if s["heading"] == heading), None)
                if sec is None:
                    raise SystemExit("画像の置き場所がない: %s / %s" % (item["id"], heading))
                sec["blocks"].append(block)
            total[name] += 1
            print("  %-30s %-34s 節%2d 小%2d 段%3d 箇%3d 情報%2d"
                  % (item["id"], p["title"][:30], len(p["sections"]), p["n_sub"],
                     p["n_para"], p["n_list"], len(p["info"])))
        io.open(path, "w", encoding="utf-8", newline="\n").write(
            json.dumps(items, ensure_ascii=False, indent=2) + "\n")

    print("\n取り込み: works %d件 / study %d件" % (total["works"], total["study"]))


if __name__ == "__main__":
    main()
