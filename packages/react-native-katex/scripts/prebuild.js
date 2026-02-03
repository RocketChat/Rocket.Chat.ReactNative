const { readFileSync, writeFileSync, readdirSync } = require('fs');
const { dirname, resolve } = require('path');

const KATEX_DIR = dirname(require.resolve('katex'));
const KATEX_FONT_DIR = resolve(KATEX_DIR, 'fonts');
const SOURCE_DIR = resolve(__dirname, '../src');

const katexScriptFile = resolve(KATEX_DIR, 'katex.min.js');
const katexScript = readFileSync(katexScriptFile, 'utf8');
writeFileSync(resolve(SOURCE_DIR, 'katex-script.ts'), `export default ${JSON.stringify(katexScript)};`);

const katexStyleFile = resolve(KATEX_DIR, 'katex.min.css');
const katexStyleOrigin = readFileSync(katexStyleFile, 'utf8');
const katexStyleClean = katexStyleOrigin.replace(/@font-face{.*?}/g, '');

const fontNames = [
  'KaTeX_AMS',
  'KaTeX_Caligraphic',
  'KaTeX_Fraktur',
  'KaTeX_Main',
  'KaTeX_Math',
  'KaTeX_SansSerif',
  'KaTeX_Script',
  'KaTeX_Size1',
  'KaTeX_Size2',
  'KaTeX_Size3',
  'KaTeX_Size4',
  'KaTeX_Typewriter',
];

const fontType = 'woff2';
const fontTypeExpr = new RegExp(`\\.${fontType}$`);
const fontFiles = readdirSync(KATEX_FONT_DIR).filter(filename => fontTypeExpr.test(filename));
const fonts = [];

fontNames.forEach(fontName => {
  fontFiles
  .filter(fontFile => fontFile.includes(fontName))
  .forEach(fontFile => {
    const fontData = readFileSync(`${KATEX_FONT_DIR}/${fontFile}`);
    const fontWeight = /bold/i.test(fontFile) ? 'bold' : 'normal';
    const fontStyle = /italic/i.test(fontFile) ? 'italic' : 'normal';
    fonts.push(`
@font-face {
  font-family: '${fontName}';
  src: url('data:application/font-woff2;base64,${fontData.toString('base64')}') format('${fontType}');
  font-weight: ${fontWeight};
  font-style: ${fontStyle};
}    
`);
  });
});

const fontStyle = fonts.join('\n');

writeFileSync(resolve(SOURCE_DIR, 'katex-style.ts'), `export default ${JSON.stringify(fontStyle + katexStyleClean)};`);
