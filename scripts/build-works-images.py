"""実績の画像をつくる

    python scripts/build-works-images.py

scripts/assets/works/<id>.png を、正方形のWebPにして
public/images/works/<id>.webp に書き出す。
一覧のカード・TOPのカルーセル・詳細ページのどれも正方形で表示するので、
1作品につき1枚だけ用意すればよい。

元画像がわずかに正方形でない場合は、中央で切り取って正方形にそろえる。
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "scripts" / "assets" / "works"
DEST = ROOT / "public" / "images" / "works"

# 書き出す一辺の長さ。実際に出る最大の大きさは
# タブレット（カルーセルの中央カード）の約870px。その2倍近くまでカバーする
SIZE = 1600
QUALITY = 84


def square(im):
    """中央で切り取って正方形にする"""
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return im.crop((left, top, left + side, top + side))


def main():
    if not SRC.exists():
        print(f"元画像の置き場がありません: {SRC}")
        return

    DEST.mkdir(parents=True, exist_ok=True)
    for path in sorted(SRC.glob("*.png")) + sorted(SRC.glob("*.jpg")):
        im = Image.open(path)
        before = im.size
        # 透過があっても、表示は白い面の上なので白で埋める
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
            bg = Image.new("RGB", im.size, (255, 255, 255))
            bg.paste(im, mask=im.split()[-1])
            im = bg
        else:
            im = im.convert("RGB")

        im = square(im)
        if im.width != SIZE:
            im = im.resize((SIZE, SIZE), Image.LANCZOS)

        out = DEST / f"{path.stem}.webp"
        im.save(out, "WEBP", quality=QUALITY, method=6)
        print(f"{out.name:20} {before[0]}x{before[1]} → {SIZE}x{SIZE}  "
              f"{out.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
