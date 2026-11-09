// PDF-এর জন্য চূড়ান্ত HTML তৈরি করে।
// সব ইউজার-ডাটা escape করা হয়, তাই HTML injection সম্ভব নয়।
const { embeddedFontCss } = require('../lib/fonts');

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const toBn = (s) => String(s).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

function fmtDate(iso) {
  const [y, m, d] = iso.split('-');
  return toBn(`${d}/${m}/${y}`);
}

const row = (label, value) =>
  `<div class="row"><span class="l">${label}</span><span class="v">${esc(value)}</span></div>`;

function buildHtml(data, images) {
  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8">
<title>সদস্য নিবন্ধন ফর্ম</title>
<style>
${embeddedFontCss()}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; }
body {
  font-family: 'Noto Sans Bengali', sans-serif;
  color: #1b2b28;
  font-size: 11pt;
  line-height: 1.5;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.page { width: 210mm; height: 296mm; padding: 9mm; overflow: hidden; }
.frame {
  height: 100%;
  border: 0.6mm solid #0f5c4d;
  outline: 0.25mm solid #d9a441;
  outline-offset: -2mm;
  padding: 8mm 11mm 9mm;
  display: flex;
  flex-direction: column;
}
header { display: flex; align-items: center; gap: 5mm; }
header .logo { width: 26mm; height: 26mm; object-fit: contain; flex: none; }
header .spacer { width: 26mm; flex: none; }
header .org { flex: 1; text-align: center; }
header h1 { margin: 0; font-size: 21pt; line-height: 1.3; color: #0f5c4d; font-weight: 700; }
header p { margin: 1mm 0 0; font-size: 10pt; color: #44564f; }
.title {
  margin: 5mm 0 7mm;
  background: #0f5c4d;
  color: #fff;
  text-align: center;
  font-size: 14pt;
  font-weight: 700;
  padding: 2mm 0;
  border-radius: 1.5mm;
  border-bottom: 1mm solid #d9a441;
}
.top { display: flex; gap: 8mm; align-items: flex-start; }
.top .fields { flex: 1; min-width: 0; }
.photo { flex: none; width: 36mm; text-align: center; }
.photo .frame-img {
  width: 36mm; height: 46mm;
  border: 0.4mm solid #0f5c4d;
  padding: 0.8mm;
  background: #fff;
}
.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.photo span { display: block; margin-top: 1.2mm; font-size: 9pt; color: #44564f; }
.row { display: flex; align-items: flex-start; gap: 3mm; margin-bottom: 4.6mm; }
.row .l { flex: none; width: 37mm; font-weight: 700; color: #0f5c4d; font-size: 10.5pt; }
.row .v {
  flex: 1; min-width: 0;
  min-height: 7mm;
  padding: 0 1mm;
  border-bottom: 0.3mm dotted #6f817b;
  word-break: break-word;
  white-space: pre-wrap;
}
.top .row .l { width: 30mm; }
.note {
  margin-top: 3mm;
  padding: 3mm 4mm;
  background: #f3f7f5;
  border-left: 1.2mm solid #d9a441;
  font-size: 9.5pt;
  color: #33453f;
}
.sign { margin-top: auto; display: flex; justify-content: space-between; gap: 20mm; padding-top: 18mm; }
.sign div { flex: 1; text-align: center; border-top: 0.35mm solid #1b2b28; padding-top: 1.5mm; font-weight: 700; font-size: 10.5pt; }
</style>
</head>
<body>
<div class="page">
  <div class="frame">
    <header>
      <img class="logo" src="${images.logo}" alt="লোগো">
      <div class="org">
        <h1>${esc(data.orgName)}</h1>
        <p>${esc(data.orgAddress)}</p>
      </div>
      <div class="spacer"></div>
    </header>

    <div class="title">সদস্য নিবন্ধন ফর্ম</div>

    <section class="top">
      <div class="fields">
        ${row('সদস্যের নাম', data.name)}
        ${row('পিতার নাম', data.fatherName)}
        ${row('মাতার নাম', data.motherName)}
        ${row('সদস্য আইডি', data.memberId)}
        ${row('মোবাইল নম্বর', data.mobile)}
        ${row('জন্মতারিখ', fmtDate(data.dob))}
      </div>
      <div class="photo">
        <div class="frame-img"><img src="${images.photo}" alt="সদস্যের ছবি"></div>
        <span>সদস্যের ছবি</span>
      </div>
    </section>

    ${row('বর্তমান ঠিকানা', data.presentAddress)}
    ${row('স্থায়ী ঠিকানা', data.permanentAddress)}
    ${row('সদস্য হওয়ার তারিখ', fmtDate(data.joinDate))}

    <div class="note">
      আমি এই মর্মে ঘোষণা করছি যে, উপরে প্রদত্ত তথ্যসমূহ সম্পূর্ণ সত্য এবং আমি সংগঠনের গঠনতন্ত্র ও নিয়মাবলি মেনে চলতে অঙ্গীকারবদ্ধ।
    </div>

    <div class="sign">
      <div>সভাপতির স্বাক্ষর</div>
      <div>সম্পাদকের স্বাক্ষর</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

module.exports = { buildHtml, esc };
