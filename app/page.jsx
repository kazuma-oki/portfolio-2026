import Link from "next/link";
import site from "@/data/site.json";
import works from "@/data/works.json";
import Hero from "@/components/Hero";
import SectionTitle from "@/components/SectionTitle";
import WorkGrid from "@/components/WorkGrid";
import FadeIn from "@/components/FadeIn";
import Button from "@/components/Button";
import styles from "./page.module.css";

export default function Home() {
  const featured = works.slice(0, 3);
  const { about } = site;

  return (
    <>
      <Hero />

      {/* Works プレビュー */}
      <section className={`section ${styles.works}`} id="works">
        <div className="container">
          <SectionTitle
            eyebrow={site.worksSection.eyebrow}
            title={site.worksSection.title}
            lead={site.worksSection.lead}
          />

          <FadeIn className={styles.worksInner} delay={80}>
            <WorkGrid works={featured} columns={3} />
          </FadeIn>

          <FadeIn className={styles.headAction} delay={120}>
            <Button href="/works" variant="ghost">
              View all
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* About プレビュー（3カラム） */}
      <section className="section">
        <div className="container">
          <SectionTitle
            eyebrow={site.aboutSection.eyebrow}
            title={site.aboutSection.title}
            lead={site.aboutSection.lead}
          />

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

          <FadeIn className={styles.aboutAction} delay={120}>
            <Button href="/about" variant="ghost">
              About me
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className="container">
          <FadeIn className={styles.ctaInner}>
            <div>
              <h2 className={`${styles.ctaTitle} h3`}>{site.cta.title}</h2>
              <p className={`${styles.ctaLead} body-s`}>{site.cta.lead}</p>
            </div>
            <Button href="/contact" variant="secondary">
              {site.cta.button}
            </Button>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
