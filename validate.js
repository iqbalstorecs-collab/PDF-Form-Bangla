// ফর্মের ডাটা ও ছবি যাচাই (Validation)
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // ২ MB

class ValidationError extends Error {}

const TEXT_FIELDS = {
  orgName: { label: 'সংগঠনের নাম', max: 120 },
  orgAddress: { label: 'সংগঠনের ঠিকানা', max: 250 },
  name: { label: 'সদস্যের নাম', max: 100 },
  fatherName: { label: 'পিতার নাম', max: 100 },
  motherName: { label: 'মাতার নাম', max: 100 },
  memberId: { label: 'সদস্য আইডি', max: 30 },
  mobile: { label: 'মোবাইল নম্বর', max: 20 },
  presentAddress: { label: 'বর্তমান ঠিকানা', max: 250 },
  permanentAddress: { label: 'স্থায়ী ঠিকানা', max: 250 },
};

function cleanText(v) {
  // কন্ট্রোল ক্যারেক্টার বাদ, ফাঁকা জায়গা ছেঁটে ফেলা (ZWNJ/ZWJ বাংলার জন্য রাখা হয়েছে)
  return String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

function validDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function validateImage(dataUri, label) {
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUri);
  if (!m) throw new ValidationError(`${label}: শুধু JPG, PNG বা WebP ছবি দেওয়া যাবে।`);
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > MAX_IMAGE_BYTES) throw new ValidationError(`${label}: ছবির সাইজ ২ MB-এর বেশি।`);
  const isPng = buf.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const isJpg = buf.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  const isWebp = buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP';
  const ok = (m[1] === 'png' && isPng) || (m[1] === 'jpeg' && isJpg) || (m[1] === 'webp' && isWebp);
  if (!ok) throw new ValidationError(`${label}: ছবির ফাইলটি সঠিক নয়।`);
  return dataUri;
}

function validateForm(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('অনুরোধটি সঠিক নয়।');
  }
  const out = {};
  for (const [key, rule] of Object.entries(TEXT_FIELDS)) {
    const v = body[key];
    if (typeof v !== 'string' || !cleanText(v)) throw new ValidationError(`${rule.label} পূরণ করুন।`);
    out[key] = cleanText(v);
    if (out[key].length > rule.max) throw new ValidationError(`${rule.label} সর্বোচ্চ ${rule.max} অক্ষরের হতে পারবে।`);
  }
  if (!/^[+0-9০-৯][0-9০-৯\s-]{8,18}$/.test(out.mobile)) {
    throw new ValidationError('মোবাইল নম্বরটি সঠিক নয়।');
  }
  if (!validDate(body.dob)) throw new ValidationError('জন্মতারিখ সঠিক নয়।');
  if (!validDate(body.joinDate)) throw new ValidationError('সদস্য হওয়ার তারিখ সঠিক নয়।');
  out.dob = body.dob;
  out.joinDate = body.joinDate;

  const images = {};
  images.logo = body.logo ? validateImage(String(body.logo), 'লোগো') : null;
  images.photo = body.photo ? validateImage(String(body.photo), 'সদস্যের ছবি') : null;
  return { data: out, images };
}

module.exports = { validateForm, ValidationError };
