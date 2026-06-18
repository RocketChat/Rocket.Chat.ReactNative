"use strict";
const fs = require("fs");

function formatPrChangelog({ title, number, commits }) {
  const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

  function graphemes(str) {
    return Array.from(segmenter.segment(str), s => s.segment);
  }

  const header = `${title} (#${number})`;
  // Reverse to newest-first; gh pr view --json commits returns oldest-first
  const rows = [...commits].reverse().map(c => `${c.oid.slice(0, 7)} ${c.messageHeadline}`);

  const build = rs => (rs.length > 0 ? [header, "", ...rs] : [header]).join("\n");

  let output = build(rows);
  if (graphemes(output).length <= 500) return output;

  // Drop oldest rows (end of newest-first list) until within limit
  while (rows.length > 0) {
    rows.pop();
    output = build(rows);
    if (graphemes(output).length <= 500) return output;
  }

  // Header alone exceeds 500: hard-slice, no ellipsis
  return graphemes(output).slice(0, 500).join("");
}

module.exports = { formatPrChangelog };

if (require.main === module) {
  const pr = JSON.parse(fs.readFileSync("pr.json", "utf8"));
  fs.writeFileSync("changelog.txt", formatPrChangelog(pr), "utf8");
}
