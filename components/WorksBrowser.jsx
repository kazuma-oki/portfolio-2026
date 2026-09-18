"use client";

import { useState } from "react";
import WorkGrid from "./WorkGrid";
import styles from "./WorksBrowser.module.css";

export default function WorksBrowser({ works, categories }) {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? works : works.filter((w) => w.category === active);

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

      <div className={styles.grid} data-nofilter={categories.length <= 2 ? "true" : undefined}>
        <WorkGrid works={filtered} columns={3} />
      </div>
    </>
  );
}
