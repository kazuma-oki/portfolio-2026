"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { asset } from "@/lib/asset";
import HoverCursor from "./HoverCursor";
import ZoomButtons from "./ZoomButtons";
import styles from "./BannerLightbox.module.css";

// 指で払って送るときの、これだけ横に動いたら送るという目安
const SWIPE = 50;
// 大きさの段階の数。1（画面に収まる大きさ）から、元の解像度までを等比で刻む
const STEPS = 4;

/**
 * バナーやワイヤーフレームの拡大表示。
 * 背景をグレーで伏せ、その上に1枚だけ大きく出す。
 *
 * 開いたときは画像の全体が画面に収まる。読みたいときは右下の＋で大きくし、
 * そのぶん上下左右に動かして見る。
 * 送るのは画像の左半分・右半分を押す（マウスのときは丸が前後どちらかを示す）。
 * 指では横に払っても送れる。閉じるのは ×・画像の外・Esc。
 */
export default function BannerLightbox({ banners, index, onClose, onChange }) {
  const open = index != null;
  const item = open ? banners[index] : null;
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const frameRef = useRef(null);
  const closeRef = useRef(null);
  const swipeRef = useRef(null);
  const reduce = useReducedMotion();
  // 丸を「押した」状態にするため
  const [pressed, setPressed] = useState(false);
  const [scale, setScale] = useState(1);
  const [vp, setVp] = useState({ w: 0, h: 0 });

  const step = useCallback(
    (d) => onChange((index + d + banners.length) % banners.length),
    [index, banners.length, onChange]
  );

  /* 画面の大きさ。ここから「ちょうど収まる大きさ」を出す */
  useEffect(() => {
    const measure = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /* 画面に収まる大きさ。丈の長いものは高さで決まる */
  const fit = useMemo(() => {
    if (!item || !vp.w) return null;
    const maxW = Math.min(vp.w * 0.92, 1100);
    const maxH = vp.h * 0.86;
    const ratio = item.w / item.h;
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    return { w: Math.round(w), h: Math.round(h) };
  }, [item, vp]);

  /* 大きさの段階。押しきると元の画像の細かさで見られるところまで。
     丈の長いものは収めると小さくなるぶん、段階が大きく取られる */
  const scales = useMemo(() => {
    if (!fit || !item) return [1];
    const max = Math.max(1.2, Math.min(8, (item.w * 2.25) / fit.w));
    return Array.from(
      { length: STEPS + 1 },
      (_, i) => Math.round(Math.pow(max, i / STEPS) * 100) / 100
    );
  }, [fit, item]);

  /* 前後の1枚を先に読んでおく。送った瞬間に読みに行くと引っかかって見える */
  useEffect(() => {
    if (!open) return;
    for (const d of [1, -1]) {
      const next = banners[(index + d + banners.length) % banners.length];
      if (next) new window.Image().src = asset(next.large);
    }
  }, [open, index, banners]);

  // 送ったら、次の1枚はまた全体が見える大きさで頭から
  useEffect(() => {
    setScale(1);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      scrollRef.current.scrollLeft = 0;
    }
  }, [index]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Tab") {
        // 行き先を中だけに閉じこめる（画像に重ねた送りの領域は数に入れない）
        const items = rootRef.current?.querySelectorAll('button:not([tabindex="-1"])');
        if (!items || !items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, step]);

  /* 画像の外を押したら閉じる。ボタンはそれぞれの役目があるので通す */
  const onBackdrop = (e) => {
    if (e.target.closest("button")) return;
    if (!e.target.closest(`.${styles.figure}`)) onClose();
  };

  /* 指で横に払って送る（大きくしている間は、動かして見るほうを優先する） */
  const onPointerDown = (e) => {
    setPressed(true);
    if (e.pointerType !== "touch" || scale > 1) return;
    swipeRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e) => {
    setPressed(false);
    const s = swipeRef.current;
    swipeRef.current = null;
    if (!s || e.pointerType !== "touch") return;

    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) {
      step(dx < 0 ? 1 : -1);
      return;
    }

    /* ほとんど動いていなければ「押した」とみなす。
       指のときは払ったあとのタップで click が来ないことがあるので、
       画像に重ねたボタンには頼らず、ここで左右を見て自分で送る */
    if (Math.hypot(dx, dy) > 10) return;
    const frame = frameRef.current;
    if (!frame) return;
    const r = frame.getBoundingClientRect();
    const inside =
      e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (inside) step(e.clientX < r.left + r.width / 2 ? -1 : 1);
  };

  const labelFor = useCallback((e) => {
    const frame = frameRef.current;
    if (!frame || !frame.contains(e.target)) return null;
    const r = frame.getBoundingClientRect();
    return e.clientX < r.left + r.width / 2 ? ["←", "PREV"] : ["NEXT", "→"];
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label={`${item.title} の拡大表示`}
          data-zoomed={scale > 1 ? "true" : undefined}
          ref={rootRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
        >
          {/* ここから下は、動かしても同じところに出ている */}
          <p className={`${styles.count} caption`}>
            {index + 1} / {banners.length}
          </p>

          <button
            type="button"
            className={styles.close}
            ref={closeRef}
            onClick={onClose}
            aria-label="閉じる"
          >
            <span aria-hidden="true" />
          </button>

          {/* 指のときの送りボタン。マウスのときは隠してあるが、
              キーボードで進んだときだけ現れる */}
          <button
            type="button"
            className={`${styles.arrow} ${styles.prev}`}
            onClick={() => step(-1)}
            aria-label="前のバナー"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.next}`}
            onClick={() => step(1)}
            aria-label="次のバナー"
          >
            <span aria-hidden="true">→</span>
          </button>

          <div className={styles.zoom}>
            <ZoomButtons value={scale} steps={scales} onChange={setScale} variant="outline" />
          </div>

          {/* ここが動かせる層。大きくしたぶんだけ上下左右に動く */}
          <div
            className={styles.scroller}
            ref={scrollRef}
            onClick={onBackdrop}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              setPressed(false);
              swipeRef.current = null;
            }}
          >
            <motion.figure
              className={styles.figure}
              /* 大きさを変えている間は、枠の動きを重ねない */
              layout={!reduce && scale === 1}
              transition={{ layout: { duration: 0.3, ease: [0.22, 0.61, 0.36, 1] } }}
            >
              <div className={styles.frame} ref={frameRef}>
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={item.id}
                    className={styles.slide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.22 }}
                  >
                    <Image
                      src={asset(item.large)}
                      alt={`${item.title} の拡大`}
                      width={item.w * 2.25}
                      height={item.h * 2.25}
                      sizes="(max-width: 1024px) 92vw, 1100px"
                      style={fit ? { width: fit.w * scale, height: fit.h * scale } : undefined}
                      priority
                    />
                  </motion.span>
                </AnimatePresence>

                {/* 画像の左半分・右半分。読み上げとタブ移動からは外し、
                    そちらは送りボタンと矢印キーにまかせる */}
                <button
                  type="button"
                  className={`${styles.half} ${styles.halfPrev}`}
                  onClick={() => step(-1)}
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  className={`${styles.half} ${styles.halfNext}`}
                  onClick={() => step(1)}
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>
            </motion.figure>
          </div>

          <HoverCursor areaRef={frameRef} labelFor={labelFor} pressed={pressed} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
