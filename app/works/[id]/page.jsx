import { notFound } from "next/navigation";
import works from "@/data/works.json";
import WorkDetail from "@/components/WorkDetail";

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

export default async function WorkPage({ params }) {
  const { id } = await params;
  const work = works.find((w) => w.id === id);
  if (!work) notFound();

  return (
    <WorkDetail
      item={work}
      list={works}
      basePath="/works"
      backLabel="← Works"
      nextLabel="Next work"
      storageKey="/works"
    />
  );
}
