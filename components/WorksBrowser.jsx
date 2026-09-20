"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import WorkGrid from "./WorkGrid";
import { readList, writeList } from "@/lib/listReturn";
import styles from "./WorksBrowser.module.css";

// 静的書き出しのため、サーバー側では useLayoutEffect を呼ばない
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function WorksBrowser({ works, categories, storageKey, basePath = "/works" }) {
  // 初期表示は必ず "All"。復元はマウント後に行う（サーバーの出力とずらさないため）
  const [active, setActive] = useState("All");
  const [focus, setFocus] = useState(null);
  const gridRef = useRef(null);
  const doneRef = useRef(false);
  const rafRef = useRef(0);

  const filtered = active === "All" ? works : works.filter((w) => w.category === active);

  // ① 個別ページから「←Works」で戻ってきたときだけ、絞り込みを元に戻す。
  //    ヘッダーから開き直したときは、いつもどおり先頭・全件から始める
  useBeforePaint(() => {
    if (doneRef.current) return;
    doneRef.current = true;

    const { filter, focus: saved } = readList(storageKey);
    writeList(storageKey, { focus: null }); // 一度使ったら消す
    if (!saved) return;

    const item = works.find((w) => w.id === saved);
    if (!item) return;

    // 覚えていた絞り込みにその実績が入っていないときは全件に落とす（必ず表示できるように）
    const keep =
      filter && filter !== "All" && categories.includes(filter) && item.category === filter;
    setActive(keep ? filter : "All");
    setFocus(saved);
  }, [storageKey, works, categories]);

  // ② 絞り込みが反映されたあと、その実績を画面中央へ送る（behavior を指定しない＝一瞬で移動）
  useBeforePaint(() => {
    if (!focus) return;
    const put = () => {
      const grid = gridRef.current;
      const el = grid && grid.querySelector(`[data-work-id="${focus}"]`);
      if (el) el.scrollIntoView({ block: "center" });
      else window.scrollTo(0, 0);
    };
    put();
    // フォントの差し替えなどで高さが動いた場合に備え、次のフレームで一度だけ入れ直す
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      put();
    });
    setFocus(null);
  }, [focus, active]);

  useEffect(() => () => rafRef.current && cancelAnimationFrame(rafRef.current), []);

  // 選んでいる絞り込みを控えておく（マウント直後の既定値は書き込まない）
  const wroteRef = useRef(false);
  useEffect(() => {
    if (!wroteRef.current) {
      wroteRef.current = true;
      return;
    }
    writeList(storageKey, { filter: active });
  }, [active, storageKey]);

  return (
    <>
      {categories.length > 2 && (
        <ul className={styles.filters}>
          {categories.map((c) => (
            <li key={c}>
              <button
                type="button"
                className={`${styles.chip} en`}
                data-active={active === c}
                onClick={() => setActive(c)}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        className={styles.grid}
        ref={gridRef}
        data-nofilter={categories.length <= 2 ? "true" : undefined}
      >
        <WorkGrid works={filtered} columns={3} basePath={basePath} />
      </div>
    </>
  );
}
