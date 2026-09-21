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
    }, 3400);

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
          /* 上へ持ち上げず、間をためてゆっくり消す。
             はじめのうちはほとんど変わらず、後半で静かに抜けていく */
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.55, 0, 0.3, 1] }}
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

          {/* Loading を一文字ずつ打ち、打ち終わったら「...」だけが繰り返し点く */}
          <p className={`${styles.text} en`} aria-label="Loading">
            <span aria-hidden="true">
              {"Loading".split("").map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.18 + i * 0.085, duration: 0.12 }}
                >
                  {ch}
                </motion.span>
              ))}
              <span className={styles.dots}>
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
