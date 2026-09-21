"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import BannerLightbox from "./BannerLightbox";
import HoverCursor from "./HoverCursor";
import ZoomButtons from "./ZoomButtons";
import styles from "./BannerCanvas.module.css";

// バナーどうしの間。カードの高さを1としたときの比
const GAP = 0.14;
// これ以上動いたら「掴んで動かした」とみなし、拡大を開かない（カルーセルと同じ値）
const DRAG_SLOP = 6;
// 行ごとに左右をずらす量。格子に見えないように、けれど散らかりすぎないように
const ROW_OFFSETS = [-0.3, 0.22, -0.14, 0.34];
// 指を離したあとの滑り。1コマごとにこの割合まで落ちる
const FRICTION = 0.92;
// これより遅くなったら止める（px/コマ）
const STOP_SPEED = 0.4;
// 大きさの段階。1がふつう
const SCALES = [0.6, 0.8, 1, 1.3, 1.7, 2.2];
/* 中身のまわりに置く余白。カードが面のふちに接していると、
   カーソルを当てて少し持ち上がったときに上が切れてしまう */
const PAD = 0.06;

/** 画面の広さで行数を決める。狭いほど1枚が小さくなりすぎないよう行を減らす */
function rowsFor(width) {
  return width > 1024 ? 4 : 3;
}

/**
 * ワイヤーフレームのように丈がまちまちなものは、幅をそろえて1列に並べる。
 * 上端はすべて 0。単位は「カードの幅＝1」。
 */
function layoutStrip(items) {
  let x = 0;
  const cards = items.map((b) => {
    const card = { ...b, x, y: 0 };
    x += 1 + GAP;
    return card;
  });
  // 丈は切らずに元の比率のまま。いちばん長いものが中身の高さになる
  const height = Math.max(...items.map((b) => 1 / b.ratio));
  return {
    cards: cards.map((c) => ({ ...c, x: c.x + PAD, y: PAD })),
    width: x - GAP + PAD * 2,
    height: height + PAD * 2,
    rows: 1,
    strip: true,
  };
}

/**
 * バナーを行に詰める。高さは全部そろっているので、幅だけを見て順に置けばよい。
 * 戻り値の座標はすべて「カードの高さ＝1」を単位にした比。
 * 実際の大きさは CSS の --h が決めるので、画面幅が変わっても並びは変わらない。
 */
function layout(items, rows) {
  const total = items.reduce((sum, b) => sum + b.ratio + GAP, -GAP);
  const target = total / rows;

  const placed = [];
  let row = 0;
  let x = 0;
  for (const b of items) {
    // 半分を超えて はみ出すなら次の行へ。行の長さが自然にそろう
    if (x > 0 && row < rows - 1 && x + b.ratio / 2 > target) {
      row += 1;
      x = 0;
    }
    placed.push({ ...b, row, x: x + ROW_OFFSETS[row % ROW_OFFSETS.length] });
    x += b.ratio + GAP;
  }

  const left = Math.min(...placed.map((p) => p.x));
  const right = Math.max(...placed.map((p) => p.x + p.ratio));
  return {
    cards: placed.map((p) => ({
      ...p,
      x: p.x - left + PAD,
      y: p.row * (1 + GAP) + PAD,
    })),
    width: right - left + PAD * 2,
    height: rows + (rows - 1) * GAP + PAD * 2,
    rows,
  };
}

/**
 * バナーを敷きつめた面。掴んで動かしながら見て回り、1枚を押すと拡大する。
 *
 * 面より中身のほうが大きいぶんだけ動かせる（端で止まる）。
 * マウスのときは上下左右、指のときは左右だけ動かし、
 * 上下になぞったぶんはページのスクロールにまかせる。
 */
