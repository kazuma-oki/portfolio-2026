"use client";

import { useEffect } from "react";
import Link from "next/link";
import site from "@/data/site.json";
import styles from "./Drawer.module.css";

export default function Drawer({ open, onClose }) {
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
          {[{ label: "Home", href: "/" }, ...site.nav].map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={`${styles.link} en`} tabIndex={open ? 0 : -1}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className={`${styles.tagline} caption`}>{site.tagline}</p>
      </nav>
    </div>
  );
}
