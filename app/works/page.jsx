import works from "@/data/works.json";
import PageHeader from "@/components/PageHeader";
import WorksBrowser from "@/components/WorksBrowser";

export const metadata = {
  title: "Works",
  description: "これまでに制作したWebサイト・デザインの一覧です。",
};

export default function WorksPage() {
  // フィルターの並びはここで決める。データに1件もない分類は出さない
  const order = ["Website", "サムネイル", "バナー", "画面設計"];
  const present = new Set(works.map((w) => w.category));
  const categories = [
    "All",
    ...order.filter((c) => present.has(c)),
    // 並びに書き忘れた分類があっても落とさない
    ...[...present].filter((c) => !order.includes(c)),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Works"
        title="制作実績"
        lead="学びながら手を動かしてつくったものを、考えた過程ごと載せています。"
        count={works.length}
      />
      <section className="container" style={{ paddingBottom: "var(--section)" }}>
        <WorksBrowser works={works} categories={categories} storageKey="/works" />
      </section>
    </>
  );
}
