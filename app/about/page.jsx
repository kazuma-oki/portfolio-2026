import Image from "next/image";
import site from "@/data/site.json";
import { asset } from "@/lib/asset";
import PageHeader from "@/components/PageHeader";
import FadeIn from "@/components/FadeIn";
import Button from "@/components/Button";
import styles from "./about.module.css";

export const metadata = {
  title: "About",
  description: site.about.body[0],
};

export default function AboutPage() {
  const { about } = site;

  return (
    <>
      <PageHeader eyebrow="About" title={about.heading} lead={about.lead} />

      <section className="container">
        <div className={styles.profile}>
          <FadeIn className={styles.visual}>
            {about.image ? (
              <Image
                src={asset(about.image)}
                alt={about.name}
                width={320}
                height={400}
                sizes="(max-width: 1024px) 100vw, 320px"
              />
            ) : (
              <div className={`${styles.placeholder} caption en`}>{about.imagePlaceholder}</div>
            )}
          </FadeIn>

          <FadeIn className={styles.text} delay={80}>
            <p className={styles.name}>{about.name}</p>
            <p className={`${styles.role} caption`}>{about.role}</p>
            <div className={styles.body}>
              {about.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </FadeIn>
        </div>

        <FadeIn className={styles.stats} as="ul">
          {about.stats.map((s) => (
            <li key={s.label} className={styles.stat}>
              <span className={`${styles.statValue} en`}>{s.value}</span>
              <span className={`${styles.statLabel} caption en`}>{s.label}</span>
            </li>
          ))}
        </FadeIn>
      </section>

      <section className={`section ${styles.skillSection}`}>
        <div className="container">
          <h2 className={`${styles.skillHead} h3`}>できること</h2>
          <ul className={styles.skills}>
            {about.skills.map((skill, i) => (
              <FadeIn as="li" key={skill.title} className={styles.skill} delay={i * 90}>
                <p className={`${styles.skillNo} caption en`}>0{i + 1}</p>
                <h3 className={styles.skillTitle}>{skill.title}</h3>
                <p className={`${styles.skillText} body-s subtext`}>{skill.text}</p>
                <p className={`${styles.skillTools} caption`}>{skill.tools}</p>
              </FadeIn>
            ))}
          </ul>

          <FadeIn className={styles.action}>
            <Button href="/contact">Contact</Button>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
