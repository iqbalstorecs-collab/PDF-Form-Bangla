(function () {
  'use strict';

  var form = document.getElementById('memberForm');
  var btn = document.getElementById('downloadBtn');
  var statusEl = document.getElementById('status');
  var logoData = null;
  var photoData = null;

  var MAX_ORIGINAL_BYTES = 10 * 1024 * 1024;
  var BTN_TEXT = 'পিডিএফ ডাউনলোড করুন';

  // আজকের তারিখ ডিফল্ট হিসেবে বসানো (স্থানীয় সময় অনুযায়ী)
  var now = new Date();
  var pad = function (n) { return String(n).padStart(2, '0'); };
  document.getElementById('joinDate').value = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());

  function setStatus(msg, type) {
    statusEl.textContent = msg || '';
    statusEl.className = 'status' + (type ? ' ' + type : '');
  }

  // ছবি ছোট করা: ছবির রেজোলিউশন ও অনুপাত ঠিক রেখে সর্বোচ্চ সাইড সীমিত করা হয়
  function processImage(file, maxSide, asPng) {
    return new Promise(function (resolve, reject) {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
        return reject(new Error('শুধু JPG, PNG বা WebP ছবি দিন।'));
      }
      if (file.size > MAX_ORIGINAL_BYTES) {
        return reject(new Error('ছবির সাইজ ১০ MB-এর বেশি।'));
      }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        var w = Math.round(img.naturalWidth * scale);
        var h = Math.round(img.naturalHeight * scale);
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        if (!asPng) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(asPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('ছবিটি পড়া যায়নি।'));
      };
      img.src = url;
    });
  }

  function bindImage(inputId, previewId, maxSide, asPng, setter) {
    var input = document.getElementById(inputId);
    var preview = document.getElementById(previewId);
    var fallback = preview.getAttribute('src');
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) { setter(null); preview.src = fallback; return; }
      processImage(file, maxSide, asPng).then(function (data) {
        setter(data);
        preview.src = data;
        setStatus('');
      }).catch(function (e) {
        input.value = '';
        setter(null);
        preview.src = fallback;
        setStatus(e.message, 'error');
      });
    });
  }

  bindImage('logoInput', 'logoPreview', 500, true, function (d) { logoData = d; });
  bindImage('photoInput', 'photoPreview', 900, false, function (d) { photoData = d; });

  // স্থায়ী ঠিকানা = বর্তমান ঠিকানা
  var present = document.getElementById('presentAddress');
  var permanent = document.getElementById('permanentAddress');
  var same = document.getElementById('sameAddress');
  function syncAddress() {
    if (same.checked) { permanent.value = present.value; permanent.readOnly = true; }
    else { permanent.readOnly = false; }
  }
  same.addEventListener('change', syncAddress);
  present.addEventListener('input', function () { if (same.checked) permanent.value = present.value; });

  var FIELDS = ['orgName', 'orgAddress', 'name', 'fatherName', 'motherName', 'memberId', 'mobile', 'dob', 'presentAddress', 'permanentAddress', 'joinDate'];

  function validate() {
    var firstBad = null;
    FIELDS.forEach(function (id) {
      var el = document.getElementById(id);
      var bad = !el.value.trim();
      el.classList.toggle('invalid', bad);
      if (bad && !firstBad) firstBad = el;
    });
    return firstBad;
  }

  form.addEventListener('input', function (e) { e.target.classList && e.target.classList.remove('invalid'); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = validate();
    if (bad) {
      setStatus('লাল চিহ্নিত ঘরগুলো পূরণ করুন।', 'error');
      bad.focus();
      return;
    }

    var payload = { logo: logoData, photo: photoData };
    FIELDS.forEach(function (id) { payload[id] = document.getElementById(id).value; });

    btn.disabled = true;
    btn.textContent = 'পিডিএফ তৈরি হচ্ছে...';
    setStatus('অনুগ্রহ করে অপেক্ষা করুন। প্রথমবার ৩০–৬০ সেকেন্ড লাগতে পারে।');

    fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (j) {
          throw new Error(j.error || 'PDF তৈরি করা যায়নি।');
        });
      }
      return res.blob();
    }).then(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'সদস্য-নিবন্ধন-ফর্ম.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
      setStatus('পিডিএফ ডাউনলোড হয়েছে।', 'ok');
    }).catch(function (err) {
      setStatus(err.message || 'কিছু একটা সমস্যা হয়েছে।', 'error');
    }).then(function () {
      btn.disabled = false;
      btn.textContent = BTN_TEXT;
    });
  });
})();
