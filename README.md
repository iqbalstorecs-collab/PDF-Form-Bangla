# PDF-Form-Bangla

বাংলা সদস্য নিবন্ধন ফর্ম থেকে **Puppeteer** দিয়ে আসল টেক্সট-ভিত্তিক A4 PDF তৈরির সিস্টেম।

- PDF ছবি বা স্ক্রিনশট নয়: লেখা Select ও Copy করা যায়
- বাংলা ফন্ট: Noto Sans Bengali (PDF-এ Embed হয়)
- মোবাইল Responsive ফর্ম

## ফোল্ডার

```
public/      ফর্ম (index.html, style.css, script.js, images/)
lib/         ফন্ট ও Validation
templates/   PDF-এর HTML টেমপ্লেট
server.js    Express সার্ভার + POST /api/generate-pdf
render.yaml  Render Deploy সেটিং
```

## লোকালি চালানো

```
npm install
npm start
```
তারপর http://localhost:3000 খুলুন।

## Render সেটিং

- Build Command: `npm install && npx puppeteer browsers install chrome`
- Start Command: `npm start`
- Environment Variable: `NODE_VERSION` = `20`
- Health Check Path: `/health`

## API

`POST /api/generate-pdf` (JSON) → `application/pdf`
সার্ভার শুধু ফর্মের ডাটা নেয়, কাঁচা HTML নেয় না।
