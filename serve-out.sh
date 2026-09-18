#!/bin/sh
# out/ を basePath と同じ階層に置いて配信する（本番と同じURLで確認するため）
set -e
rm -rf .serve
mkdir -p .serve/portfolio-2026
cp -r out/* .serve/portfolio-2026/
echo "http://localhost:8788/portfolio-2026/ で配信します"
npx --yes serve .serve -l 8788
