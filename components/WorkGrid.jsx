import WorkCard from "./WorkCard";
import styles from "./WorkGrid.module.css";

/**
 * columns で列数、ratio でサムネイルの比率を切り替える。
 * data-work-id は、個別ページから戻ってきたときに
 * WorksBrowser がその実績を画面中央へ送るための目印。
 */
export default function WorkGrid({ works, columns = 3, ratio = "1 / 1", basePath = "/works" }) {
  return (
    <ul className={styles.grid} data-columns={columns}>
      {works.map((work, i) => (
        <li key={work.id} className={styles.item} data-work-id={work.id}>
          <WorkCard work={work} priority={i === 0} ratio={ratio} basePath={basePath} />
        </li>
      ))}
    </ul>
  );
}
