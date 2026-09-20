import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import works from "@/data/works.json";
import { asset } from "@/lib/asset";
import FadeIn from "@/components/FadeIn";
import Button from "@/components/Button";
import styles from "./work.module.css";

export function generateStaticParams() {
  return works.map((w) => ({ id: w.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const work = works.find((w) => w.id === id);
  if (!work) return {};
  return {
    title: work.title,
    description: work.summary,
    openGraph: {
      title: work.title,
      description: work.summary,
      images: [`/${work.mainImage}`],
    },
  };
}

/** [表示文字](URL) をリンクに、改行を <br> にする */
function RichText({ text = "" }) {
  const parts = text.split(/(\[[^\]]+\]\([^)\s]+\))/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (m) {
      return (
        <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer" className={styles.link}>
          {m[1]}
        </a>
      );
    }
    const lines = part.split("\n");
    return lines.map((line, j) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < lines.length - 1 && <br />}
      </span>
    ));
  });
}

/** text / list / sub / image の4種類を描き分ける */
function Block({ block }) {
  if (block.sub) return <p className={styles.sub}>{block.sub}</p>;

  if (block.list) {
    return (
      <ul className={styles.list}>
        {block.list.map((li, i) => (
          <li key={i}>
            <RichText text={li} />
          </li>
        ))}
      </ul>
    );
  }

  if (block.image) {
    return (
      <figure className={styles.figure}>
        <Image
          src={asset(block.image)}
          alt={block.alt || ""}
          width={1059}
          height={2400}
          sizes="(max-width: 1024px) 100vw, 800px"
        />
      </figure>
    );
  }

  if (block.text) {
    return (
      <p className={styles.paragraph}>
        <RichText text={block.text} />
      </p>
    );
  }

  return null;
}

export default async function WorkDetail({ params }) {
  const { id } = await params;
  const work = works.find((w) => w.id === id);
  if (!work) notFound();

  const index = works.findIndex((w) => w.id === id);
  const next = works[(index + 1) % works.length];

  return (
    <>
      <header className={styles.head}>
        <div className="container">
          <Link href="/works" className={`${styles.back} caption en`}>
            ← Works
          </Link>
          <p className={`${styles.meta} caption`}>
            <span>{work.category}</span>
            <span aria-hidden="true">/</span>
            <span>{work.year}</span>
            <span className={styles.tag}>{work.tag}</span>
          </p>
          <h1 className={`${styles.title} h1`}>{work.title}</h1>
          {work.summary && <p className={`${styles.summary} body-s subtext`}>{work.summary}</p>}
        </div>
      </header>

      <FadeIn className="container">
        <div className={styles.kv}>
          <Image
            src={asset(work.mainImage || work.thumb)}
            alt={work.title}
            width={1600}
            height={1600}
            priority
            sizes="(max-width: 1024px) 100vw, 760px"
          />
        </div>
      </FadeIn>

      <div className={`${styles.body} container`}>
        <div className={styles.main}>
          {work.sections.map((section, i) => (
            <FadeIn as="section" key={i} className={styles.section}>
              <h2 className={styles.sectionTitle}>{section.heading}</h2>
              <div className={styles.sectionBody}>
                {section.blocks.map((block, j) => (
                  <Block key={j} block={block} />
                ))}
              </div>
            </FadeIn>
          ))}
        </div>

        <aside className={styles.side}>
          <dl className={styles.info}>
            <div>
              <dt className="caption">Category</dt>
              <dd>{work.category}</dd>
            </div>
            <div>
              <dt className="caption">Year</dt>
              <dd>{work.year}</dd>
            </div>
            <div>
              <dt className="caption">Role</dt>
              <dd>{work.role}</dd>
            </div>
            <div>
              <dt className="caption">Tools</dt>
              <dd>{work.tools ? work.tools.join(" / ") : ""}</dd>
            </div>
          </dl>
          {work.url && (
            <Button href={work.url} external variant="ghost">
              Visit site
            </Button>
          )}
        </aside>
      </div>

      <section className={styles.next}>
        <div className="container">
          <Link href={`/works/${next.id}`} className={styles.nextLink}>
            <span className={`${styles.nextLabel} caption en`}>Next work</span>
            <span className={`${styles.nextTitle} h3`}>{next.title}</span>
            <span className={`${styles.nextArrow} en`} aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
