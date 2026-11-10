// Chromium প্রজেক্টের ভেতরেই ডাউনলোড হবে, যাতে Render-এ Build-এর পরেও পাওয়া যায়।
const { join } = require('path');

module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
