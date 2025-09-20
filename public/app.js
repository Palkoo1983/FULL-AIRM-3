const i18n = { hu: null, en: null };
let currentLang = 'hu';

async function loadI18n(lang) {
  if (!i18n[lang]) {
    const r = await fetch(`./i18n/${lang}.json`);
    i18n[lang] = await r.json();
  }
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = i18n[lang][key] || el.textContent;
  });
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLang = btn.dataset.lang;
    loadI18n(currentLang);
  });
});

loadI18n(currentLang);

const form = document.getElementById('uploadForm');
const resultEl = document.getElementById('result');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  resultEl.textContent = i18n[currentLang]?.uploading || 'Feltöltés...';

  const fd = new FormData(form);
  const r = await fetch('/upload', { method: 'POST', body: fd });
  const data = await r.json();

  if (data?.ok) {
    resultEl.textContent = (i18n[currentLang]?.result_ok || 'Eredmény') + ': ' + data.result;
  } else {
    resultEl.textContent = (i18n[currentLang]?.result_err || 'Hiba') + ': ' + (data?.error || 'Ismeretlen hiba');
  }
});
