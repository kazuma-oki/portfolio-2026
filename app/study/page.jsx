import study from "@/data/study.json";
import site from "@/data/site.json";
import PageHeader from "@/components/PageHeader";
import WorksBrowser from "@/components/WorksBrowser";

export const metadata = {
  title: "Study",
  description: "デザインを学ぶ過程でつくったものと、学んだことの記録です。",
};

export default function StudyIndexPage() {
  // 記事が増えたらここに分類を足すだけで、絞り込みが出るようになる
  const order = ["トレース制作", "学習メモ"];
  const present = new Set(study.map((w) => w.category));
  const categories = [
    "All",
    ...order.filter((c) => present.has(c)),
    ...[...present].filter((c) => !order.includes(c)),
  ];

  return (
    <>
      <PageHeader
        eyebrow={site.studySection.eyebrow}
        title={site.studySection.title}
        lead={site.studySection.lead}
        count={study.length}
      />
      <section className="container" style={{ paddingBottom: "var(--section)" }}>
        <WorksBrowser
          works={study}
          categories={categories}
          storageKey="/study"
          basePath="/study"
        />
      </section>
    </>
  );
}
