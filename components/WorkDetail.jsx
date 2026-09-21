import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import banners from "@/data/banners.json";
import BannerCanvas from "@/components/BannerCanvas";
import FadeIn from "@/components/FadeIn";
import Button from "@/components/Button";
import BackToList from "@/components/BackToList";
import styles from "./WorkDetail.module.css";

/** [表示文字](URL) をリンクに、**強調** を太字に、改行を <br> にする */
function RichText({ text = "" }) {
  const parts = text.split(/(\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (m) {
      return (
        <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer" className={styles.link}>
          {m[1]}
        </a>
      );
    }
    const b = part.match(/^\*\*([^*]+)\*\*$/);
    if (b) {
      return (
        <strong key={i} className={styles.strong}>
          {b[1]}
        </strong>
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

/** 箇条書き。項目が { text, list } なら下位の箇条書きを入れ子にする */
function Items({ items }) {
  return (
    <ul className={styles.list}>
      {items.map((li, i) => (
        <li key={i}>
          <RichText text={typeof li === "string" ? li : li.text} />
          {typeof li !== "string" && li.list && <Items items={li.list} />}
        </li>
      ))}
    </ul>
  );
}

/** text / list / sub / image / gallery を描き分ける */
function Block({ block }) {
  if (block.sub) return <p className={styles.sub}>{block.sub}</p>;

  // 同じ大きさの画像を並べる。バナー集のように増えていくものに使う
  if (block.gallery) {
    return (
      <ul className={styles.gallery}>
        {block.gallery.map((item, i) => (
          <li key={i}>
            <Image
              src={asset(item.src)}
              alt={item.alt || ""}
              width={1600}
              height={1600}
              sizes="(max-width: 540px) 320px, (max-width: 1024px) 700px, 380px"
            />
          </li>
        ))}
      </ul>
    );
  }

  // 掴んで動かせるバナーの面。本文の枠から出して画面幅いっぱいに使う
  if (block.canvas) {
    const items = banners[block.canvas];
    if (!items) return null;
    return (
      <div className={styles.bleed}>
        <BannerCanvas banners={items} mode={block.mode || "rows"} />
      </div>
    );
  }

  // 縦に長い図。開くまでは見出しの行だけにしておく
  if (block.fold) {
    return (
      <details className={styles.fold}>
        <summary>
          <span>{block.fold}</span>
        </summary>
        <Image
          src={asset(block.image)}
          alt={block.alt || ""}
          width={block.width || 1200}
          height={block.height || 2400}
          sizes="(max-width: 1024px) 100vw, 800px"
        />
      </details>
    );
  }

  if (block.list) return <Items items={block.list} />;

  if (block.image) {
    return (
      <figure className={styles.figure}>
        <Image
          src={asset(block.image)}
          alt={block.alt || ""}
          width={block.width || 1059}
          height={block.height || 2400}
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

/**
 * 個別ページの中身。Works と Study で同じものを使う。
 *   item      … 表示する1件
 *   list      … その件が属する一覧（Next のたどり先に使う）
 *   basePath  … "/works" か "/study"
 *   backLabel … 戻るリンクの文字
 *   nextLabel … 次へのリンクの見出し
 * storageKey は一覧ページと同じものを渡す（戻ったときの位置合わせに使う）。
 */
export default function WorkDetail({
  item,
  list,
  basePath,
  backLabel,
  nextLabel = "Next work",
  storageKey,
}) {
  const index = list.findIndex((w) => w.id === item.id);
  const next = list.length > 1 ? list[(index + 1) % list.length] : null;

  return (
    <>
      <header className={styles.head}>
        <div className="container">
          <div className={styles.column}>
          <BackToList
            href={basePath}
            label={backLabel}
            storageKey={storageKey}
            id={item.id}
            className={`${styles.back} caption en`}
          />
          <p className={`${styles.meta} caption`}>
            <span>{item.category}</span>
            <span aria-hidden="true">/</span>
            <span>{item.year}</span>
            <span className={styles.tag}>{item.tag}</span>
          </p>
          <h1 className={`${styles.title} h1`}>{item.title}</h1>
          {item.summary && <p className={`${styles.summary} body-s subtext`}>{item.summary}</p>}
          </div>
        </div>
      </header>

      <FadeIn className="container">
        <div className={styles.kv}>
          <Image
            src={asset(item.mainImage || item.thumb)}
            alt={item.title}
            width={1600}
            height={1600}
            priority
            sizes="(max-width: 1024px) 100vw, 760px"
          />
        </div>
      </FadeIn>

      <div className={`${styles.body} container`}>
        <div className={styles.column}>
          {item.sections.map((section, i) => (
            <FadeIn as="section" key={i} className={styles.section}>
              <h2 className={styles.sectionTitle}>{section.heading}</h2>
              <div className={styles.sectionBody}>
                {section.blocks.map((block, j) => (
                  <Block key={j} block={block} />
                ))}
              </div>
            </FadeIn>
          ))}

          {/* 制作情報。本文の一番下に置く */}
          {item.info && item.info.length > 0 && (
            <FadeIn as="section" className={styles.section}>
              <h2 className={styles.sectionTitle}>制作情報</h2>
              <dl className={styles.info}>
                {item.info.map((row) => (
                  <div key={row.label}>
                    <dt className="caption">{row.label}</dt>
                    <dd>
                      <RichText text={row.value} />
                    </dd>
                  </div>
                ))}
              </dl>
              {item.url && (
                <Button href={item.url} external variant="ghost">
                  Visit site
                </Button>
              )}
            </FadeIn>
          )}
        </div>
      </div>

      {/* 1件しかないときは次の行き先がないので出さない */}
      {next && (
        <section className={styles.next}>
          <div className="container">
            <Link
              href={`${basePath}/${next.id}`}
              className={`${styles.nextLink} ${styles.column}`}
            >
              <span className={`${styles.nextLabel} caption en`}>{nextLabel}</span>
              <span className={`${styles.nextTitle} h3`}>{next.title}</span>
              <span className={`${styles.nextArrow} en`} aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
