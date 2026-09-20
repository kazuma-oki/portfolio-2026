import Image from "next/image";
import site from "@/data/site.json";
import works from "@/data/works.json";
import { asset } from "@/lib/asset";
import Hero from "@/components/Hero";
import SectionTitle from "@/components/SectionTitle";
import WorkCarousel from "@/components/WorkCarousel";
import FadeIn from "@/components/FadeIn";
import Button from "@/components/Button";
import styles from "./page.module.css";

export default function Home() {
  const { about, aboutSection } = site;

  return (
    <>
      <Hero />

      {/* Works プレビュー。横に流して見られるようにし、
          TOPが縦に長くならないようにしている */}
      <section className={`section ${styles.works}`} id="works">
        <div className="container">
          <SectionTitle
            eyebrow={site.worksSection.eyebrow}
            title={site.worksSection.title}
            lead={site.worksSection.lead}
          />

          <FadeIn className={styles.worksInner} delay={80}>
            {/* TOPは入口なので先頭8件まで。続きは「View all」へ */}
            <WorkCarousel works={works.slice(0, 8)} />
          </FadeIn>

          <FadeIn className={styles.headAction} delay={120}>
            <Button href="/works" variant="ghost">
              View all
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* About プレビュー */}
      <section className="section">
        <div className="container">
          <SectionTitle
            eyebrow={aboutSection.eyebrow}
            title={aboutSection.title}
            lead={aboutSection.lead}
          />

          {/* 左に写真と名前、右に短い紹介文 */}
          <div className={styles.profile}>
            <FadeIn className={styles.profileVisual}>
              <Image
                className={styles.profilePhoto}
                src={asset(about.image)}
                alt={about.name}
                width={880}
                height={1173}
                sizes="(max-width: 540px) 200px, (max-width: 1024px) 240px, 280px"
              />
              <p className={styles.profileName}>{about.name}</p>
            </FadeIn>

            <FadeIn className={styles.profileText} delay={80}>
              {aboutSection.profile.map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </FadeIn>
          </div>

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
