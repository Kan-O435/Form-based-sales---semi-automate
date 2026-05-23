import { selectContactUrl } from './aiAnalyzer.js';

// Phase 3: お問い合わせページをキーワードスコアリング → LLM で発見
export async function findContactPageUrl(page) {
  console.log('お問い合わせページを探しています...');

  const KEYWORDS = [
    'お問い合わせ', 'お問合せ', 'お問合わせ',
    '問い合わせ', '問合せ', 'ご相談',
    '資料請求', 'コンタクト', 'ご連絡',
    'contact', 'inquiry', 'inquire', 'support',
  ];

  const candidates = await page.evaluate((keywords) => {
    const scored = [];
    const seen = new Set();
    for (const a of document.querySelectorAll('a[href]')) {
      const text = (a.textContent || '').trim().replace(/\s+/g, ' ');
      const href = a.href || '';
      if (!href || href.startsWith('javascript') || seen.has(href)) continue;
      seen.add(href);

      let score = 0;
      for (const kw of keywords) {
        const kwLower = kw.toLowerCase();
        if (text.toLowerCase().includes(kwLower)) score += 2;
        if (href.toLowerCase().includes(kwLower)) score += 1;
      }
      // スコアなしでもリンク一覧に含める（LLM用）
      scored.push({ url: href, text: text.slice(0, 60), score });
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, 30);
  }, KEYWORDS);

  if (candidates.length === 0) {
    console.log('  リンクが見つかりませんでした');
    return null;
  }

  // スコアが十分高い候補があれば即採用
  const top = candidates[0];
  if (top.score >= 2) {
    console.log(`  キーワード一致: "${top.text}" (${top.score}点) → ${top.url}`);
    return top.url;
  }

  // スコアが低い場合は LLM に判断させる
  console.log(`  キーワードスコアが低いため (最高${top.score}点)、AIで候補を選択します...`);
  const pageTitle = await page.title().catch(() => '');
  const aiUrl = await selectContactUrl(candidates, pageTitle);
  if (aiUrl) return aiUrl;

  // それでも見つからなければ上位スコア候補を返す（最後の手段）
  if (top.score >= 1) {
    console.log(`  フォールバック: "${top.text}" → ${top.url}`);
    return top.url;
  }

  return null;
}
