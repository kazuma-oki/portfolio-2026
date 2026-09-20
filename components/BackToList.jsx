"use client";

import Link from "next/link";
import { writeList } from "@/lib/listReturn";

/**
 * 個別ページの「←Works」「←Study」。
 * 押した実績のidを控えてから戻ることで、一覧側がその位置まで送ってくれる。
 * scroll={false} でルーターに先頭へ戻させない（行き先は一覧側が決める）。
 */
export default function BackToList({ href, label, storageKey, id, className }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={className}
      onClick={() => writeList(storageKey, { focus: id })}
    >
      {label}
    </Link>
  );
}
