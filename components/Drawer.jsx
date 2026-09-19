"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import site from "@/data/site.json";
import SocialIcons from "./SocialIcons";
import styles from "./Drawer.module.css";

export default function Drawer({ open, onClose }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  // 開いている間は背面のスクロールを止める
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const items = [{ label: "Home", href: "/" }, ...site.nav];

  return (
    <div className={`${styles.wrap} ${open ? styles.open : ""}`} aria-hidden={!open}>
      <button
        type="button"
        className={styles.overlay}
        tabIndex={open ? 0 : -1}
        aria-label="メニューを閉じる"
        onClick={onClose}
      />
      <nav className={styles.panel} aria-label="メニュー">
        <ul className={styles.list}>
          {items.map((item) => {
            // TOPにいるときだけ Works は同じページの実績セクションへ
            const toWorks = isHome && item.href === "/works";
            return (
              <li key={item.href}>
                {toWorks ? (
                  <a
                    href="#works"
                    className={`${styles.link} en`}
                    tabIndex={open ? 0 : -1}
                    onClick={onClose}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link href={item.href} className={`${styles.link} en`} tabIndex={open ? 0 : -1}>
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <div className={styles.foot}>
          <SocialIcons className={styles.social} tabIndex={open ? 0 : -1} />
          <p className={`${styles.tagline} caption`}>{site.tagline}</p>
        </div>
      </nav>
    </div>
  );
}
