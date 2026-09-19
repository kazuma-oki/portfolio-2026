"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import WorkCard from "./WorkCard";
import styles from "./WorkCarousel.module.css";

const THUMB_RATIO = "4 / 3";

/**
 * TOPの制作実績。横に並べて、隣のカードを少し覗かせることで
 * 「まだ続きがある」と分かるようにする。
 * スワイプはブラウザ標準のスクロール＋スナップにまかせ、
 * 矢印とドットはその補助として置く。
 *
 * 表示枚数：PC 3 / タブレット 2 / スマホ 1
 */
export default function WorkCarousel({ works }) {
  const trackRef = useRef(null);
  const [perView, setPerView] = useState(3);
  const [page, setPage] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const pages = Math.max(1, Math.ceil(works.length / perView));
  // 1画面に収まってしまうなら、矢印もドットも出す意味がない
  const scrollable = works.length > perView;

  // 表示枚数はCSSと同じ区切りで切り替える
  useEffect(() => {
    const phone = window.matchMedia("(max-width: 540px)");
    const tablet = window.matchMedia("(max-width: 1024px)");
    const update = () => setPerView(phone.matches ? 1 : tablet.matches ? 2 : 3);
    update();
    phone.addEventListener("change", update);
    tablet.addEventListener("change", update);
    return () => {
      phone.removeEventListener("change", update);
      tablet.removeEventListener("change", update);
    };
  }, []);

  // 今どこを見ているかを、スクロール位置から割り出す
  const sync = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    const max = t.scrollWidth - t.clientWidth;
    setAtStart(t.scrollLeft <= 1);
    setAtEnd(t.scrollLeft >= max - 1);
    setPage(max <= 1 ? 0 : Math.round((t.scrollLeft / max) * (pages - 1)));
  }, [pages]);

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [sync, perView]);

  /** カード1枚ぶんの移動量（カード幅＋すき間） */
  const step = () => {
    const t = trackRef.current;
    if (!t || t.children.length < 2) return t ? t.clientWidth : 0;
    return t.children[1].offsetLeft - t.children[0].offsetLeft;
  };

  const behavior = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

  /** 矢印：表示している枚数ぶんまとめて動かす */
  const move = (dir) => {
    const t = trackRef.current;
    if (!t) return;
    t.scrollBy({ left: dir * step() * perView, behavior: behavior() });
  };

  /** ドット：そのページの先頭カードまで動かす */
  const goTo = (p) => {
    const t = trackRef.current;
    if (!t) return;
    const first = t.children[0];
    const target = t.children[Math.min(p * perView, t.children.length - 1)];
    if (!first || !target) return;
    t.scrollTo({ left: target.offsetLeft - first.offsetLeft, behavior: behavior() });
  };

  return (
    <div className={styles.wrap} data-per={perView}>
      <ul
        className={styles.track}
        ref={trackRef}
        onScroll={sync}
        tabIndex={scrollable ? 0 : undefined}
        role={scrollable ? "region" : undefined}
        aria-label={scrollable ? "制作実績（横にスクロールできます）" : undefined}
      >
        {works.map((work, i) => (
          <li key={work.id} className={styles.slide}>
            <WorkCard work={work} priority={i === 0} ratio={THUMB_RATIO} />
          </li>
        ))}
      </ul>

      {scrollable && (
        <div className={styles.rail} aria-hidden={false}>
          <button
            type="button"
            className={`${styles.arrow} ${styles.prev}`}
            onClick={() => move(-1)}
            disabled={atStart}
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
            disabled={atEnd}
            aria-label="次の実績を見る"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M6 2l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      )}

      {scrollable && pages > 1 && (
        <ul className={styles.dots}>
          {Array.from({ length: pages }, (_, i) => (
            <li key={i}>
              <button
                type="button"
                className={styles.dot}
                data-active={i === page ? "true" : undefined}
                aria-label={`${i + 1}ページ目を見る`}
                aria-current={i === page ? "true" : undefined}
                onClick={() => goTo(i)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
