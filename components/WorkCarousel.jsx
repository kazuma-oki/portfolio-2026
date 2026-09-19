"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import WorkCard from "./WorkCard";
import styles from "./WorkCarousel.module.css";

const THUMB_RATIO = "4 / 3";
// 大きさが変わりきるまでの時間（CSS の transition とそろえる）
const GROW_MS = 500;

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

  const trackRef = useRef(null);
  const indexRef = useRef(startIndex);
  const changedAt = useRef(0);
  const [center, setCenter] = useState(startIndex);
  // 位置を戻している最中。この1コマだけ大きさの変化を止める
  const [jump, setJump] = useState(false);

  const slides = Array.from({ length: n * copies }, (_, i) => works[i % n]);

  /** そのカードを画面の中央に置くためのスクロール位置 */
  const leftFor = (el, t) => el.offsetLeft + el.offsetWidth / 2 - t.clientWidth / 2;

  // scrollBy は Safari でスナップ位置がずれることがあるため、
  // 行き先を計算して scrollTo で指定する
  const goToIndex = useCallback((i, smooth) => {
    const t = trackRef.current;
    const el = t && t.children[i];
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollTo({ left: leftFor(el, t), behavior: smooth && !reduce ? "smooth" : "auto" });
  }, []);

  /** いま画面の中央にいちばん近いカード */
  const nearest = useCallback(() => {
    const t = trackRef.current;
    const port = t.scrollLeft + t.clientWidth / 2;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < t.children.length; i += 1) {
      const el = t.children[i];
      const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - port);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }, []);

  // 最初は真ん中の組の先頭を中央に置く。描画前にやるので動いて見えない
  useBeforePaint(() => {
    goToIndex(startIndex, false);
    indexRef.current = startIndex;
    setCenter(startIndex);
  }, [goToIndex, startIndex]);

  useEffect(() => {
    const t = trackRef.current;
    if (!t) return undefined;

    let frame = 0;
    let timer = 0;

    /* どれを中央として見せるかを、その場で書き換える。
       React の描き直しを待つと画面の更新に間に合わず、
       入れ替わった瞬間だけ小さいまま映ってしまう */
    const paint = (i) => {
      for (let k = 0; k < t.children.length; k += 1) {
        const el = t.children[k];
        if (k === i) {
          el.setAttribute("data-center", "true");
          el.removeAttribute("data-side");
        } else {
          el.removeAttribute("data-center");
          el.setAttribute("data-side", k < i ? "left" : "right");
        }
      }
    };

    const update = () => {
      frame = 0;
      const i = nearest();
      if (i !== indexRef.current) changedAt.current = performance.now();
      indexRef.current = i;
      setCenter(i);
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
      const el = t.children[target];
      if (!el) return;
      // 位置を戻すのと、中央の入れ替えを、同じコマでまとめて行う
      t.setAttribute("data-jump", "true");
      // 飛ばしている間はスナップを切る（飛んだ先で引き戻されないように）
      t.style.scrollSnapType = "none";
      t.scrollLeft = leftFor(el, t);
      t.style.scrollSnapType = "";
      paint(target);
      indexRef.current = target;
      setJump(true);
      setCenter(target);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
      // scrollend が使えない環境ぶんの保険
      clearTimeout(timer);
      timer = setTimeout(normalize, 180);
    };
    const onResize = () => goToIndex(indexRef.current, false);

    t.addEventListener("scroll", onScroll, { passive: true });
    t.addEventListener("scrollend", normalize);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      t.removeEventListener("scroll", onScroll);
      t.removeEventListener("scrollend", normalize);
      window.removeEventListener("resize", onResize);
    };
  }, [goToIndex, nearest, loop, n, startCopy]);

  // 入れ替えたつぎのコマで、大きさの変化を戻す
  useEffect(() => {
    if (!jump) return undefined;
    const id = requestAnimationFrame(() => setJump(false));
    return () => cancelAnimationFrame(id);
  }, [jump]);

  const move = (dir) => goToIndex(indexRef.current + dir, true);

  /** ドット：同じ作品のうち、いまの位置からいちばん近いものへ */
  const goToDot = (k) => {
    const cur = indexRef.current;
    const base = Math.floor(cur / n) * n + k;
    const target = [base - n, base, base + n]
      .filter((x) => x >= 0 && x < n * copies)
      .reduce((a, b) => (Math.abs(b - cur) < Math.abs(a - cur) ? b : a));
    goToIndex(target, true);
  };

  return (
    <div className={styles.wrap}>
      <ul
        className={styles.track}
        ref={trackRef}
        data-jump={jump ? "true" : undefined}
        tabIndex={loop ? 0 : undefined}
        role={loop ? "region" : undefined}
        aria-label={loop ? "制作実績（横にスクロールできます）" : undefined}
      >
        {slides.map((work, i) => {
          // 前後に置いた控え。読み上げとタブ移動からは外す
          const spare = loop && Math.floor(i / n) !== startCopy;
          return (
            <li
              key={i}
              className={styles.slide}
              data-center={i === center ? "true" : undefined}
              data-side={i === center ? undefined : i < center ? "left" : "right"}
              aria-hidden={spare ? "true" : undefined}
            >
              <WorkCard
                work={work}
                priority={i === startIndex}
                ratio={THUMB_RATIO}
                tabIndex={spare ? -1 : undefined}
              />
            </li>
          );
        })}
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

      {loop && (
        <ul className={styles.dots}>
          {works.map((work, k) => (
            <li key={work.id}>
              <button
                type="button"
                className={styles.dot}
                data-active={k === center % n ? "true" : undefined}
                aria-label={`${work.title}を中央に表示`}
                aria-current={k === center % n ? "true" : undefined}
                onClick={() => goToDot(k)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
