"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import site from "@/data/site.json";
import { asset } from "@/lib/asset";
import styles from "./Loader.module.css";

const KEY = "kazuma-portfolio-2026-loaded";

/** 初回訪問時だけ出るオープニング（設計図の「ローディング画面」） */
export default function Loader() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem(KEY);
    if (seen || reduce) return;

    setShow(true);
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem(KEY, "1");
      document.body.style.overflow = "";
    }, 1500);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={styles.overlay}
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* 背景はTOPと同じ空のループ画像。横に流して動かす */}
          <div
            className={styles.sky}
            aria-hidden="true"
            style={{
              backgroundImage: `url(${asset(site.hero.sky)})`,
              aspectRatio: site.hero.skyRatio,
            }}
          />
          <div className={styles.veil} aria-hidden="true" />

          <motion.div
            className={styles.rings}
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <span className={styles.ring} />
            <span className={`${styles.ring} ${styles.inner}`} />
          </motion.div>

          <motion.p
            className={`${styles.logo} en`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {site.logo}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
