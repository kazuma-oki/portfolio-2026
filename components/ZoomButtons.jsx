"use client";

import styles from "./ZoomButtons.module.css";

/**
 * 大きさを変える ＋ と −。
 * 段階は steps（小さい順）で渡し、いまの値が端に来たら押せなくする。
 * 明るいところに置くときは solid、暗いところに置くときは outline。
 */
export default function ZoomButtons({ value, steps, onChange, variant = "solid", label = "" }) {
  const i = steps.indexOf(value);
  const name = label ? label + "を" : "";

  return (
    <div className={styles.zoom} data-variant={variant}>
      <button
        type="button"
        onClick={() => onChange(steps[i - 1])}
        disabled={i <= 0}
        aria-label={`${name}小さくする`}
      >
        <span className={styles.minus} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onChange(steps[i + 1])}
        disabled={i < 0 || i >= steps.length - 1}
        aria-label={`${name}大きくする`}
      >
        <span className={styles.plus} aria-hidden="true" />
      </button>
    </div>
  );
}
