import { chromium } from 'playwright';

const companyName = process.argv[2] ?? '';

// Phase 2: Google 検索 → 公式サイト URL を取得
async function findOfficialSiteUrl(page, query) {
  console.log('Google を開いています...');
  await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });

  try {
    await page.locator('button:has-text("すべて同意")').click({ timeout: 2000 });
  } catch {
    // ポップアップなし
  }

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

  const url = await page.evaluate((skipDomains) => {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    for (const a of anchors) {
      const href = a.href;
      if (!href.startsWith('http')) continue;
      if (skipDomains.some(d => href.includes(d))) continue;
      if (href.includes('/search?') || href.includes('webcache')) continue;
      return href;
    }
    return null;
  }, skipDomains);

  return url;
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
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const scored = [];

    for (const a of anchors) {
      const text = (a.textContent || '').trim();
      const href = a.href || '';

      // ページ内アンカー・javascript リンクは除外
      if (!href || href.startsWith('javascript')) continue;

      let score = 0;
      for (const kw of keywords) {
        const kwLower = kw.toLowerCase();
        if (text.toLowerCase().includes(kwLower)) score += 2; // テキスト一致は強め
        if (href.toLowerCase().includes(kwLower)) score += 1; // URL 一致は弱め
      }

      if (score > 0) {
        scored.push({ url: href, text: text.slice(0, 40), score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3); // 上位 3 件を返す
  }, KEYWORDS);

  if (candidates.length === 0) return null;

  console.log(
    `候補: ${candidates.map(c => `"${c.text}"(${c.score}点)`).join(' / ')}`
  );

  return candidates[0].url;
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

    if (!siteUrl) {
      throw new Error(`「${companyName}」の公式サイトが見つかりませんでした`);
    }

    console.log(`公式サイトを発見: ${siteUrl}`);
    console.log('公式サイトへ移動中...');
    await page.goto(siteUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const siteTitle = await page.title();
    console.log(`公式サイト取得完了: ${siteTitle}`);

    // --- Phase 3 ---
    const contactUrl = await findContactPageUrl(page);

    if (!contactUrl) {
      throw new Error('お問い合わせページが見つかりませんでした');
    }

    console.log(`お問い合わせページへ移動中...`);
    await page.goto(contactUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const contactTitle = await page.title();
    console.log(`お問い合わせページ取得完了: ${contactTitle}`);

    await new Promise(r => setTimeout(r, 2000));
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
