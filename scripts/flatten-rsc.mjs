/**
 * Next.js の静的書き出しでは、先読み用データが
 *   out/about/__next.about/__PAGE__.txt
 * というフォルダ構造で出るのに、ブラウザは
 *   out/about/__next.about.__PAGE__.txt
 * というドット区切りの名前で取りに行くため404になる。
 * ビルド後にドット区切りの名前でも取れるようコピーを置く。
 */

import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "out");
let copied = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (!entry.isDirectory()) continue;

    if (entry.name.startsWith("__next.")) {
      flatten(full, dir, entry.name);
    } else {
      walk(full);
    }
  }
}

/** __next.xxx フォルダの中身を、親フォルダにドット区切りの名前で複製する */
function flatten(dir, parent, prefix) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      flatten(full, parent, `${prefix}.${entry.name}`);
    } else {
      const dest = path.join(parent, `${prefix}.${entry.name}`);
      fs.copyFileSync(full, dest);
      copied += 1;
    }
  }
}

if (!fs.existsSync(OUT)) {
  console.error("out/ が見つかりません。先に next build を実行してください。");
  process.exit(1);
}

walk(OUT);
console.log(`先読みデータを ${copied} 件そろえました。`);
