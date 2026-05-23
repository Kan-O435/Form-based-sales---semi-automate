// Phase 2: Google 検索 → 公式サイト URL を取得
export async function findOfficialSiteUrl(page, query) {
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
