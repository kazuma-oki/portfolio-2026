"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import WorkCard from "./WorkCard";
import styles from "./WorkCarousel.module.css";

const THUMB_RATIO = "1 / 1";
// 大きさが変わりきるまでの時間（CSS の transition とそろえる）
const GROW_MS = 500;
// これ以上動いたら「掴んで動かした」とみなし、クリックを止める
const DRAG_SLOP = 6;
// これより速く払ったら、最寄りではなく1枚先へ送る（px/ミリ秒）
const FLICK_SPEED = 0.4;
// ホイールがこれだけたまったら1枚送る
const WHEEL_STEP = 40;
// 1枚送ったあと、つぎを受け付けるまで待つ時間
const WHEEL_WAIT = 300;
// バーのツマミの最小幅。これより細いと掴めない
const THUMB_MIN = 28;
// 大きさを直に書き込む範囲（中央から前後何枚まで）
const SCALE_WINDOW = 3;

// サーバー側では useLayoutEffect が動かないので、そこだけ useEffect にする
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * TOPの制作実績。
 * 必ず1枚が画面の中央にきて、その両隣は少し小さく見える。左右にループする。
 * 表示枚数は PC 3枚 / タブレット・スマホ 1枚（中央のほかは見切れて見える）。
 *
 * 横のスワイプはブラウザ標準のスクロール＋スナップにまかせ、
 * 矢印とドットはその補助。ループは前後に同じ並びの控えを置き、
 * 指が止まったところで真ん中の組へ戻すことで作っている（見た目は変わらない）。
 */
