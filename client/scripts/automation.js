import { chromium } from 'playwright';

const companyName = process.argv[2] ?? '';

// フィールド名 → プロフィールキーのルール定義
const FIELD_RULES = [
  { key: 'lastName',      patterns: ['sei', '姓', 'last_name', 'lastname', '苗字'] },
  { key: 'firstName',     patterns: ['mei', 'first_name', 'firstname'] },
  { key: 'fullName',      patterns: ['name', '氏名', 'お名前', 'fullname', 'full_name'] },
  { key: 'lastNameKana',  patterns: ['seikana', 'sei_kana', 'last_kana'] },
  { key: 'firstNameKana', patterns: ['meikana', 'mei_kana', 'first_kana'] },
  { key: 'fullNameKana',  patterns: ['kana', 'furigana', 'ふりがな', 'フリガナ', 'yomi', 'ruby'] },
  { key: 'email',         patterns: ['mail', 'email', 'メール', 'e_mail'] },
  { key: 'phone',         patterns: ['tel', 'phone', '電話', 'fax'] },
  { key: 'company',       patterns: ['company', 'corp', '会社', '企業', 'organization'] },
  { key: 'department',    patterns: ['dept', 'department', '部署', '部門'] },
  { key: 'position',      patterns: ['position', '役職', 'title', 'post'] },
  { key: 'postalCode',    patterns: ['zip', 'postal', '郵便', 'yuubin'] },
  { key: 'prefecture',    patterns: ['prefecture', 'pref', '都道府県'] },
  { key: 'city',          patterns: ['city', 'town', '市区町村'] },
  { key: 'address1',      patterns: ['address', '住所', '番地', 'addr'] },
  { key: 'inquiryType',   patterns: ['type', 'category', '種別', '種類', 'inquiry_type'] },
  { key: 'message',       patterns: ['message', 'content', 'body', '内容', '本文', 'detail', 'memo'] },
];

// Phase 2: Google 検索 → 公式サイト URL を取得
async function findOfficialSiteUrl(page, query) {
  console.log('Google を開いています...');
  await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });

  try {
    await page.locator('button:has-text("すべて同意")').click({ timeout: 2000 });
  } catch { /* ポップアップなし */ }

  console.log(`「${query}」で検索中...`);
  await page.fill('textarea[name="q"]', query);
  await page.keyboard.press('Enter');

  await page.waitForURL('**/search?**', { timeout: 10000 });
  await page.waitForLoadState('domcontentloaded');

  const skipDomains = [
    'google.', 'youtube.com', 'wikipedia.org',
    'twitter.com', 'facebook.com', 'instagram.com',
    'linkedin.com', 'note.com', 'ameblo.jp',
  ];

  return await page.evaluate((skipDomains) => {
    for (const a of document.querySelectorAll('a[href]')) {
      const href = a.href;
      if (!href.startsWith('http')) continue;
      if (skipDomains.some(d => href.includes(d))) continue;
      if (href.includes('/search?') || href.includes('webcache')) continue;
      return href;
    }
    return null;
  }, skipDomains);
}

// Phase 3: お問い合わせページをキーワードスコアリングで発見
async function findContactPageUrl(page) {
  console.log('お問い合わせページを探しています...');

  const KEYWORDS = [
    'お問い合わせ', 'お問合せ', 'お問合わせ',
    '問い合わせ', '問合せ', 'ご相談',
    '資料請求', 'コンタクト',
    'contact', 'inquiry', 'inquire',
  ];

  const candidates = await page.evaluate((keywords) => {
    const scored = [];
    for (const a of document.querySelectorAll('a[href]')) {
      const text = (a.textContent || '').trim();
      const href = a.href || '';
      if (!href || href.startsWith('javascript')) continue;

      let score = 0;
      for (const kw of keywords) {
        const kwLower = kw.toLowerCase();
        if (text.toLowerCase().includes(kwLower)) score += 2;
        if (href.toLowerCase().includes(kwLower)) score += 1;
      }
      if (score > 0) scored.push({ url: href, text: text.slice(0, 40), score });
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, 3);
  }, KEYWORDS);

  if (candidates.length === 0) return null;

  console.log(`候補: ${candidates.map(c => `"${c.text}"(${c.score}点)`).join(' / ')}`);
  return candidates[0].url;
}

