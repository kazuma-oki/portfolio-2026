import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import styles from "./WorkCard.module.css";

export default function WorkCard({ work, priority = false, ratio = "4 / 3", tabIndex }) {
  return (
    <article className={styles.card}>
      <Link href={`/works/${work.id}`} className={styles.link} tabIndex={tabIndex}>
        <div className={styles.thumb} style={{ aspectRatio: ratio }}>
          <Image
            src={asset(work.thumb)}
            alt=""
            width={974}
            height={730}
            priority={priority}
            sizes="(max-width: 540px) 358px, (max-width: 1024px) 320px, 282px"
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
