import { FIELD_RULES } from './constants.js';

// Phase 4: フォームを解析してフィールドマッピングを生成
export async function analyzeForm(page) {
  console.log('フォームを解析中...');

  // SPA対応: form要素が描画されるまで最大10秒待つ
  try {
    await page.waitForSelector('form', { timeout: 10000 });
  } catch {
    // form タグがない場合も input/textarea 単体で構成されるフォームがあるため続行
    console.log('  form タグなし。input/textarea を直接探します...');
    await page.waitForSelector('input:not([type="hidden"]):not([type="submit"]), textarea', { timeout: 5000 })
      .catch(() => { throw new Error('フォームが見つかりませんでした'); });
  }

  const rawFields = await page.evaluate(() => {
    const fieldSelector = 'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]), textarea, select';

    // form タグがある場合は最もフィールド数が多い form を対象にする
    const forms = Array.from(document.querySelectorAll('form'));
    let root = null;
    if (forms.length > 0) {
      let maxCount = 0;
      for (const form of forms) {
        const count = form.querySelectorAll(fieldSelector).length;
        if (count > maxCount) { maxCount = count; root = form; }
      }
    }

    // form タグがない場合はページ全体から input/textarea/select を探す
    const els = root
      ? Array.from(root.querySelectorAll(fieldSelector))
      : Array.from(document.querySelectorAll(fieldSelector));

    if (els.length === 0) return null;

    return els.map(el => {
      let labelText = '';
      if (el.id) {
        const lbl = document.querySelector(`label[for="${el.id}"]`);
        if (lbl) labelText = lbl.textContent.trim();
      }
      if (!labelText) {
        const parentLbl = el.closest('label');
        if (parentLbl) labelText = parentLbl.textContent.trim();
      }

      const options = el.tagName === 'SELECT'
        ? Array.from(el.options).map(o => ({ value: o.value, text: o.textContent.trim() }))
        : [];

      return {
        selector: el.id ? `#${el.id}` : el.name ? `[name="${el.name}"]` : el.tagName.toLowerCase(),
        tag: el.tagName.toLowerCase(),
        type: el.type || '',
        name: el.name || '',
        id: el.id || '',
        placeholder: el.placeholder || '',
        label: labelText,
        options,
      };
    });
  });

  if (!rawFields || rawFields.length === 0) throw new Error('フォームが見つかりませんでした');

  const mappings = rawFields.map(field => {
    const targets = [field.name, field.id, field.placeholder, field.label].join(' ').toLowerCase();
    const matched = FIELD_RULES.find(rule =>
      rule.patterns.some(p => targets.includes(p.toLowerCase()))
    );
    return { ...field, profileKey: matched?.key ?? null };
  });

  console.log(`フォームを発見しました（フィールド数: ${mappings.length}）`);
  for (const m of mappings) {
    const label = m.label || m.placeholder || m.name || m.id || '不明';
    const mapped = m.profileKey ? `→ ${m.profileKey}` : '→ (未対応)';
    const opts = m.options.length > 0 ? ` [${m.options.map(o => o.text).join(', ')}]` : '';
    console.log(`  [${label}] ${m.selector} ${mapped}${opts}`);
  }

  return mappings;
}
