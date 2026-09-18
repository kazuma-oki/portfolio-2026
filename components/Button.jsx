import Link from "next/link";
import styles from "./Button.module.css";

/**
 * variant: "primary"（黒ピル） / "secondary"（アクセント） / "ghost"（枠線のみ）
 * 矢印は共通で付く（設計図のボタン仕様）
 */
export default function Button({ href, variant = "primary", children, external, ...rest }) {
  const className = `${styles.button} ${styles[variant]} en`;
  const content = (
    <>
      <span>{children}</span>
      <svg className={styles.arrow} viewBox="0 0 16 16" aria-hidden="true">
        <path d="M1 8h12M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </>
  );

  if (external) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer" {...rest}>
        {content}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={className} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={className} {...rest}>
      {content}
    </button>
  );
}
