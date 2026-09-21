"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { asset } from "@/lib/asset";
import HoverCursor from "./HoverCursor";
import styles from "./BannerLightbox.module.css";

// 指で払って送るときの、これだけ横に動いたら送るという目安
const SWIPE = 50;

/**
 * バナーの拡大表示。
 * 背景をグレーで伏せ、その上に1枚だけ大きく出す。
 *
 * 送るのは画像の左半分・右半分を押す（マウスのときは丸が前後どちらかを示す）。
 * 指では横に払っても送れる。閉じるのは ×・画像の外・Esc。
 */
export default function BannerLightbox({ banners, index, onClose, onChange }) {
  const open = index != null;
  const item = open ? banners[index] : null;
  const panelRef = useRef(null);
  const frameRef = useRef(null);
  const closeRef = useRef(null);
  const swipeRef = useRef(null);
  const reduce = useReducedMotion();
  // 丸を「押した」状態にするため
  const [pressed, setPressed] = useState(false);

  const step = useCallback(
    (d) => onChange((index + d + banners.length) % banners.length),
    [index, banners.length, onChange]
  );

  /* 前後の1枚を先に読んでおく。送った瞬間に読みに行くと引っかかって見える */
  useEffect(() => {
    if (!open) return;
    for (const d of [1, -1]) {
      const next = banners[(index + d + banners.length) % banners.length];
      if (next) new window.Image().src = asset(next.large);
    }
  }, [open, index, banners]);

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
        const items = panelRef.current?.querySelectorAll('button:not([tabindex="-1"])');
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

  /* 指で横に払って送る（縦はそのまま。閉じる操作と取り違えないように） */
  const onPointerDown = (e) => {
    setPressed(true);
    if (e.pointerType !== "touch") return;
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
          onClick={onBackdrop}
        >
          <div
            className={styles.panel}
            ref={panelRef}
            onClick={onBackdrop}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => { setPressed(false); swipeRef.current = null; }}
          >
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

            <motion.figure
              className={styles.figure}
              layout={!reduce}
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
                      alt={`タイムズカー公式Xのバナー：${item.title}`}
                      width={item.w * 2.25}
                      height={item.h * 2.25}
                      sizes="(max-width: 1024px) 92vw, 1100px"
                      priority
                    />
                  </motion.span>
                </AnimatePresence>

                {/* 画像の左半分・右半分。読み上げとタブ移動からは外し、
                    そちらは上下の矢印ボタンと矢印キーにまかせる */}
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

              <figcaption className={`${styles.caption} caption`}>
                {index + 1} / {banners.length}
              </figcaption>
            </motion.figure>

            <button
              type="button"
              className={`${styles.arrow} ${styles.next}`}
              onClick={() => step(1)}
              aria-label="次のバナー"
            >
              <span aria-hidden="true">→</span>
            </button>

            <HoverCursor areaRef={frameRef} labelFor={labelFor} pressed={pressed} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
