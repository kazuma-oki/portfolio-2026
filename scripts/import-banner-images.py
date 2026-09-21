# -*- coding: utf-8 -*-
"""
タイムズカーバナー集 を data/banners.json と WebP に取り込む（一度きりの変換）。

    python scripts/import-banner-images.py

元画像は高さ1080で統一されていて、幅だけが 1080 / 1920 / 3240 と違う。
その比率を保ったまま2種類を書き出す。

    b01.webp     面に並べる用（高さ480）
    b01-lg.webp  拡大したときに見せる用（高さ1080）

並び順もここで決めて書き出す。固定の種でシャッフルしたうえで、
横長が隣り合わないように散らす。実行するたびに変わらないので、
ビルドし直しても面の見た目は動かない。
"""
import io
import json
import os
import random
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(os.path.dirname(ROOT), "ポートフォリオ", "タイムズカーバナー集")
OUT_DIR = os.path.join(ROOT, "public", "images", "works", "timescar-banners")
JSON_PATH = os.path.join(ROOT, "data", "banners.json")
WEB_DIR = "images/works/timescar-banners"

# 面に並べる用 / 拡大用。どちらも高さを基準にする（元が高さ1080で揃っているため）
THUMB_H, THUMB_Q = 480, 76
LARGE_H, LARGE_Q = 1080, 82

SEED = 20260921
EXTS = (".png", ".jpg", ".jpeg", ".webp")


def shuffled(items):
    """固定の種でシャッフルしたあと、横長が隣り合わないように散らす"""
    rnd = random.Random(SEED)
    items = list(items)
    rnd.shuffle(items)

    wide = [x for x in items if x["w"] > x["h"]]
    square = [x for x in items if x["w"] <= x["h"]]
    if not wide:
        return items

    # 正方形の列に、横長をほぼ等間隔で差し込む
    step = (len(square) + 1) / (len(wide) + 1)
    out = list(square)
    for i, item in enumerate(wide):
        at = min(len(out), int(round((i + 1) * step)) + i)
        out.insert(at, item)
    return out


def main():
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    if not os.path.isdir(SRC):
        raise SystemExit("元のフォルダがない: " + SRC)
    os.makedirs(OUT_DIR, exist_ok=True)

    found = []
    for name in sorted(os.listdir(SRC)):
        path = os.path.join(SRC, name)
        if not os.path.isfile(path) or not name.lower().endswith(EXTS):
            continue
        with Image.open(path) as im:
            w, h = im.size
        found.append({"path": path, "title": os.path.splitext(name)[0].strip(), "w": w, "h": h})

    if not found:
        raise SystemExit("画像が1枚も見つからない: " + SRC)

    heights = set(x["h"] for x in found)
    if len(heights) != 1:
        print("※ 高さが揃っていない: %s（行の高さは揃うが、比率はそのまま使う）" % sorted(heights))

    items, total_thumb, total_large = [], 0, 0
    for i, src in enumerate(shuffled(found), start=1):
        bid = "b%02d" % i
        ratio = src["w"] / src["h"]
        with Image.open(src["path"]) as im:
            im = im.convert("RGB")
            for suffix, height, quality in (("", THUMB_H, THUMB_Q), ("-lg", LARGE_H, LARGE_Q)):
                out = os.path.join(OUT_DIR, bid + suffix + ".webp")
                im.resize((round(height * ratio), height), Image.LANCZOS).save(
                    out, "WEBP", quality=quality, method=6)
                size = os.path.getsize(out)
                if suffix:
                    total_large += size
                else:
                    total_thumb += size

        items.append({
            "id": bid,
            "src": "%s/%s.webp" % (WEB_DIR, bid),
            "large": "%s/%s-lg.webp" % (WEB_DIR, bid),
            "w": round(THUMB_H * ratio),
            "h": THUMB_H,
            "ratio": round(ratio, 4),
            "title": src["title"],
        })
        print("  %s  %-28s %5d×%-5d 比%.2f" % (bid, src["title"][:28], src["w"], src["h"], ratio))

    io.open(JSON_PATH, "w", encoding="utf-8", newline="\n").write(
        json.dumps({"timescar-banners": items}, ensure_ascii=False, indent=2) + "\n")

    wide = [x for x in items if x["ratio"] > 1.01]
    print("\n%d枚を取り込み（横長 %d枚：%s）" % (
        len(items), len(wide), "／".join("%s %s" % (x["id"], x["title"][:12]) for x in wide)))
    print("面に並べる用 %.1f MB ／ 拡大用 %.1f MB" % (total_thumb / 1048576, total_large / 1048576))
    print("→ %s" % os.path.relpath(JSON_PATH, ROOT))


if __name__ == "__main__":
    main()