// Phase 4: フォームを解析してフィールドマッピングを生成
async function analyzeForm(page) {
  console.log('フォームを解析中...');

  const rawFields = await page.evaluate(() => {
    // フィールド数が最も多い form を選択
    const forms = Array.from(document.querySelectorAll('form'));
    if (forms.length === 0) return null;

    let targetForm = forms[0];
    let maxCount = 0;
    for (const form of forms) {
      const count = form.querySelectorAll(
        'input:not([type="hidden"]), textarea, select'
      ).length;
      if (count > maxCount) { maxCount = count; targetForm = form; }
    }

    const selector = 'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]), textarea, select';

    return Array.from(targetForm.querySelectorAll(selector)).map(el => {
      // ラベルテキストを取得
      let labelText = '';
      if (el.id) {
        const lbl = document.querySelector(`label[for="${el.id}"]`);
        if (lbl) labelText = lbl.textContent.trim();
      }
      if (!labelText) {
        const parentLbl = el.closest('label');
        if (parentLbl) labelText = parentLbl.textContent.trim();
      }

      // select の選択肢を取得
      const options = el.tagName === 'SELECT'
        ? Array.from(el.options).map(o => ({ value: o.value, text: o.textContent.trim() }))
        : [];

      return {
        selector: el.id ? `#${el.id}` : el.name ? `[name="${el.name}"]` : el.tagName.toLowerCase(),
        tag: el.tagName.toLowerCase(),
        type: el.type || '',
        name: el.name || '',
        id: el.id || '',
        placeholder: el.placeholder || '',
        label: labelText,
        options,
      };
    });
  });

  if (!rawFields) throw new Error('フォームが見つかりませんでした');

  // Node.js 側でプロフィールキーにマッピング
  const mappings = rawFields.map(field => {
    const targets = [field.name, field.id, field.placeholder, field.label]
      .join(' ')
      .toLowerCase();

    const matched = FIELD_RULES.find(rule =>
      rule.patterns.some(p => targets.includes(p.toLowerCase()))
    );

    return { ...field, profileKey: matched?.key ?? null };
  });

  // 解析結果をログ出力
  console.log(`フォームを発見しました（フィールド数: ${mappings.length}）`);
  for (const m of mappings) {
    const label = m.label || m.placeholder || m.name || m.id || '不明';
    const mapped = m.profileKey ? `→ ${m.profileKey}` : '→ (未対応)';
    const opts = m.options.length > 0
      ? ` [選択肢: ${m.options.map(o => o.text).join(', ')}]`
      : '';
    console.log(`  [${label}] ${m.selector} ${mapped}${opts}`);
  }

  return mappings;
}

async function run() {
  if (!companyName) {
    console.log('エラー: 会社名が指定されていません');
    process.exit(1);
  }

  console.log('ブラウザを起動中...');
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = await browser.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    // --- Phase 2 ---
    const siteUrl = await findOfficialSiteUrl(page, `${companyName} 公式サイト`);
    if (!siteUrl) throw new Error(`「${companyName}」の公式サイトが見つかりませんでした`);

    console.log(`公式サイトを発見: ${siteUrl}`);
    await page.goto(siteUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log(`公式サイト取得完了: ${await page.title()}`);

    // --- Phase 3 ---
    const contactUrl = await findContactPageUrl(page);
    if (!contactUrl) throw new Error('お問い合わせページが見つかりませんでした');

    console.log('お問い合わせページへ移動中...');
    await page.goto(contactUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log(`お問い合わせページ取得完了: ${await page.title()}`);

    // --- Phase 4 ---
    const mappings = await analyzeForm(page);
    console.log(`マッピング完了: ${mappings.filter(m => m.profileKey).length}/${mappings.length} フィールドを認識`);

    await new Promise(r => setTimeout(r, 3000));
  } finally {
    await browser.close();
    console.log('ブラウザを終了しました');
  }
}

run().catch(err => {
  console.log(`エラー発生: ${err.message}`);
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
