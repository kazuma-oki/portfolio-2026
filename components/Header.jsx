"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import site from "@/data/site.json";
import Drawer from "./Drawer";
import styles from "./Header.module.css";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  // スクロール80pxを超えたら背景をぼかす（設計図の「ヘッダーのスクロール固定」）
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ページが変わったらドロワーを閉じる
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        <div className={styles.inner}>
          <Link href="/" className={`${styles.logo} en`} aria-label={`${site.logo} ホーム`}>
            {site.logo}
          </Link>

          <nav className={styles.nav} aria-label="メインナビゲーション">
            <ul className={styles.navList}>
              {site.nav.filter((item) => item.href !== "/contact").map((item) => {
                // TOPにいるときだけ、Works は一覧ページではなく
                // 同じページの実績セクションへなめらかに移動する
                const label = <span className={styles.navLabel}>{item.label}</span>;

                if (isHome && item.href === "/works") {
                  return (
                    <li key={item.href}>
                      <a href="#works" className={styles.navLink}>
                        {label}
                      </a>
                    </li>
                  );
                }
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={styles.navLink}
                      aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <Link href="/contact" className={styles.cta}>
            Contact
          </Link>

          <button
            type="button"
            className={styles.burger}
            aria-label={open ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <Drawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
