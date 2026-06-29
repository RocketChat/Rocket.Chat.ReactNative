"use strict";
const fs = require("fs");

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

function graphemes(str) {
  return Array.from(segmenter.segment(str), s => s.segment);
}

// Hard-cap to `limit` graphemes. When `ellipsis` is true, reserve 3 graphemes
// for a trailing "..." (matches the legacy Play Store preparer). Assumes
// limit >= 4 when ellipsis is true.
function capGraphemes(str, limit, { ellipsis = false } = {}) {
  const chars = graphemes(str);
  if (chars.length <= limit) return str;
  if (ellipsis) return chars.slice(0, limit - 3).join("") + "...";
  return chars.slice(0, limit).join("");
}

function formatPrChangelog({ title, number, commits }) {
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
  return capGraphemes(output, 500);
}

module.exports = { formatPrChangelog, capGraphemes, graphemes };

if (require.main === module) {
  const mode = process.argv[2];

  if (mode === "pr") {
    const pr = JSON.parse(fs.readFileSync("pr.json", "utf8"));
    fs.writeFileSync("changelog.txt", formatPrChangelog(pr), "utf8");
  } else if (mode === "cap") {
    const buildVersion = process.env.BUILD_VERSION;
    const input = fs.readFileSync("changelog.txt", "utf8");
    fs.writeFileSync(
      `android/fastlane/metadata/android/en-US/changelogs/${buildVersion}.txt`,
      capGraphemes(input, 500, { ellipsis: true }),
      "utf8"
    );
  } else {
    console.error(`Unknown mode "${mode}". Usage: node changelog.js <pr|cap>`);
    process.exit(1);
  }
}