export default function BannerCanvas({ banners, mode = "rows" }) {
  const strip = mode === "strip";
  // 1列に並べるのはワイヤーフレーム。呼び方を変える
  const label = strip ? "画像" : "バナー";
  const viewRef = useRef(null);
  const canvasRef = useRef(null);

  const [rows, setRows] = useState(4);
  const [scale, setScale] = useState(1);
  // 指のとき用。面ごと下に伸ばして、ページのスクロールで見てもらう
  const [touch, setTouch] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [contentH, setContentH] = useState(0);
  // 縦にも動かせるかどうか（向きの印に使う）
  const [canY, setCanY] = useState(false);
  // 掴んでいる間は追従する丸を少し縮める
  const [pressed, setPressed] = useState(false);
  const [openAt, setOpenAt] = useState(null);

  const plan = useMemo(
    () => (strip ? layoutStrip(banners) : layout(banners, rows)),
    [banners, rows, strip]
  );

  // いまの位置と、慣性のための速さ
  const posRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(0);
  const dragRef = useRef(null);
  // 掴んだまま開いた要素を覚えておき、閉じたときに戻す
  const openerRef = useRef(null);
  // 掴み終わりから呼ぶので、最新のものを ref 越しに見る
  const openRef = useRef(null);

  const limits = useCallback(() => {
    const view = viewRef.current;
    const canvas = canvasRef.current;
    if (!view || !canvas) return { minX: 0, minY: 0 };
    return {
      minX: Math.min(0, view.clientWidth - canvas.offsetWidth),
      minY: Math.min(0, view.clientHeight - canvas.offsetHeight),
    };
  }, []);

  const apply = useCallback(() => {
    const { minX, minY } = limits();
    const p = posRef.current;
    p.x = Math.min(0, Math.max(minX, p.x));
    p.y = Math.min(0, Math.max(minY, p.y));
    if (canvasRef.current) {
      canvasRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
    }
  }, [limits]);

  // 指の端末では、縦に動かす代わりに面ごと伸ばせるようにする
  useEffect(() => {
    setTouch(window.matchMedia("(hover: none)").matches);
  }, []);

  /* 画面の広さに合わせて行数を決め直し、真ん中から見せる */
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const fit = () => {
      setRows(rowsFor(window.innerWidth));
      // 幅が変わっただけのときは、はみ出さない位置に寄せるだけでよい
      apply();
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(view);
    return () => ro.disconnect();
  }, [apply]);

  /* 大きさを変えたあとは、はみ出さない位置に寄せて、
     いま縦に動かせるかどうかを測り直す（向きの印に使う） */
  useEffect(() => {
    apply();
    const canvas = canvasRef.current;
    if (canvas) setContentH(canvas.offsetHeight);
    const { minY } = limits();
    setCanY(minY < -1);
  }, [scale, expanded, plan, apply, limits]);

  /* 行数が変わると中身の大きさも変わるので置き直す。
     縦は真ん中に置くと、ちょうど1行ぶんが隠れて「上にも続きがある」ことが
     伝わらないので、カード半分ぶんだけずらして上の行をのぞかせる */
  useEffect(() => {
    const { minX, minY } = limits();
    const canvas = canvasRef.current;
    const h = canvas ? canvas.offsetHeight / plan.height : 0;
    posRef.current = strip
      ? { x: 0, y: 0 }
      : { x: minX / 2, y: Math.max(minY, -h * 0.55) };
    apply();
  }, [plan, apply, limits, strip]);

  /* 掴んで動かす */
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // マウスのときだけ上下にも動かす。指のときの上下はページにまかせる
    const freeY = () => window.matchMedia("(hover: hover)").matches;

    const glide = () => {
      const v = velRef.current;
      v.x *= FRICTION;
      v.y *= FRICTION;
      posRef.current.x += v.x;
      posRef.current.y += v.y;
      apply();
      if (Math.hypot(v.x, v.y) > STOP_SPEED) {
        frameRef.current = requestAnimationFrame(glide);
      } else {
        frameRef.current = 0;
      }
    };

    const onDown = (e) => {
      if (e.button != null && e.button > 0) return;
      /* ＋−は面の中に置いてあるので、ここで掴んでしまうと
         ポインタを面が預かってしまい、ボタンまで押下が届かない */
      if (e.target.closest(`.${styles.zoom}`)) return;
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
      velRef.current = { x: 0, y: 0 };
      dragRef.current = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        moved: 0,
        y: freeY(),
        // 掴んでいる間、pointerup の宛先は面に固定される。
        // 押したのがどのバナーかは、この時点でしか分からない
        card: e.target.closest(`.${styles.card}`),
      };
      view.setPointerCapture(e.pointerId);
      view.dataset.dragging = "true";
      setPressed(true);
    };

    const onMove = (e) => {
      const d = dragRef.current;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.lastX;
      const dy = e.clientY - d.lastY;
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      d.moved = Math.max(d.moved, Math.hypot(e.clientX - d.startX, e.clientY - d.startY));

      posRef.current.x += dx;
      if (d.y) posRef.current.y += dy;
      velRef.current = { x: dx, y: d.y ? dy : 0 };
      apply();
    };

    const onUp = (e) => {
      const d = dragRef.current;
      if (!d || d.id !== e.pointerId) return;
      dragRef.current = null;
      delete view.dataset.dragging;
      setPressed(false);
      if (view.hasPointerCapture(e.pointerId)) view.releasePointerCapture(e.pointerId);

      if (d.moved > DRAG_SLOP) {
        // 掴んで動かしたあとは、指を離した先のバナーを開かない
        if (!reduce && Math.hypot(velRef.current.x, velRef.current.y) > STOP_SPEED) {
          frameRef.current = requestAnimationFrame(glide);
        }
        return;
      }

      /* ほとんど動いていなければ「押した」とみなして開く。
         掴んでいる間は view がポインタを預かっていて、
         カードのボタンまで click が届かないので、ここで拾う */
      if (d.card) openRef.current?.(Number(d.card.dataset.index), d.card);
    };

    view.addEventListener("pointerdown", onDown);
    view.addEventListener("pointermove", onMove);
    view.addEventListener("pointerup", onUp);
    view.addEventListener("pointercancel", onUp);
    return () => {
      cancelAnimationFrame(frameRef.current);
      view.removeEventListener("pointerdown", onDown);
      view.removeEventListener("pointermove", onMove);
      view.removeEventListener("pointerup", onUp);
      view.removeEventListener("pointercancel", onUp);
    };
  }, [apply]);

  /* 丸に出す文字。掴んで動かすことも、押して拡大することもできる */
  const labelFor = useCallback(() => ["Drag or", "Click"], []);

  /* 面にフォーカスがあるときは矢印キーでも動かせるようにする */
  const onKeyDown = (e) => {
    const view = viewRef.current;
    if (!view) return;
    const stepX = view.clientWidth * 0.3;
    const stepY = view.clientHeight * 0.3;
    const move = { ArrowLeft: [stepX, 0], ArrowRight: [-stepX, 0], ArrowUp: [0, stepY], ArrowDown: [0, -stepY] }[e.key];
    if (!move) return;
    e.preventDefault();
    posRef.current.x += move[0];
    posRef.current.y += move[1];
    apply();
  };

  /* 大きさを変える。変える前後で、面の真ん中に見えていた点を合わせる */
  const changeScale = useCallback(
    (next) => {
      if (!next) return;
      const view = viewRef.current;
      if (view) {
        const r = next / scale;
        const p = posRef.current;
        const cx = -p.x + view.clientWidth / 2;
        const cy = -p.y + view.clientHeight / 2;
        p.x = view.clientWidth / 2 - cx * r;
        p.y = view.clientHeight / 2 - cy * r;
      }
      setScale(next);
    },
    [scale]
  );

  /* 面ごと下に伸ばす／戻す。伸ばしたら頭から見せる */
  const toggleExpand = useCallback(() => {
    setExpanded((v) => {
      if (!v) posRef.current.y = 0;
      return !v;
    });
  }, []);

  const open = useCallback((i, el) => {
    openerRef.current = el;
    setOpenAt(i);
  }, []);
  openRef.current = open;

  const close = useCallback(() => {
    setOpenAt(null);
    openerRef.current?.focus();
  }, []);

  return (
    <div className={styles.wrap}>
      <div
        className={styles.view}
        ref={viewRef}
        tabIndex={0}
        role="group"
        aria-label={`${label}（掴んで動かせます）`}
        onKeyDown={onKeyDown}
        data-expanded={expanded ? "true" : undefined}
        style={expanded && contentH ? { height: contentH } : undefined}
      >
        <div
          className={styles.canvas}
          ref={canvasRef}
          data-mode={mode}
          style={{
            "--rows": plan.rows,
            "--cw": plan.width,
            "--ch": plan.height,
            "--scale": scale,
          }}
        >
          {plan.cards.map((card, i) => (
            <button
              type="button"
              key={card.id}
              className={styles.card}
              data-index={i}
              style={{ "--x": card.x, "--y": card.y, "--w": card.ratio, "--ratio": card.ratio }}
              /* マウスや指のときは掴み終わりで開く。
                 ここはキーボードで押したとき（detail が 0）だけ */
              onClick={(e) => { if (e.detail === 0) open(i, e.currentTarget); }}
              aria-label={`${card.title}の${label}を拡大する`}
            >
              <Image
                src={asset(card.src)}
                alt={`タイムズカー公式Xのバナー：${card.title}`}
                width={card.w}
                height={card.h}
                sizes="(max-width: 540px) 200px, 320px"
                /* 面の中は窓の外にも並んでいる。後回しにすると
                   動かした先が白いままになるので、まとめて読む（36枚で0.7MB） */
                loading="eager"
                draggable={false}
              />
            </button>
          ))}
        </div>

        {/* 指のときは丸が出ないので、左右に動かせることをここで示す */}
        <span className={styles.edge} data-side="left" aria-hidden="true" />
        <span className={styles.edge} data-side="right" aria-hidden="true" />

        <div className={styles.zoom}>
          <ZoomButtons value={scale} steps={SCALES} onChange={changeScale} label={label} />
        </div>
      </div>

      {/* 拡大している間は、下の面の丸は出さない */}
      <HoverCursor
        areaRef={viewRef}
        labelFor={labelFor}
        pressed={pressed}
        hidden={openAt != null}
        /* 4行のときは上下にも動く。3行のときは中身がちょうど収まるので左右だけ */
        arrows={canY ? "all" : "x"}
      />

      {/* 指のときは縦に動かせないので、面ごと下に伸ばして見てもらう */}
      {strip && touch && (
        <button type="button" className={styles.expand} onClick={toggleExpand}>
          {expanded ? "もとに戻す" : "下に伸ばして見る"}
        </button>
      )}

      <p className={`${styles.hint} caption`}>
        {touch ? "スライド" : "ドラッグ"}で動かし、{label}を押すと拡大します
      </p>

      <BannerLightbox
        banners={banners}
        index={openAt}
        onClose={close}
        onChange={setOpenAt}
      />
    </div>
  );
}
