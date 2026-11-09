const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const puppeteer = require('puppeteer');

const { FONT_DIR } = require('./lib/fonts');
const { validateForm, ValidationError } = require('./lib/validate');
const { buildHtml } = require('./templates/form-template');

const PORT = process.env.PORT || 3000;
const MAX_PARALLEL_PDF = 2; // Render-এর ফ্রি প্ল্যানে মেমোরি কম, তাই সীমা

const app = express();
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: null,
      },
    },
  })
);

app.use(express.json({ limit: '6mb' }));
app.use('/fonts', express.static(FONT_DIR, { maxAge: '30d' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ ok: true }));

// ডিফল্ট ছবি (ব্যবহারকারী ছবি না দিলে)
function fileToDataUri(file, mime) {
  return `data:${mime};base64,` + fs.readFileSync(path.join(__dirname, 'public', 'images', file)).toString('base64');
}
const DEFAULT_LOGO = fileToDataUri('logo.svg', 'image/svg+xml');
const DEFAULT_PHOTO = fileToDataUri('member.svg', 'image/svg+xml');

const pdfLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।' },
});

let activeJobs = 0;

app.post('/api/generate-pdf', pdfLimiter, async (req, res) => {
  let browser;
  try {
    const { data, images } = validateForm(req.body);
    const html = buildHtml(data, {
      logo: images.logo || DEFAULT_LOGO,
      photo: images.photo || DEFAULT_PHOTO,
    });

    if (activeJobs >= MAX_PARALLEL_PDF) {
      return res.status(503).json({ error: 'সার্ভার এখন ব্যস্ত। কয়েক সেকেন্ড পরে আবার চেষ্টা করুন।' });
    }
    activeJobs++;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      });
      const page = await browser.newPage();

      // নিরাপত্তা: পেজ থেকে বাইরের কোনো রিকোয়েস্ট যেতে দেওয়া হবে না
      await page.setJavaScriptEnabled(false);
      await page.setRequestInterception(true);
      page.on('request', (r) => {
        const url = r.url();
        if (url.startsWith('data:') || url === 'about:blank') r.continue();
        else r.abort();
      });

      await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
      await page.evaluateHandle('document.fonts.ready');

      const pdf = await page.pdf({
        format: 'A4',
        landscape: false,
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        timeout: 30000,
      });

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="member-form.pdf"',
        'Cache-Control': 'no-store',
      });
      res.send(Buffer.from(pdf));
    } finally {
      activeJobs--;
    }
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    console.error('PDF তৈরিতে ত্রুটি:', err);
    if (!res.headersSent) res.status(500).json({ error: 'PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।' });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

// বড় বা ভুল JSON-এর জন্য
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'ছবির সাইজ অনেক বড়।' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'অনুরোধটি সঠিক নয়।' });
  console.error(err);
  res.status(500).json({ error: 'সার্ভারে সমস্যা হয়েছে।' });
});

app.listen(PORT, '0.0.0.0', () => console.log(`সার্ভার চালু: পোর্ট ${PORT}`));
