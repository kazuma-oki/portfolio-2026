import { notFound } from "next/navigation";
import study from "@/data/study.json";
import WorkDetail from "@/components/WorkDetail";

export function generateStaticParams() {
  return study.map((w) => ({ id: w.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const item = study.find((w) => w.id === id);
  if (!item) return {};
  return {
    title: item.title,
    description: item.summary,
    openGraph: {
      title: item.title,
      description: item.summary,
      images: [`/${item.mainImage}`],
    },
  };
}

export default async function StudyPage({ params }) {
  const { id } = await params;
  const item = study.find((w) => w.id === id);
  if (!item) notFound();

  return (
    <WorkDetail
      item={item}
      list={study}
      basePath="/study"
      backLabel="← Study"
      nextLabel="Next"
      storageKey="/study"
    />
  );
}
