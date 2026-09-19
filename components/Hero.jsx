"use client";

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

  return (
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

        {/* 右7カラム：空が流れ、人物は止まっているビジュアル */}
        <motion.div
          className={styles.visual}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 0.61, 0.36, 1] }}
        >
          {/* 空は2枚ぶんが1枚の画像になっている。要素はひとつだけにして、
              半分（＝1枚ぶん）動かす。要素を並べないので境界に線が出ない */}
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
        <div className={`${styles.scroll} caption en`} aria-hidden="true">
          <span>Scroll</span>
          <span className={styles.scrollLine} />
        </div>
      </div>
    </section>
  );
}
