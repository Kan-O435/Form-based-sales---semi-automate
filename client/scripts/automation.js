import { chromium } from 'playwright';

const companyName = process.argv[2] ?? '';

async function run() {
  console.log('ブラウザを起動中...');
  const browser = await chromium.launch({ headless: false });

  console.log('新規ページを開いています...');
  const page = await browser.newPage();
  await page.goto('about:blank');

  console.log(`ブラウザの起動に成功しました`);
  console.log(`対象企業: ${companyName}`);

  // Phase 1 確認: 2秒間ウィンドウを表示してから閉じる
  await new Promise(r => setTimeout(r, 2000));

  await browser.close();
  console.log('完了');
}

run().catch(err => {
  process.stderr.write(`エラー: ${err.message}\n`);
  process.exit(1);
});
