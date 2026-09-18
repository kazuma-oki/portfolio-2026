import works from "@/data/works.json";
import PageHeader from "@/components/PageHeader";
import WorksBrowser from "@/components/WorksBrowser";

export const metadata = {
  title: "Works",
  description: "これまでに制作したWebサイト・デザインの一覧です。",
};

export default function WorksPage() {
  // データに実在するカテゴリだけをフィルターに出す
  const categories = ["All", ...new Set(works.map((w) => w.category))];

  return (
    <>
      <PageHeader
        eyebrow="Works"
        title="制作実績"
        lead="学びながら手を動かしてつくったものを、考えた過程ごと載せています。"
        count={works.length}
      />
      <section className="container" style={{ paddingBottom: "var(--section)" }}>
        <WorksBrowser works={works} categories={categories} />
      </section>
    </>
  );
}
