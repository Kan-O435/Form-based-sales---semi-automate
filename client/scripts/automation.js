import { chromium } from 'playwright';
import { DONE } from './constants.js';
import { findOfficialSiteUrl } from './browserSearch.js';
import { findContactPageUrl } from './contactFinder.js';
import { detectBlock } from './blockDetector.js';
import { analyzeForm } from './formAnalyzer.js';
import { fillForm } from './formFiller.js';
import { trySubmit } from './formSubmitter.js';

const companyName = process.argv[2] ?? '';
const profile = JSON.parse(process.argv[3] ?? '{}');

async function run() {
  if (!companyName) {
    console.log('エラー: 会社名が指定されていません');
    console.log(DONE.UNKNOWN_ERROR);
    process.exit(1);
  }

  console.log('ブラウザを起動中...');
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const waitForClose = () => new Promise(resolve => browser.on('disconnected', resolve));

  const page = await browser.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  let keepOpen = false;

  try {
    // Phase 2: Google検索 → 公式サイト
    const siteUrl = await findOfficialSiteUrl(page, `${companyName} 公式サイト`);
    if (!siteUrl) {
      console.log(`「${companyName}」の公式サイトが見つかりませんでした`);
      console.log(DONE.NO_CONTACT_PAGE);
      return;
    }

    console.log(`公式サイトを発見: ${siteUrl}`);
    await page.goto(siteUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // SPA（React/Vue/Nuxt等）対応: JSによる描画が完了するまで待つ
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    console.log(`公式サイト取得完了: ${await page.title()}`);

    // 公式サイトでのブロック検知
    const siteBlock = await detectBlock(page);
    if (siteBlock === 'cloudflare') {
      console.log('Cloudflare によるブロックを検出しました。タブを保持します。');
      console.log(DONE.CLOUDFLARE_BLOCKED);
      keepOpen = true;
      return;
    }
    if (siteBlock === 'captcha') {
      console.log('CAPTCHA を検出しました。タブを保持します。');
      console.log(DONE.CAPTCHA_DETECTED);
      keepOpen = true;
      return;
    }

    // Phase 3: お問い合わせページを発見
    const contactUrl = await findContactPageUrl(page);
    if (!contactUrl) {
      console.log('お問い合わせページが見つかりませんでした');
      console.log(DONE.NO_CONTACT_PAGE);
      return;
    }

    console.log('お問い合わせページへ移動中...');
    await page.goto(contactUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // SPA対応: JSによる描画が完了するまで待つ
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    console.log(`お問い合わせページ取得完了: ${await page.title()}`);

    // お問い合わせページでのブロック検知
    const contactBlock = await detectBlock(page);
    if (contactBlock === 'cloudflare') {
      console.log('Cloudflare によるブロックを検出しました。タブを保持します。');
      console.log(DONE.CLOUDFLARE_BLOCKED);
      keepOpen = true;
      return;
    }
    if (contactBlock === 'captcha') {
      console.log('CAPTCHA を検出しました。タブを保持します。');
      console.log(DONE.CAPTCHA_DETECTED);
      keepOpen = true;
      return;
    }

    // Phase 4: フォーム解析
    let mappings;
    try {
      mappings = await analyzeForm(page);
    } catch (e) {
      console.log(`フォーム解析エラー: ${e.message}`);
      console.log(DONE.FORM_PARSE_FAILED);
      return;
    }
    console.log(`マッピング完了: ${mappings.filter(m => m.profileKey).length}/${mappings.length} フィールドを認識`);

    // Phase 5: フォーム入力
    const fillResult = await fillForm(page, mappings, profile);
    if (fillResult === 'inquiry_type_mismatch') {
      console.log(DONE.INQUIRY_TYPE_MISMATCH);
      return;
    }

    // Phase 6: フォーム送信
    const submitResult = await trySubmit(page);

    if (submitResult === 'success') {
      console.log(DONE.SUCCESS);
      return;
    }

    if (submitResult === 'validation_failed') {
      console.log('入力内容にエラーがあります。タブを保持します。手動で確認してください。');
      console.log(DONE.VALIDATION_FAILED);
      keepOpen = true;
      return;
    }

    // submit_failed
    console.log('送信に失敗しました。タブを保持します。手動で送信してください。');
    console.log(DONE.SUBMIT_FAILED);
    keepOpen = true;

  } catch (e) {
    console.log(`エラー発生: ${e.message}`);
    console.log(DONE.UNKNOWN_ERROR);
    keepOpen = true;
  } finally {
    if (keepOpen) {
      console.log('ブラウザを閉じると自動化が終了します。');
      await waitForClose();
    }
    try { await browser.close(); } catch { /* 既に閉じられている */ }
    console.log('ブラウザを終了しました');
  }
}

run();
