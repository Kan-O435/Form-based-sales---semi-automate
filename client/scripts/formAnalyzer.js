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
    // ラベルテキストを多角的に取得する
    function getLabel(el) {
      // 1. label[for="id"]
      if (el.id) {
        const lbl = document.querySelector(`label[for="${el.id}"]`);
        if (lbl) return lbl.textContent.trim();
      }
      // 2. 最も近い祖先 label
      const parentLbl = el.closest('label');
      if (parentLbl) return parentLbl.textContent.trim();
      // 3. aria-label 属性
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel) return ariaLabel;
      // 4. aria-labelledby が示す要素のテキスト
      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) {
        const texts = labelledBy.split(/\s+/)
          .map(id => document.getElementById(id)?.textContent.trim())
          .filter(Boolean);
        if (texts.length > 0) return texts.join(' ');
      }
      // 5. title 属性
      if (el.title) return el.title;
      // 6. 直前の兄弟要素からテキストを探す（span/p/dt/th/legend など）
      let prev = el.previousElementSibling;
      while (prev) {
        const tag = prev.tagName.toLowerCase();
        if (['label', 'span', 'p', 'dt', 'th', 'legend', 'div', 'strong', 'b'].includes(tag)) {
          const text = prev.textContent.trim();
          if (text && text.length < 60) return text;
        }
        prev = prev.previousElementSibling;
      }
      // 7. 親要素の直前兄弟（dl > dt/dd 構造 や table > tr > th/td 構造など）
      const parent = el.parentElement;
      if (parent) {
        const prevParent = parent.previousElementSibling;
        if (prevParent) {
          const text = prevParent.textContent.trim();
          if (text && text.length < 60) return text;
        }
      }
      // 8. 最も近い fieldset の legend
      const fieldset = el.closest('fieldset');
      if (fieldset) {
        const legend = fieldset.querySelector('legend');
        if (legend) return legend.textContent.trim();
      }
      return '';
    }

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

    const els = root
      ? Array.from(root.querySelectorAll(fieldSelector))
      : Array.from(document.querySelectorAll(fieldSelector));

    if (els.length === 0) return null;

    // radio / checkbox を name でグループ化し、それ以外は通常フィールドとして扱う
    const radioGroups   = new Map(); // name -> { firstEl, els[] }
    const checkboxGroups = new Map();
    const normalFields   = [];

    for (const el of els) {
      if (el.type === 'radio') {
        const key = el.name || el.id || '_radio_unnamed';
        if (!radioGroups.has(key)) radioGroups.set(key, { firstEl: el, els: [] });
        radioGroups.get(key).els.push(el);
      } else if (el.type === 'checkbox') {
        const key = el.name || el.id || '_checkbox_unnamed';
        if (!checkboxGroups.has(key)) checkboxGroups.set(key, { firstEl: el, els: [] });
        checkboxGroups.get(key).els.push(el);
      } else {
        normalFields.push(el);
      }
    }

    const result = [];

    // 通常フィールド（text / textarea / select など）
    for (const el of normalFields) {
      const labelText = getLabel(el);
      const options = el.tagName === 'SELECT'
        ? Array.from(el.options).map(o => ({ value: o.value, text: o.textContent.trim() }))
        : [];

      result.push({
        selector:    el.id ? `#${el.id}` : el.name ? `[name="${el.name}"]` : el.tagName.toLowerCase(),
        tag:         el.tagName.toLowerCase(),
        type:        el.type || '',
        name:        el.name || '',
        id:          el.id || '',
        placeholder: el.placeholder || '',
        label:       labelText,
        options,
      });
    }

    // radio グループ（グループ全体を1フィールドとして扱う）
    for (const [name, group] of radioGroups) {
      const { firstEl, els: radioEls } = group;
      // グループラベル: fieldset > legend 優先、なければ先頭ラジオのラベル
      const fieldset   = firstEl.closest('fieldset');
      const groupLabel = fieldset?.querySelector('legend')?.textContent.trim() || getLabel(firstEl);

      const options = radioEls.map(el => ({
        value:    el.value,
        text:     getLabel(el) || el.value,
        selector: el.id ? `#${el.id}` : `[name="${CSS.escape(name)}"][value="${CSS.escape(el.value)}"]`,
      }));

      result.push({
        selector:    `[name="${name}"]`,
        tag:         'input',
        type:        'radio',
        name,
        id:          firstEl.id || '',
        placeholder: '',
        label:       groupLabel,
        options,
      });
    }

    // checkbox グループ（inquiryType の複数選択などに備える）
    for (const [name, group] of checkboxGroups) {
      const { firstEl, els: checkboxEls } = group;
      const fieldset   = firstEl.closest('fieldset');
      const groupLabel = fieldset?.querySelector('legend')?.textContent.trim() || getLabel(firstEl);

      const options = checkboxEls.map(el => ({
        value:    el.value,
        text:     getLabel(el) || el.value,
        selector: el.id ? `#${el.id}` : `[name="${CSS.escape(name)}"][value="${CSS.escape(el.value)}"]`,
      }));

      result.push({
        selector:    `[name="${name}"]`,
        tag:         'input',
        type:        'checkbox',
        name,
        id:          firstEl.id || '',
        placeholder: '',
        label:       groupLabel,
        options,
      });
    }

    return result;
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
    const label   = m.label || m.placeholder || m.name || m.id || '不明';
    const mapped  = m.profileKey ? `→ ${m.profileKey}` : '→ (未対応)';
    const opts    = m.options.length > 0 ? ` [${m.options.map(o => o.text).join(', ')}]` : '';
    console.log(`  [${label}] ${m.selector} ${mapped}${opts}`);
  }

  return mappings;
}
