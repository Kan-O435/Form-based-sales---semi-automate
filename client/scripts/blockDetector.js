// Cloudflare / CAPTCHA / ボット検知
export async function detectBlock(page) {
  try {
    const title = await page.title();
    if (/just a moment|cloudflare|checking your browser|attention required/i.test(title)) {
      return 'cloudflare';
    }

    return await page.evaluate(() => {
      if (
        document.querySelector('#challenge-form') ||
        document.querySelector('.cf-error-details') ||
        document.querySelector('[data-translate="challenge_headline"]') ||
        document.querySelector('meta[http-equiv="refresh"][content*="cloudflare"]')
      ) return 'cloudflare';

      if (
        document.querySelector('.g-recaptcha') ||
        document.querySelector('[data-sitekey]') ||
        document.querySelector('iframe[src*="recaptcha"]') ||
        document.querySelector('iframe[src*="hcaptcha"]')
      ) return 'captcha';

      return null;
    });
  } catch {
    return null;
  }
}
