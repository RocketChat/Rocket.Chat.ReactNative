const fs = require("fs");

const buildVersion = process.env.BUILD_VERSION;
const input = fs.readFileSync("changelog.txt", "utf8");

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
const chars = Array.from(segmenter.segment(input), s => s.segment);

let output;
if (chars.length > 500) {
  output = chars.slice(0, 497).join("") + "...";
} else {
  output = input;
}

fs.writeFileSync(
  `android/fastlane/metadata/android/en-US/changelogs/${buildVersion}.txt`,
  output,
  "utf8"
);
