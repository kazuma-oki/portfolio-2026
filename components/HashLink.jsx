"use client";

/**
 * 同じページの中を移動するリンク（TOPの「Works」→ 実績セクション）。
 *
 * CSS の html { scroll-behavior: smooth } は使わない。あれを置くと、
 * ページ遷移やブラウザの戻るボタンでの位置の復元まで巻き込んで
 * 画面が流れてしまうため。なめらかに動かしたいのはここだけなので、
 * ここだけ behavior: "smooth" を指定する。
 */
export default function HashLink({ hash, className, tabIndex, onClick, children }) {
  const go = (e) => {
    const el = document.getElementById(hash);
    if (el) {
      e.preventDefault();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
      // 素のアンカーと同じように、URL にも印を残す
      history.pushState(null, "", `#${hash}`);
    }
    if (onClick) onClick();
  };

  return (
    <a href={`#${hash}`} className={className} tabIndex={tabIndex} onClick={go}>
      {children}
    </a>
  );
}
