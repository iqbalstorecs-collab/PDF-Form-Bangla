// Noto Sans Bengali ফন্টের CSS তৈরি করে।
// ফন্ট ফাইলগুলো npm প্যাকেজ (@fontsource/noto-sans-bengali) থেকে আসে,
// তাই আলাদা করে ফন্ট আপলোড করতে হয় না এবং ইন্টারনেট ছাড়াই সার্ভারে লোড হয়।
const fs = require('fs');
const path = require('path');

const FONT_DIR = path.join(__dirname, '..', 'node_modules', '@fontsource', 'noto-sans-bengali', 'files');

const RANGES = {
  bengali: 'U+0951-0952,U+0964-0965,U+0980-09FE,U+1CF7,U+200C-200D,U+20B9,U+25CC',
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2010-2027,U+2030-206F,U+20AC,U+2122,U+2212,U+FEFF,U+FFFD',
};

const FACES = [];
for (const weight of [400, 700]) {
  for (const subset of ['bengali', 'latin']) {
    FACES.push({ weight, subset, file: `noto-sans-bengali-${subset}-${weight}-normal.woff2` });
  }
}

function buildCss(srcFor) {
  return FACES.map(
    (f) => `@font-face{font-family:'Noto Sans Bengali';font-style:normal;font-weight:${f.weight};font-display:block;src:url(${srcFor(f)}) format('woff2');unicode-range:${RANGES[f.subset]};}`
  ).join('\n');
}

let cachedEmbedded = null;

// PDF-এর জন্য: ফন্ট base64 হিসেবে সরাসরি HTML-এ বসানো হয় (নেটওয়ার্ক লাগে না)।
function embeddedFontCss() {
  if (!cachedEmbedded) {
    cachedEmbedded = buildCss((f) => {
      const data = fs.readFileSync(path.join(FONT_DIR, f.file)).toString('base64');
      return `data:font/woff2;base64,${data}`;
    });
  }
  return cachedEmbedded;
}

module.exports = { FONT_DIR, embeddedFontCss, buildCss };
