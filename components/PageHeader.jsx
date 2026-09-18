import styles from "./PageHeader.module.css";

/** 各下層ページの先頭（設計図の「タイトルエリア H220px」） */
export default function PageHeader({ eyebrow, title, lead, count }) {
  return (
    <header className={styles.header}>
      <div className="container">
        <p className={`${styles.eyebrow} caption en`}>
          {eyebrow}
          {typeof count === "number" && <span className={styles.count}>({count})</span>}
        </p>
        <h1 className={`${styles.title} h1`}>{title}</h1>
        {lead && <p className={`${styles.lead} body-s subtext`}>{lead}</p>}
      </div>
    </header>
  );
}
