"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { asset } from "@/lib/asset";
import styles from "./BannerLightbox.module.css";

/**
 * バナーの拡大表示。
 * 背景をグレーで伏せ、その上に1枚だけ大きく出す。
 * 閉じるのは ×・背景・Esc、送るのは左右のボタンと矢印キー。
 */
export default function BannerLightbox({ banners, index, onClose, onChange }) {
  const open = index != null;
  const item = open ? banners[index] : null;
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  const step = useCallback(
    (d) => onChange((index + d + banners.length) % banners.length),
    [index, banners.length, onChange]
  );

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
        // 行き先を中だけに閉じこめる
        const items = panelRef.current?.querySelectorAll("button");
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
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div className={styles.panel} ref={panelRef}>
            <button
              type="button"
              className={styles.close}
              ref={closeRef}
              onClick={onClose}
              aria-label="閉じる"
            >
              <span aria-hidden="true" />
            </button>

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
              key={item.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={asset(item.large)}
                alt={`タイムズカー公式Xのバナー：${item.title}`}
                width={item.w * 2.25}
                height={item.h * 2.25}
                sizes="(max-width: 1024px) 92vw, 1100px"
                priority
              />
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
