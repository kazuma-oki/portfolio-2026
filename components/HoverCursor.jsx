"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HoverCursor.module.css";

/**
 * ある範囲の上で、マウスについてくる丸。
 * 出す文字は labelFor が決める（文字の配列を返すと縦に並び、null なら出さない）。
 * 指やペンでは出さない。
 *
 * TOPのカルーセルにある同じ見た目の丸をそろえたもので、
 * バナーの面と、その拡大表示の両方から使っている。
 */
export default function HoverCursor({ areaRef, labelFor, pressed = false, hidden = false }) {
  const ref = useRef(null);
  const [label, setLabel] = useState(null);
  // 毎回新しい関数が来ても購読をやり直さずに済むよう、ref 越しに見る
  const labelForRef = useRef(labelFor);
  labelForRef.current = labelFor;

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;

    let frame = 0;
    let pos = null;

    const draw = () => {
      frame = 0;
      if (ref.current && pos) {
        ref.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      }
    };

    const onMove = (e) => {
      if (e.pointerType !== "mouse") return;
      pos = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(draw);
      setLabel(labelForRef.current(e));
    };

    const onLeave = () => setLabel(null);

    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerleave", onLeave);
    };
  }, [areaRef]);

  const on = !hidden && label && label.length > 0;

  return (
    <div
      className={styles.cursor}
      ref={ref}
      data-on={on ? "true" : undefined}
      data-pressed={pressed ? "true" : undefined}
      aria-hidden="true"
    >
      <span className="en">
        {(label || []).map((line, i) => (
          <em key={i}>{line}</em>
        ))}
      </span>
    </div>
  );
}
