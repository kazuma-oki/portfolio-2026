"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import site from "@/data/site.json";
import { asset } from "@/lib/asset";
import Button from "./Button";
import styles from "./Hero.module.css";

const rise = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.1 + i * 0.09, ease: [0.22, 0.61, 0.36, 1] },
  }),
};

export default function Hero() {
  const { hero } = site;
  const wrapRef = useRef(null);
  const lines = hero.lead.split("\n");

  // スマホ・タブレットの演出。
  // この箱を通り抜けるあいだの進み具合から、何行目まで出すかを決める。
  // 白い面が写真を覆いきるのが 0.38 あたりなので、そのあとから1行ずつ。
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / total));
      setShown(lines.filter((_, i) => p >= 0.46 + i * 0.12).length);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [lines.length]);

  return (
    <div className={styles.stickyWrap} ref={wrapRef}>
      {/* スクロールの案内。写真の上にも紹介文の上にも出し続ける（スマホ・タブレット） */}
      <div className={styles.scrollLayer} aria-hidden="true">
        <div className={`${styles.scroll} ${styles.scrollFloat} caption en`}>
          <span>Scroll</span>
          <span className={styles.scrollLine} />
        </div>
      </div>

      <section className={styles.hero}>
        <div className={`${styles.inner} container`}>
          {/* 左5カラム：テキスト */}
          <div className={styles.text}>
            <motion.p
              className={`${styles.eyebrow} caption en`}
              variants={rise}
              initial="hidden"
              animate="show"
              custom={0}
            >
              {hero.eyebrow}
            </motion.p>

            <h1 className={`${styles.title} h1`}>
              {hero.title.map((line, i) => (
                <motion.span
                  key={line}
                  className={styles.line}
                  variants={rise}
                  initial="hidden"
                  animate="show"
                  custom={i + 1}
                >
                  {line}
                </motion.span>
              ))}
            </h1>

            <motion.p
              className={`${styles.name} en`}
              variants={rise}
              initial="hidden"
              animate="show"
              custom={3}
            >
              {hero.titleEn}
              <span className={styles.role}>{hero.role}</span>
            </motion.p>

            <motion.p
              className={`${styles.lead} body-s subtext`}
              variants={rise}
              initial="hidden"
              animate="show"
              custom={4}
            >
              {hero.lead}
            </motion.p>

            <motion.div
              className={styles.actions}
              variants={rise}
              initial="hidden"
              animate="show"
              custom={5}
            >
              <Button href="/works" variant="secondary">
                View Works
              </Button>
              <Button href="/about" variant="ghost">
                About me
              </Button>
            </motion.div>
          </div>

          {/* 空が流れ、人物は止まっているビジュアル。
              スマホ・タブレットではCSSで画面の横幅いっぱいに広げる */}
          <motion.div
            className={styles.visual}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div
              className={styles.sky}
              aria-hidden="true"
              style={{
                backgroundImage: `url(${asset(hero.sky)})`,
                aspectRatio: hero.skyRatio,
              }}
            />

            <Image
              className={styles.person}
              src={asset(hero.person)}
              alt={hero.imageAlt}
              width={1199}
              height={1799}
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
          </motion.div>

          {/* グリッドの左カラム下段に置く。絶対配置をやめたことで
              本文と同じ左端に揃い、ボタンとも重ならない */}
          <div className={`${styles.scroll} ${styles.scrollGrid} caption en`} aria-hidden="true">
            <span>Scroll</span>
            <span className={styles.scrollLine} />
          </div>
        </div>
      </section>

      {/* スマホ・タブレット用。スクロールすると写真が固定されたまま、
          この面が下から重なって上がってきて、そのあと1行ずつ文章が出る */}
      <section className={styles.reveal}>
        <div className={styles.revealInner}>
          <div className="container">
            <p className={styles.revealLead}>
              {lines.map((line, i) => (
                <span
                  key={i}
                  className={styles.revealLine}
                  data-shown={i < shown ? "true" : undefined}
                >
                  {line}
                </span>
              ))}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
