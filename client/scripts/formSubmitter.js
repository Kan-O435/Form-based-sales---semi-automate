// Phase 6: フォーム送信（確認ページ対応・最大3ステップ）
// 戻り値: 'success' | 'validation_failed' | 'submit_failed'
export async function trySubmit(page, attempt = 1) {
  if (attempt > 3) {
    console.log('送信ステップの上限に達しました');
    return 'submit_failed';
  }

  const label = attempt === 1 ? '送信ボタンを探しています...' : `確認ページのボタンを探しています（ステップ ${attempt}）...`;
  console.log(label);

  const submitEl = await findSubmitButton(page, attempt);
  if (!submitEl) {
    console.log('送信ボタンが見つかりませんでした');
    return 'submit_failed';
  }

  const urlBefore = page.url();
  console.log('ボタンをクリックします...');
  await submitEl.click();

  // ナビゲーション・AJAX処理が完了するまで待つ
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 800));

  const currentUrl = page.url();
  const pageText   = await page.evaluate(() => document.body?.innerText ?? '').catch(() => '');

  // --- 成功判定 ---
  if (isSuccessPage(pageText)) {
    console.log('送信が完了しました');
    return 'success';
  }

  // --- 確認ページ判定（URL変化 OR 同URL上に確認コンテンツ出現）---
  const urlChanged        = currentUrl !== urlBefore;
  const hasConfirmContent = isConfirmationPage(pageText);
  const hasNextButton     = await hasSubmitButton(page);

  if ((urlChanged || hasConfirmContent) && hasNextButton) {
    console.log('確認ページを検出しました。送信を続行します...');
    return trySubmit(page, attempt + 1);
  }

  // URLが変わったがフォームがない → 成功とみなす
  if (urlChanged) {
    console.log('ページ遷移を確認しました（送信成功と判断）');
    return 'success';
  }

  // --- バリデーションエラー判定 ---
  const hasErrors = await detectValidationErrors(page);
  if (hasErrors) {
    console.log('バリデーションエラーが検出されました');
    return 'validation_failed';
  }

  return 'submit_failed';
}

// ステップに応じた送信ボタンを探す
// attempt 1: 「確認する」「次へ」を含む（フォーム送信 → 確認ページ遷移用）
// attempt 2以降: 「確認する」「次へ」を除外（確認ページ → 最終送信用）
async function findSubmitButton(page, attempt) {
  const isConfirmStep = attempt >= 2;

  // type="submit" / input[type="submit"] を最優先
  for (const sel of ['button[type="submit"]', 'input[type="submit"]']) {
    const el = page.locator(sel).first();
    if (await el.count() > 0) return el;
  }

  // テキストベースの候補（確認ステップでは「確認する」「次へ」を除く）
  const step1Texts  = ['送信する', '送信', '確認する', '確認画面へ', '次へ進む', '次へ', '申し込む', 'Submit', 'Send'];
  const step2Texts  = ['送信する', '送信', '確定する', '確定', '申し込む', 'Submit', 'Send'];
  const candidates  = isConfirmStep ? step2Texts : step1Texts;

  for (const text of candidates) {
    const el = page.getByRole('button', { name: text, exact: true }).first();
    if (await el.count() > 0) return el;
  }

  // 部分一致フォールバック（確認ステップでは「確認」ボタンは対象外）
  const partialTexts = isConfirmStep ? ['送信', 'Submit'] : ['送信', '確認', 'Submit'];
  for (const text of partialTexts) {
    const el = page.locator(`button:has-text("${text}")`).first();
    if (await el.count() > 0) return el;
  }

  return null;
}

// 送信ボタンが存在するかチェック（確認ページ判定用）
async function hasSubmitButton(page) {
  return page.evaluate(() => {
    const sels = [
      'button[type="submit"]', 'input[type="submit"]',
      'button:not([type="button"])',
    ];
    return sels.some(sel => !!document.querySelector(sel));
  });
}

// 成功ページのキーワード判定
function isSuccessPage(text) {
  const keywords = [
    'ありがとうございます', 'ありがとう', 'thank you', 'thanks',
    '送信が完了', '送信完了', '受け付けました', '受付完了', 'お問い合わせを受け付け',
    '完了しました', '送信しました', 'complete', 'success', '担当者よりご連絡',
  ];
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

// 確認ページのキーワード判定（同URL上での確認画面出現を検出）
function isConfirmationPage(text) {
  const keywords = [
    '入力内容の確認', 'ご入力内容の確認', '以下の内容で送信', '以下の内容でよろしいですか',
    '確認画面', '内容をご確認', '内容の確認', 'confirm your',
  ];
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

// バリデーションエラーの検出
async function detectValidationErrors(page) {
  return page.evaluate(() => {
    const selectors = [
      '.error', '.alert-danger', '.form-error',
      '[class*="error"]:not(script):not(style)',
      '[aria-invalid="true"]', '.is-invalid',
      '.mw_wp_form_error',   // MW WP Form
      '.wpcf7-not-valid-tip', // Contact Form 7
    ];
    return selectors.some(sel => {
      try { return !!document.querySelector(sel); } catch { return false; }
    });
  });
}
