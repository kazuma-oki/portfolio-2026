"""ヒーロー用の素材をつくる

    python scripts/build-hero-assets.py

1. public/images/sky-loop.webp
   scripts/assets/sky-source.webp（指定の空写真）から、横に繰り返しても
   継ぎ目が出ないタイル画像をつくる。
   右端の帯を左端へクロスフェードで重ねることで、画像の左端と右端の
   色が一致した状態にする（鏡像でつなぐ方法と違い、左右対称の
   パターンが出ないので流れが自然に見える）。

2. public/images/hero-person.webp
   切り抜き済みの人物PNGを、透過を保ったままWebPにする。
"""

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "public" / "images"
SKY_SRC = ROOT / "scripts" / "assets" / "sky-source.webp"
PERSON_SRC = Path.home() / "Downloads" / "人物.png"

# 左右をなじませる帯の幅（ピクセル）。広いほど繋ぎ目は消えるが、
# そのぶん画像の横幅が縮む。
BLEND = 320



def seamless(im):
    """右端の帯を左端に重ねて、左右がつながる画像にする"""
    w, h = im.size
    body = im.crop((0, 0, w - BLEND, h)).copy()
    head = im.crop((0, 0, BLEND, h))          # 左端の帯
    tail = im.crop((w - BLEND, 0, w, h))      # 右端の帯

    # 左端では tail（元画像の右側）、右端では head（元画像の左側）になるマスク。
    # こうするとタイルの左端が元画像の x=w-BLEND、右端が x=w-BLEND-1 となり、
    # 繰り返したときに隣り合うピクセル同士がつながる。
    mask = Image.new("L", (BLEND, h))
    for x in range(BLEND):
        mask.paste(int(255 * x / (BLEND - 1)), (x, 0, x + 1, h))
    blended = Image.composite(head, tail, mask)

    body.paste(blended, (0, 0))
    return body


def edge_gap(im):
    """左端と右端の色の差（0に近いほど継ぎ目が出ない）"""
    w, h = im.size
    rgb = im.convert("RGB")
    rows = range(0, h, max(1, h // 40))
    diff = [
        abs(a - b)
        for y in rows
        for a, b in zip(rgb.getpixel((0, y)), rgb.getpixel((w - 1, y)))
    ]
    return sum(diff) / len(diff)


def build_sky():
    src = Image.open(SKY_SRC).convert("RGB")
    print(f"元の空: {src.size[0]}x{src.size[1]}  左右の色差 {edge_gap(src):.1f}")

    tile = seamless(src)
    print(f"つなぎ目処理後: {tile.size[0]}x{tile.size[1]}  左右の色差 {edge_gap(tile):.1f}")

    # 同じタイルを2枚つないで1枚の画像にする。
    # 表示側で要素を2つ並べると、その境界にサブピクセルの隙間が出て
    # 細い線に見えてしまうため、画像の中で完結させる。
    loop = Image.new("RGB", (tile.width * 2, tile.height))
    loop.paste(tile, (0, 0))
    loop.paste(tile, (tile.width, 0))

    dest = IMAGES / "sky-loop.webp"
    loop.save(dest, "WEBP", quality=88, method=6)
    print(f"sky-loop.webp  {loop.width}x{loop.height}（1枚ぶん {tile.width}px）  {dest.stat().st_size // 1024}KB")

    # 表示側が縦横比を知る必要があるので data/site.json に書き戻す
    sp = ROOT / "data" / "site.json"
    data = json.loads(sp.read_text(encoding="utf-8"))
    data["hero"]["skyRatio"] = f"{loop.width} / {loop.height}"
    sp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + chr(10), encoding="utf-8")
    print(f"  site.json の skyRatio を {loop.width} / {loop.height} に更新")


def build_person():
    if not PERSON_SRC.exists():
        print(f"人物画像が見つかりません（既存のものを使います）: {PERSON_SRC}")
        return
    person = Image.open(PERSON_SRC).convert("RGBA")

    if person.width > 1200:
        ratio = 1200 / person.width
        person = person.resize((1200, int(person.height * ratio)), Image.LANCZOS)

    dest = IMAGES / "hero-person.webp"
    person.save(dest, "WEBP", quality=90, method=6)
    print(f"hero-person.webp  {person.width}x{person.height}  {dest.stat().st_size // 1024}KB")


if __name__ == "__main__":
    build_sky()
    build_person()
