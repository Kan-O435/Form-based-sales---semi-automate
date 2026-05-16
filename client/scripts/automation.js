import { chromium } from 'playwright';

const companyName = process.argv[2] ?? '';

async function findOfficialSiteUrl(page, query) {
  console.log('Google を開いています...');
  await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });

  // 同意ポップアップが出た場合は閉じる
  try {
    await page.locator('button:has-text("すべて同意")').click({ timeout: 2000 });
  } catch {
    // ポップアップなし
  }

  console.log(`「${query}」で検索中...`);
  await page.fill('textarea[name="q"]', query);
  await page.keyboard.press('Enter');

  // URL が検索結果ページに変わるまで待つ（#search より安定）
  await page.waitForURL('**/search?**', { timeout: 10000 });
  await page.waitForLoadState('domcontentloaded');

  const skipDomains = [
    'google.', 'youtube.com', 'wikipedia.org',
    'twitter.com', 'facebook.com', 'instagram.com',
    'linkedin.com', 'note.com', 'ameblo.jp',
  ];

  // href を持つ全リンクから公式サイト候補を抽出
  const url = await page.evaluate((skipDomains) => {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    for (const a of anchors) {
      const href = a.href;
      if (!href.startsWith('http')) continue;
      if (skipDomains.some(d => href.includes(d))) continue;
      // Google 内部リンク・キャッシュリンクを除外
      if (href.includes('/search?') || href.includes('webcache')) continue;
      return href;
    }
    return null;
  }, skipDomains);

  return url;
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

  // webdriver フラグを隠してボット検知を回避
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    const url = await findOfficialSiteUrl(page, `${companyName} 公式サイト`);

    if (!url) {
      throw new Error(`「${companyName}」の公式サイトが見つかりませんでした`);
    }

    console.log(`公式サイトを発見: ${url}`);

    console.log('公式サイトへ移動中...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const title = await page.title();
    console.log(`サイト取得完了: ${title}`);

    await new Promise(r => setTimeout(r, 2000));
  } finally {
    await browser.close();
    console.log('ブラウザを終了しました');
  }
}

run().catch(err => {
  // stdout にも出力して UI で確認できるようにする
  console.log(`エラー発生: ${err.message}`);
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
