// Phase 3: お問い合わせページをキーワードスコアリングで発見
export async function findContactPageUrl(page) {
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
