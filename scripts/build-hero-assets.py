"""ヒーロー用の素材をつくる（一度きりの処理・記録として残す）

    python scripts/build-hero-assets.py

1. public/images/sky-loop.webp
   hero.webp の上部（人物が写っていない空の部分）を切り出し、
   その左右反転を横に連結する。両端の色が必ず一致するので、
   横に繰り返しても継ぎ目が見えない。

2. public/images/hero-person.webp
   切り抜き済みの人物PNGを、透過を保ったままWebPにする。
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "public" / "images"
PERSON_SRC = Path.home() / "Downloads" / "人物.png"

# 空として使う範囲（hero.webp の上から何割か）。人物.png のalphaを見ると
# 上から40%あたりまでは人物が入らない。表示時に拡大されてぼやけないよう、
# 人物が入らないぎりぎりまで広く取る。
SKY_BOTTOM = 0.38


def build_sky():
    src = Image.open(IMAGES / "hero.webp").convert("RGB")
    w, h = src.size
    sky = src.crop((0, 0, w, int(h * SKY_BOTTOM)))

    # 継ぎ目をなくすため「元画像 + その鏡像」を横に並べる
    mirrored = sky.transpose(Image.FLIP_LEFT_RIGHT)
    loop = Image.new("RGB", (sky.width * 2, sky.height))
    loop.paste(sky, (0, 0))
    loop.paste(mirrored, (sky.width, 0))

    # 横長すぎると重いので高さ800pxを上限に縮める
    if loop.height > 800:
        ratio = 800 / loop.height
        loop = loop.resize((int(loop.width * ratio), 800), Image.LANCZOS)

    dest = IMAGES / "sky-loop.webp"
    loop.save(dest, "WEBP", quality=88, method=6)
    print(f"sky-loop.webp  {loop.width}x{loop.height}  {dest.stat().st_size // 1024}KB")

    # 表示側が縦横比を知る必要があるので data/site.json に書き戻す
    import json

    sp = ROOT / "data" / "site.json"
    data = json.loads(sp.read_text(encoding="utf-8"))
    data["hero"]["skyRatio"] = f"{loop.width} / {loop.height}"
    sp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + chr(10), encoding="utf-8")
    print(f"  site.json の skyRatio を {loop.width} / {loop.height} に更新")


def build_person():
    if not PERSON_SRC.exists():
        print(f"人物画像が見つかりません: {PERSON_SRC}")
        return
    person = Image.open(PERSON_SRC).convert("RGBA")

    # 横1200pxもあれば表示には十分
    if person.width > 1200:
        ratio = 1200 / person.width
        person = person.resize((1200, int(person.height * ratio)), Image.LANCZOS)

    dest = IMAGES / "hero-person.webp"
    person.save(dest, "WEBP", quality=90, method=6)
    print(f"hero-person.webp  {person.width}x{person.height}  {dest.stat().st_size // 1024}KB")


if __name__ == "__main__":
    build_sky()
    build_person()
