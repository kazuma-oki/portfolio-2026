"use client";

import { useState } from "react";
import WorkCard from "./WorkCard";
import styles from "./WorkGrid.module.css";

/**
 * ホバー中のカード以外を薄くする（CYAN の実装から学んだ演出）。
 * columns で列数、ratio でサムネイルの比率を切り替える。
 */
export default function WorkGrid({ works, columns = 3, ratio = "4 / 3" }) {
  const [hovered, setHovered] = useState(null);

  return (
    <ul
      className={styles.grid}
      data-columns={columns}
      onMouseLeave={() => setHovered(null)}
    >
      {works.map((work, i) => (
        <li
          key={work.id}
          className={styles.item}
          data-dim={hovered !== null && hovered !== work.id ? "true" : undefined}
          onMouseEnter={() => setHovered(work.id)}
        >
          <WorkCard work={work} priority={i === 0} ratio={ratio} />
        </li>
      ))}
    </ul>
  );
}
