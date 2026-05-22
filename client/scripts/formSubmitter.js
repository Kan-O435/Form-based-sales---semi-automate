// Phase 6: フォーム送信（確認ページ対応・最大2ステップ）
// 戻り値: 'success' | 'validation_failed' | 'submit_failed'
export async function trySubmit(page, attempt = 1) {
  if (attempt > 2) {
    console.log('送信ステップの上限に達しました');
    return 'submit_failed';
  }

  console.log(attempt === 1 ? '送信ボタンを探しています...' : '確認ページの送信ボタンを探しています...');

  // 送信ボタンを探す（優先順位順）
  const submitEl = await (async () => {
    // type="submit" を最優先
    for (const sel of ['button[type="submit"]', 'input[type="submit"]']) {
      const el = page.locator(sel).first();
      if (await el.count() > 0) return el;
    }
    // テキストベースのフォールバック
    const textCandidates = ['送信する', '送信', '確認する', '次へ進む', '次へ', 'Submit', 'Send', '申し込む'];
    for (const text of textCandidates) {
      const el = page.getByRole('button', { name: text, exact: true }).first();
      if (await el.count() > 0) return el;
    }
    // 部分一致フォールバック
    for (const text of ['送信', '確認', 'Submit']) {
      const el = page.locator(`button:has-text("${text}")`).first();
      if (await el.count() > 0) return el;
    }
    return null;
  })();

  if (!submitEl) {
    console.log('送信ボタンが見つかりませんでした');
    return 'submit_failed';
  }

  const urlBefore = page.url();
  console.log('送信ボタンをクリックします...');

  await submitEl.click();

  // ナビゲーションかDOMの安定を待つ
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  } catch { /* JS処理中の場合があるため無視 */ }

  // JSによるバリデーション処理が完了するまで少し待つ
  await new Promise(r => setTimeout(r, 1000));

  const currentUrl = page.url();
  const pageText = await page.evaluate(() => document.body?.innerText ?? '').catch(() => '');

  // 送信成功キーワードをチェック
  const successKeywords = [
    'ありがとう', 'ございます', 'thank',
    '完了', '送信しました', '受付', '送信完了', 'お問い合わせを受け付け',
    'complete', 'success',
  ];
  if (successKeywords.some(kw => pageText.toLowerCase().includes(kw.toLowerCase()))) {
    console.log('送信が完了しました');
    return 'success';
  }

  // URLが変わった場合は確認ページの可能性
  if (currentUrl !== urlBefore) {
    const hasNextSubmit = await page.evaluate(() =>
      !!(document.querySelector('button[type="submit"]') || document.querySelector('input[type="submit"]'))
    );
    if (hasNextSubmit) {
      console.log('確認ページを検出しました。送信を続行します...');
      return trySubmit(page, attempt + 1);
    }
    // URLが変わりフォームもなければ成功とみなす
    console.log('ページ遷移を確認しました（送信成功と判断）');
    return 'success';
  }

  // バリデーションエラーをチェック（同URLでフォームが残っている場合）
  const hasErrors = await page.evaluate(() => {
    const errSels = [
      '.error', '.alert-danger', '.form-error',
      '[class*="error"]:not(script):not(style)',
      '[aria-invalid="true"]', '.is-invalid',
    ];
    return errSels.some(sel => {
      try { return !!document.querySelector(sel); } catch { return false; }
    });
  });

  if (hasErrors) {
    console.log('バリデーションエラーが検出されました');
    return 'validation_failed';
  }

  return 'submit_failed';
}
