// Compile a vercel.json `source` the way the local preview server matches paths.
// A dot is literal unless it is already escaped or is the "." in ".*", ".+" or ".?".
// Vercel path-to-regexp treats a bare dot as literal; these patterns also use regex groups.
export function compileSource(source) {
  const body = String(source).replace(/\\?\./g, (m, i, s) => {
    if (m.startsWith("\\")) return m;
    const next = s[i + m.length];
    if (next === "*" || next === "+" || next === "?") return m;
    return "\\.";
  });
  return new RegExp("^" + body + "$");
}
