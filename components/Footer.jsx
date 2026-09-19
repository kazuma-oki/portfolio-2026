import Link from "next/link";
import site from "@/data/site.json";
import SocialIcons from "./SocialIcons";
import styles from "./Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`${styles.inner} container`}>
        <div className={styles.brand}>
          <p className={`${styles.logo} en`}>{site.logo}</p>
          <p className={`${styles.tagline} caption`}>{site.tagline}</p>
        </div>

        {/* ナビとSNSは1つの箱にまとめる。
            横幅を狭めたときも「左にナビ・右にSNS」の1行が崩れない */}
        <div className={styles.meta}>
          <nav className={styles.nav} aria-label="フッターナビゲーション">
            <ul className={styles.navList}>
              {[{ label: "Home", href: "/" }, ...site.nav].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <SocialIcons className={styles.social} />
        </div>
      </div>

      <p className={`${styles.copy} caption`}>© {year} KAZUMA OKI. All rights reserved.</p>
    </footer>
  );
}