export default function WorkCarousel({ works }) {
  const n = works.length;
  const loop = n > 1;
  // 勢いよく振っても控えを使い切らないよう、件数が少ないときは多めに並べる
  const copies = loop ? (n >= 5 ? 3 : 5) : 1;
  const startCopy = (copies - 1) / 2;
  const startIndex = startCopy * n;

  const wrapRef = useRef(null);
  const trackRef = useRef(null);
  const cursorRef = useRef(null);
  const barRef = useRef(null);
  const thumbRef = useRef(null);
  const indexRef = useRef(startIndex);
  const changedAt = useRef(0);
  // 並びの寸法。画面の大きさが変わるまで変わらないので覚えておく
  const sizeRef = useRef(null);
  // いま「中央」の印をつけてあるカード。書き換える範囲を絞るために持つ
  const paintedRef = useRef(startIndex);
  // いま大きさを直に書き込んであるカード
  const scaledRef = useRef(new Set());
  // 追従する丸に出す文字。null のときは出さない
  const [cursorLabel, setCursorLabel] = useState(null);
  const [center, setCenter] = useState(startIndex);
  // 位置を戻している最中。この1コマだけ大きさの変化を止める
  const [jump, setJump] = useState(false);

  /* カードの並び。中央がどれかは JS が属性で書き換えるので、
     ここでは組み立て直さない。毎コマ54枚ぶん作り直すと、
     ちょうど拡大が始まるコマが重くなってカクつく */
  const slideNodes = useMemo(
    () =>
      Array.from({ length: n * copies }, (_, i) => {
        // 前後に置いた控え。読み上げとタブ移動からは外す
        const spare = loop && Math.floor(i / n) !== startCopy;
        return (
          <li
            key={i}
            className={styles.slide}
            data-center={i === startIndex ? "true" : undefined}
            data-side={i === startIndex ? undefined : i < startIndex ? "left" : "right"}
            aria-hidden={spare ? "true" : undefined}
          >
            {/* 大きさを変えるのは内側だけ。外の枠（スナップの基準）は動かさない */}
            <div className={styles.scaler}>
              <WorkCard
                work={works[i % n]}
                priority={i === startIndex}
                ratio={THUMB_RATIO}
                tabIndex={spare ? -1 : undefined}
              />
            </div>
          </li>
        );
      }),
    [works, n, copies, loop, startCopy, startIndex]
  );

  /**
   * 並びの寸法。カードの幅・すき間・左の余白・見えている幅を実寸で返す。
   * offsetLeft は整数に丸められてしまい、止まったあとに数値が合わず
   * スナップに引き直されるので、計算はすべてここから出す。
   *
   * getComputedStyle は重い。スクロール中は毎コマ呼ばれる道なので、
   * 一度測ったら覚えておき、画面の大きさが変わったときだけ測り直す
   */
  const metrics = (t) => {
    if (sizeRef.current) return sizeRef.current;
    const cs = getComputedStyle(t);
    const pad = parseFloat(cs.paddingLeft);
    const gap = parseFloat(cs.columnGap || cs.gap);
    const w = parseFloat(getComputedStyle(t.children[0]).width);
    if ([pad, gap, w].some(Number.isNaN)) return null;
    const ws = getComputedStyle(t.parentElement.parentElement);
    const scale = parseFloat(ws.getPropertyValue("--scale")) || 0.9;
    const anchor = parseFloat(ws.getPropertyValue("--anchor")) || -1;
    const m = { pad, gap, w, step: w + gap, port: t.clientWidth, scale, anchor };
    sizeRef.current = m;
    return m;
  };

  /** そのカード（実数でも可）を画面の中央に置くためのスクロール位置 */
  const leftFor = (i, t) => {
    const m = metrics(t);
    if (!m) {
      const el = t.children[Math.round(i)];
      return el.offsetLeft + el.offsetWidth / 2 - t.clientWidth / 2;
    }
    return m.pad + i * m.step + m.w / 2 - m.port / 2;
  };

  /** いま何枚目にいるか（実数。端数はカードとカードの途中を表す） */
  const posRaw = (t) => {
    const m = metrics(t);
    if (!m) return 0;
    return (t.scrollLeft - leftFor(0, t)) / m.step;
  };

  /**
   * カードの大きさを、スクロール位置に合わせてその場で決める。
   *
   * 「中央になったら0.45秒かけて大きくなる」という作りだと、
   * 指を払って何枚も送ったときに拡大が追いつかず、
   * 大きさが行ったり来たりしてカクカク見える。
   * 中央からの距離で大きさを決めれば、指の動きにそのままついてくる。
   *
   * 触るのは画面に出ている前後3枚だけ。外に出たものはCSSの値に戻す
   */
  const paintScale = (p) => {
    const t = trackRef.current;
    const m = metrics(t);
    if (!t || !m) return;
    const last = t.children.length - 1;
    const mid = Math.round(p);
    const next = new Set();
    for (let i = Math.max(0, mid - SCALE_WINDOW); i <= Math.min(last, mid + SCALE_WINDOW); i += 1) {
      const el = t.children[i].firstElementChild;
      if (!el) continue;
      const d = i - p;
      const near = Math.min(1, Math.abs(d));
      const sc = 1 - (1 - m.scale) * near;
      // 縮めたぶん、決めた側の辺が動かないようにずらす（CSSと同じ考え方）
      const shift = d === 0 ? 0 : -Math.sign(d) * m.anchor * (1 - sc) * 50;
      el.style.transform = `translateX(${shift}%) scale(${sc})`;
      next.add(i);
    }
    scaledRef.current.forEach((i) => {
      if (next.has(i)) return;
      const el = t.children[i] && t.children[i].firstElementChild;
      if (el) el.style.transform = "";
    });
    scaledRef.current = next;
  };

  /** いま何枚目にいるか（実数）。件数で割った余りなので 0〜件数 */
  const posNow = (t) => {
    const m = metrics(t);
    if (!m) return 0;
    const raw = posRaw(t);
    /* scrollLeft は整数に丸められるので、ぴったり止まっていても
       17.999 のような値になることがある。そのまま余りを取ると
       ツマミが反対の端へ回り込んでしまうため、ほぼ整数なら整数として扱う */
    const near = Math.round(raw);
    const fixed = Math.abs(raw - near) < 0.01 ? near : raw;
    return ((fixed % n) + n) % n;
  };

  /** 画面に主に出ているカードの枚数（CSSの区切りとそろえる） */
  const perView = () => {
    if (typeof window === "undefined") return 3;
    if (window.matchMedia("(max-width: 1024px)").matches) return 1;
    return 3;
  };

  /** 主表示のカードが占める横幅の範囲に、その x があるか */
  const inMainArea = (t, clientX) => {
    const m = metrics(t);
    if (!m) return false;
    const per = perView();
    const half = (per * m.w + (per - 1) * m.gap) / 2;
    return Math.abs(clientX - window.innerWidth / 2) <= half;
  };

  // scrollBy は Safari でスナップ位置がずれることがあるため、
  // 行き先を計算して scrollTo で指定する
  const goToIndex = useCallback((i, smooth) => {
    const t = trackRef.current;
    if (!t || !t.children[i]) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const glide = smooth && !reduce;
    // 滑らせている途中にスナップが割り込むと、
    // 中央より手前で止まってから引き戻されて「カクッ」と見える。
    // 動かしている間だけスナップを外し、止まってから戻す
    if (glide) t.setAttribute("data-gliding", "true");
    t.scrollTo({ left: leftFor(i, t), behavior: glide ? "smooth" : "auto" });
  }, []);

  /**
   * バーのツマミを、いまのスクロール位置に合わせて置き直す。
   * 毎コマ React を描き直すとカード54枚ぶん作り直すことになるので、
   * ここだけは DOM を直に書き換える
   */
  const paintThumb = useCallback(() => {
    const t = trackRef.current;
    const bar = barRef.current;
    const thumb = thumbRef.current;
    if (!t || !bar || !thumb) return;
    const barW = bar.clientWidth;
    if (!barW) return;
    const thumbW = Math.max(THUMB_MIN, barW / n);
    const p = posNow(t);
    // 幅は画面の大きさが変わらない限り同じ。毎コマ書くと無駄に作り直しが走る
    const px = `${thumbW}px`;
    if (thumb.style.width !== px) thumb.style.width = px;
    thumb.style.transform = `translateX(${(barW - thumbW) * (p / n)}px)`;
  }, [n]);

  /**
   * いま画面の中央にいちばん近いカード。
   * 全部のカードの位置を読んで比べると、54枚ぶんのレイアウト計算が
   * 毎コマ走ってスクロールが引っかかる。並びは等間隔なので割り算で出す
   */
  const nearest = useCallback(() => {
    const t = trackRef.current;
    const m = metrics(t);
    if (!m) return indexRef.current;
    const raw = (t.scrollLeft - leftFor(0, t)) / m.step;
    return Math.min(t.children.length - 1, Math.max(0, Math.round(raw)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 最初は真ん中の組の先頭を中央に置く。描画前にやるので動いて見えない
  useBeforePaint(() => {
    goToIndex(startIndex, false);
    indexRef.current = startIndex;
    setCenter(startIndex);
    paintThumb();
    if (trackRef.current) paintScale(posRaw(trackRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goToIndex, paintThumb, startIndex]);

  useEffect(() => {
    const t = trackRef.current;
    if (!t) return undefined;

    let frame = 0;
    let timer = 0;

    /* どれを中央として見せるかを、その場で書き換える。
       React の描き直しを待つと画面の更新に間に合わず、
       入れ替わった瞬間だけ小さいまま映ってしまう。

       全部を書き換えると、変わっていないカードまで大きさの変化が
       かかり直してスクロールが引っかかる。
       中央が i から j へ動いたとき、印が変わるのは i〜j のあいだだけ */
    const mark = (k, i) => {
      const el = t.children[k];
      if (!el) return;
      if (k === i) {
        el.setAttribute("data-center", "true");
        el.removeAttribute("data-side");
      } else {
        el.removeAttribute("data-center");
        el.setAttribute("data-side", k < i ? "left" : "right");
      }
    };

    const paint = (i) => {
      const was = paintedRef.current;
      const lo = Math.min(was, i);
      const hi = Math.max(was, i);
      for (let k = lo; k <= hi; k += 1) mark(k, i);
      paintedRef.current = i;
    };

    const update = () => {
      frame = 0;
      paintScale(posRaw(t));
      paintThumb();
      const i = nearest();
      if (i !== indexRef.current) {
        changedAt.current = performance.now();
        indexRef.current = i;
        paint(i);
        setCenter(i);
      }
    };

    // 指が止まったら真ん中の組へ戻す。同じ並びなので見た目は変わらない。
    // ただし中央のカードは別の要素に入れ替わるので、
    // 大きさが変わりきる前に戻すと、縮んでからまた大きくなって見える。
    // 変わりきるのを待ってから、変化を止めた状態で入れ替える
    const normalize = () => {
      if (!loop) return;
      const shift = Math.floor(indexRef.current / n) - startCopy;
      if (shift === 0) return;

      const wait = GROW_MS - (performance.now() - changedAt.current);
      // 控えを使い切りそうなときは待たずに戻す
      if (wait > 0 && Math.abs(shift) < 2) {
        clearTimeout(timer);
        timer = setTimeout(normalize, wait);
        return;
      }

      const target = indexRef.current - shift * n;
      if (!t.children[target]) return;
      // 位置を戻すのと、中央の入れ替えを、同じコマでまとめて行う
      t.setAttribute("data-jump", "true");
      // 飛ばしている間はスナップを切る（飛んだ先で引き戻されないように）
      t.style.scrollSnapType = "none";
      t.scrollLeft = leftFor(target, t);
      t.style.scrollSnapType = "";
      paint(target);
      indexRef.current = target;
      setJump(true);
      setCenter(target);
    };

    // 動きが止まったら、スナップを戻してから位置を整える
    const settled = () => {
      t.removeAttribute("data-gliding");
      normalize();
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
      // scrollend が使えない環境ぶんの保険
      clearTimeout(timer);
      timer = setTimeout(settled, 180);
    };
    // 指やホイールで触られたら、そこで滑走は終わり
    const onTouch = () => t.removeAttribute("data-gliding");
    const onResize = () => {
      sizeRef.current = null;
      // 書き込んであった大きさをいったんCSSに戻してから測り直す
      scaledRef.current.forEach((i) => {
        const el = t.children[i] && t.children[i].firstElementChild;
        if (el) el.style.transform = "";
      });
      scaledRef.current = new Set();
      goToIndex(indexRef.current, false);
      paintThumb();
      paintScale(posRaw(t));
    };

    t.addEventListener("scroll", onScroll, { passive: true });
    t.addEventListener("scrollend", settled);
    t.addEventListener("pointerdown", onTouch, { passive: true });
    t.addEventListener("wheel", onTouch, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      t.removeEventListener("scroll", onScroll);
      t.removeEventListener("scrollend", settled);
      t.removeEventListener("pointerdown", onTouch);
      t.removeEventListener("wheel", onTouch);
      window.removeEventListener("resize", onResize);
    };
  }, [goToIndex, nearest, paintThumb, loop, n, startCopy]);

  /* マウスで掴んでスライドさせる。
     指とペンは今までどおりブラウザ標準のスクロールにまかせる */
  useEffect(() => {
    const t = trackRef.current;
    if (!t || !loop) return undefined;

    let drag = null;
    // 掴んで動かしたあとの1回ぶんのクリックを止めるための印
    let moved = false;

    const onDown = (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      // 矢印やドットの上では始めない
      if (e.target.closest("button")) return;
      moved = false;
      drag = {
        x: e.clientX,
        left: t.scrollLeft,
        far: 0,
        lastX: e.clientX,
        lastT: e.timeStamp,
        v: 0,
        held: false,
      };
      t.removeAttribute("data-gliding");
    };

    const onMove = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      drag.far = Math.max(drag.far, Math.abs(dx));

      /* 掴むのは、実際に動かしはじめてから。
         押した時点で setPointerCapture すると click の宛先まで
         トラックに付け替わってしまい、カードのリンクが開かなくなる */
      if (!drag.held && drag.far > DRAG_SLOP) {
        drag.held = true;
        t.setPointerCapture(e.pointerId);
        t.setAttribute("data-dragging", "true");
      }
      if (!drag.held) return;

      const dt = e.timeStamp - drag.lastT;
      if (dt > 0) drag.v = (e.clientX - drag.lastX) / dt;
      drag.lastX = e.clientX;
      drag.lastT = e.timeStamp;
      t.scrollLeft = drag.left - dx;
    };

    const onUp = (e) => {
      if (!drag) return;
      const { held, v } = drag;
      drag = null;
      // 動かしていないなら、ただのクリック。位置も触らない
      if (!held) return;

      moved = true;
      if (t.hasPointerCapture && t.hasPointerCapture(e.pointerId)) {
        t.releasePointerCapture(e.pointerId);
      }
      // 勢いよく払ったら1枚先へ。そうでなければ最寄りへ
      const flick = Math.abs(v) > FLICK_SPEED ? (v < 0 ? 1 : -1) : 0;
      // 先に行き先を決めてから data-dragging を外す。
      // 逆にするとスナップが一瞬効いて引っかかる
      goToIndex(nearest() + flick, true);
      t.removeAttribute("data-dragging");
    };

    // 掴んで動かしただけで作品ページへ飛ばないように
    const onClick = (e) => {
      if (!moved) return;
      moved = false;
      e.preventDefault();
      e.stopPropagation();
    };

    // draggable={false} で足りない環境ぶんの保険
    const onDragStart = (e) => e.preventDefault();

    t.addEventListener("pointerdown", onDown);
    t.addEventListener("pointermove", onMove);
    t.addEventListener("pointerup", onUp);
    t.addEventListener("pointercancel", onUp);
    t.addEventListener("click", onClick, true);
    t.addEventListener("dragstart", onDragStart);
    return () => {
      t.removeEventListener("pointerdown", onDown);
      t.removeEventListener("pointermove", onMove);
      t.removeEventListener("pointerup", onUp);
      t.removeEventListener("pointercancel", onUp);
      t.removeEventListener("click", onClick, true);
      t.removeEventListener("dragstart", onDragStart);
    };
  }, [goToIndex, nearest, loop]);

  /* ホイールで送る。効くのは主表示のカードの上だけ。
     全域で効かせると、カーソルがカルーセルの上にある間ページが進まなくなる
     （ループするので「端まで行ったら解放」も使えない） */
  useEffect(() => {
    const t = trackRef.current;
    if (!t || !loop) return undefined;

    let acc = 0;
    let until = 0;

    const onWheel = (e) => {
      if (!inMainArea(t, e.clientX)) return; // ページの縦スクロールにまかせる
      e.preventDefault();

      const now = e.timeStamp;
      if (now < until) return;

      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      acc += d;
      if (Math.abs(acc) < WHEEL_STEP) return;

      const dir = acc > 0 ? 1 : -1;
      acc = 0;
      until = now + WHEEL_WAIT;
      goToIndex(indexRef.current + dir, true);
    };

    t.addEventListener("wheel", onWheel, { passive: false });
    return () => t.removeEventListener("wheel", onWheel);
  }, [goToIndex, loop]);

  /* バーを掴んで動かす。マウスも指も同じ処理 */
  useEffect(() => {
    const bar = barRef.current;
    const t = trackRef.current;
    if (!bar || !t || !loop) return undefined;

    let grab = null;

    /** バー上の x から、何枚目にいるかを出して、そこへ動かす */
    const seek = (clientX) => {
      const rect = bar.getBoundingClientRect();
      const barW = rect.width;
      const thumbW = Math.max(THUMB_MIN, barW / n);
      const travel = barW - thumbW;
      if (travel <= 0) return;
      const x = Math.min(travel, Math.max(0, clientX - rect.left - grab.offset));
      const p = (x / travel) * n;
      t.scrollLeft = leftFor(startCopy * n + p, t);
    };

    const onDown = (e) => {
      const rect = bar.getBoundingClientRect();
      const barW = rect.width;
      const thumbW = Math.max(THUMB_MIN, barW / n);
      const thumbX = (barW - thumbW) * (posNow(t) / n);
      const hit = e.clientX - rect.left;
      // ツマミの上なら掴んだ場所を保つ。外なら押したところが中心にくる
      const onThumb = hit >= thumbX && hit <= thumbX + thumbW;
      grab = { offset: onThumb ? hit - thumbX : thumbW / 2 };

      bar.setPointerCapture(e.pointerId);
      bar.setAttribute("data-dragging", "true");
      t.setAttribute("data-dragging", "true");
      t.removeAttribute("data-gliding");
      seek(e.clientX);
      e.preventDefault();
    };

    const onMove = (e) => {
      if (!grab) return;
      seek(e.clientX);
    };

    const onUp = (e) => {
      if (!grab) return;
      grab = null;
      if (bar.hasPointerCapture && bar.hasPointerCapture(e.pointerId)) {
        bar.releasePointerCapture(e.pointerId);
      }
      bar.removeAttribute("data-dragging");
      // 先に行き先を決めてから外す。逆にするとスナップが一瞬効いて引っかかる
      goToIndex(nearest(), true);
      t.removeAttribute("data-dragging");
    };

    const onKey = (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      goToIndex(indexRef.current + (e.key === "ArrowRight" ? 1 : -1), true);
    };

    bar.addEventListener("pointerdown", onDown);
    bar.addEventListener("pointermove", onMove);
    bar.addEventListener("pointerup", onUp);
    bar.addEventListener("pointercancel", onUp);
    bar.addEventListener("keydown", onKey);
    return () => {
      bar.removeEventListener("pointerdown", onDown);
      bar.removeEventListener("pointermove", onMove);
      bar.removeEventListener("pointerup", onUp);
      bar.removeEventListener("pointercancel", onUp);
      bar.removeEventListener("keydown", onKey);
    };
  }, [goToIndex, nearest, loop, n, startCopy]);

  /* マウスについてくる丸。指・ペンのときは出さない */
  useEffect(() => {
    const wrap = wrapRef.current;
    const t = trackRef.current;
    if (!wrap || !t || !loop) return undefined;

    let frame = 0;
    let pos = null;

    const draw = () => {
      frame = 0;
      const el = cursorRef.current;
      if (el && pos) el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    };

    const onMove = (e) => {
      if (e.pointerType !== "mouse") return;
      // 矢印・ドット・トラックの外では標準のカーソルに戻す
      const inside = t.contains(e.target) && !e.target.closest("button");
      if (!inside) {
        if (t.hasAttribute("data-cursor")) {
          t.removeAttribute("data-cursor");
          setCursorLabel(null);
        }
        return;
      }
      pos = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(draw);
      t.setAttribute("data-cursor", "on");

      /* 中央のカードは「開く」対象なので View。
         それ以外は動かす場所なので Drag。
         ホイールが効くのは主表示のカードの上だけなので、
         そこだけ「or scroll」を添える（効かない場所で書くと嘘になる） */
      const slide = e.target.closest("li");
      const onCenter = slide && slide.dataset.center === "true";
      if (!t.hasAttribute("data-dragging") && onCenter) {
        setCursorLabel(["View"]);
      } else if (inMainArea(t, e.clientX)) {
        setCursorLabel(["Drag", "or scroll"]);
      } else {
        setCursorLabel(["Drag"]);
      }
    };

    const onLeave = () => {
      t.removeAttribute("data-cursor");
      setCursorLabel(null);
    };

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [loop]);

  // 入れ替えたつぎのコマで、大きさの変化を戻す
  useEffect(() => {
    if (!jump) return undefined;
    const id = requestAnimationFrame(() => setJump(false));
    return () => cancelAnimationFrame(id);
  }, [jump]);

  const move = (dir) => goToIndex(indexRef.current + dir, true);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      {/* 本文の幅を測るための箱。カードの幅をここから出す（.module.css の 100cqw） */}
      <div className={styles.stage}>
      <ul
        className={styles.track}
        ref={trackRef}
        data-jump={jump ? "true" : undefined}
        tabIndex={loop ? 0 : undefined}
        role={loop ? "region" : undefined}
        aria-label={loop ? "制作実績（横にスクロールできます）" : undefined}
      >
        {slideNodes}
      </ul>

      {loop && (
        <div className={styles.rail}>
          <button
            type="button"
            className={`${styles.arrow} ${styles.prev}`}
            onClick={() => move(-1)}
            aria-label="前の実績を見る"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M10 2 4 8l6 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.next}`}
            onClick={() => move(1)}
            aria-label="次の実績を見る"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M6 2l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      )}
      </div>

      {/* マウスについてくる丸。標準のカーソルはこれが出ている間だけ隠す */}
      {loop && (
        <div
          className={styles.cursor}
          ref={cursorRef}
          data-on={cursorLabel ? "true" : undefined}
          aria-hidden="true"
        >
          <span className="en">
            {(cursorLabel || []).map((line, i) => (
              <em key={i}>{line}</em>
            ))}
          </span>
        </div>
      )}

      {/* いまの位置を示すバー。掴んで動かせる。
          点々と違い、件数が増えてもツマミが細くなるだけで折り返さない */}
      {loop && (
        <div
          className={styles.bar}
          ref={barRef}
          role="slider"
          tabIndex={0}
          aria-label="制作実績の位置"
          aria-valuemin={1}
          aria-valuemax={n}
          aria-valuenow={(center % n) + 1}
          aria-valuetext={works[center % n].title}
        >
          <span className={styles.barTrack} aria-hidden="true" />
          <span className={styles.barThumb} ref={thumbRef} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
