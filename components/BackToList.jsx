"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readList, writeList, TOP_KEY } from "@/lib/listReturn";

/**
 * 個別ページの「←Works」「←Study」。
 * 押した実績のidを控えてから戻ることで、一覧側がその位置まで送ってくれる。
 * scroll={false} でルーターに先頭へ戻させない（行き先は一覧側が決める）。
 *
 * TOPのカルーセルから入ってきたときだけは、一覧ではなくカルーセルへ戻す。
 * ブラウザの戻るボタンと行き先をそろえるため。
 */
export default function BackToList({ href, label, storageKey, id, className }) {
  const [fromTop, setFromTop] = useState(false);

  useEffect(() => {
    setFromTop(readList(TOP_KEY).came === true);
  }, []);

  const onClick = () => {
    if (fromTop) {
      // カルーセルがこの実績を真ん中に出してくれる
      writeList(TOP_KEY, { focus: id, came: false });
    } else {
      writeList(storageKey, { focus: id });
    }
  };

  return (
    <Link
      href={fromTop ? "/" : href}
      scroll={false}
      className={className}
      onClick={onClick}
    >
      {fromTop ? "← Home" : label}
    </Link>
  );
}
