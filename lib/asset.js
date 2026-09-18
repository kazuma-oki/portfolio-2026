// basePath（/portfolio-2026）を含めた画像パスを返す
const BASE = process.env.NODE_ENV === "production" ? "/portfolio-2026" : "";

export function asset(path = "") {
  if (!path) return "";
  if (/^https?:/.test(path)) return path;
  return `${BASE}/${path.replace(/^\//, "")}`;
}
