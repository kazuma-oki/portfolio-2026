"""プロフィール写真をつくる

    python scripts/build-about-photo.py

scripts/assets/Oki-Kazuma.png（縦長の元写真）を 3:4 に切って WebP にする。
TOPのAboutセクションとAboutページで同じ1枚を使う。

元写真は 880x1787 と縦に長いため、そのまま載せると本文より縦に長くなる。
顔と犬の顔が両方入る位置で切り取る。
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "scripts" / "assets" / "Oki-Kazuma.png"
DEST = ROOT / "public" / "images" / "about-portrait.webp"

# 切り取る比率（幅 : 高さ）
RATIO = (3, 4)

# 切り取りの開始位置。0で上端、1で下端。
# 0.2 で顔（上から約11%）と犬の顔（約55%）が収まる。
TOP = 0.2


def main():
    src = Image.open(SRC).convert("RGB")
    w, h = src.size

    box_h = round(w * RATIO[1] / RATIO[0])
    if box_h > h:                       # 元が横長なら幅のほうを詰める
        box_h = h
        box_w = round(h * RATIO[0] / RATIO[1])
        left = (w - box_w) // 2
        top = 0
    else:
        box_w = w
        left = 0
        top = round((h - box_h) * TOP)

    out = src.crop((left, top, left + box_w, top + box_h))

    if out.width > 960:                 # 実際に使う最大幅は 420px 程度。2倍で足りる
        out = out.resize((960, round(out.height * 960 / out.width)), Image.LANCZOS)

    out.save(DEST, "WEBP", quality=86, method=6)
    print(f"about-portrait.webp  {out.width}x{out.height}"
          f"（元 {w}x{h} の y={top}〜{top + box_h} を使用）  "
          f"{DEST.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
