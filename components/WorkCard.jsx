import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import styles from "./WorkCard.module.css";

export default function WorkCard({ work, priority = false, ratio = "1 / 1", tabIndex }) {
  return (
    <article className={styles.card}>
      {/* draggable={false} がないと、掴んで動かしたときに
          ブラウザ標準の画像ドラッグ（半透明の複製）が始まってしまう */}
      <Link
        href={`/works/${work.id}`}
        className={styles.link}
        tabIndex={tabIndex}
        draggable={false}
      >
        <div className={styles.thumb} style={{ aspectRatio: ratio }}>
          <Image
            src={asset(work.thumb)}
            alt=""
            width={1600}
            height={1600}
            priority={priority}
            draggable={false}
            sizes="(max-width: 540px) 320px, (max-width: 1024px) 700px, 380px"
          />
        </div>
        <p className={`${styles.meta} caption`}>
          <span>{work.category}</span>
          <span aria-hidden="true">/</span>
          <span>{work.year}</span>
        </p>
        <h3 className={styles.title}>{work.title}</h3>
        {work.summary && <p className={`${styles.summary} body-s subtext`}>{work.summary}</p>}
      </Link>
    </article>
  );
}
