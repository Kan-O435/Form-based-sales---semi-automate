import { resolveValue } from './utils.js';

// Phase 5: フォームへ自動入力
// 戻り値: 'ok' | 'inquiry_type_mismatch'
export async function fillForm(page, mappings, profile) {
  console.log('フォームへの入力を開始します...');

  // 問い合わせ種別に「その他」がない場合はスキップ
  const inquiryField = mappings.find(m => m.profileKey === 'inquiryType');
  if (inquiryField?.options.length > 0) {
    const hasOther = inquiryField.options.some(o => /その他|other/i.test(o.text));
    if (!hasOther) {
      console.log('問い合わせ種別に「その他」がありません。この企業はスキップします。');
      return 'inquiry_type_mismatch';
    }
  }

  for (const field of mappings) {
    if (!field.profileKey) continue;

    const value = resolveValue(profile, field.profileKey, field);
    if (!value) {
      console.log(`  スキップ: [${field.label || field.name}] (プロフィール未入力)`);
      continue;
    }

    try {
      if (field.tag === 'select') {
        const otherOption = field.options.find(o => /その他|other/i.test(o.text));
        if (otherOption) {
          await page.selectOption(field.selector, { value: otherOption.value });
          console.log(`  入力: [${field.label || field.name}] → 「その他」を選択`);
        }
      } else if (field.type === 'radio' || field.type === 'checkbox') {
        console.log(`  スキップ: [${field.label || field.name}] (radio/checkbox は未対応)`);
      } else {
        await page.fill(field.selector, value);
        console.log(`  入力: [${field.label || field.name}] → 「${value}」`);
      }
    } catch (e) {
      console.log(`  警告: [${field.label || field.name}] の入力に失敗しました (${e.message})`);
    }
  }

  console.log('フォームへの入力が完了しました');
  return 'ok';
}
