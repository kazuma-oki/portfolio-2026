/**
 * 一覧ページの「どこまで見ていたか」を覚えておく。
 *   filter … 選んでいた絞り込み
 *   focus  … 個別ページから戻るとき、画面中央に出したい実績のid（使ったら消す）
 * 保存できない環境（プライベートブラウズなど）でも一覧が普通に出るよう、
 * 読み書きの失敗はすべて握りつぶす。
 */
const NS = "pf26:list:";

export function readList(key) {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(NS + key);
    const value = raw ? JSON.parse(raw) : null;
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

export function writeList(key, patch) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(NS + key, JSON.stringify({ ...readList(key), ...patch }));
  } catch {
    /* 保存できなくても動きは変わらない */
  }
}
