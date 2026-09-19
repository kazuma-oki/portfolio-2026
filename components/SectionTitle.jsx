import FadeIn from "./FadeIn";
import styles from "./SectionTitle.module.css";

export default function SectionTitle({ eyebrow, title, lead, align = "center" }) {
  return (
    <FadeIn className={`${styles.wrap} ${align === "left" ? styles.left : ""}`}>
      {eyebrow && <p className={`${styles.eyebrow} caption en`}>{eyebrow}</p>}
      <h2 className={`${styles.title} h2`}>{title}</h2>
      {lead && <p className={`${styles.lead} body-s subtext`}>{lead}</p>}
    </FadeIn>
  );
}
