import { resolveValue } from './utils.js';

// Phase 5: フォームへ自動入力
// 戻り値: 'ok' | 'inquiry_type_mismatch'
export async function fillForm(page, mappings, profile) {
  console.log('フォームへの入力を開始します...');

  // 姓・名どちらか一方しかない場合、そのフィールドにフルネームを入力する
  const hasLastName  = mappings.some(m => m.profileKey === 'lastName');
  const hasFirstName = mappings.some(m => m.profileKey === 'firstName');
  if (hasLastName && !hasFirstName) {
    mappings = mappings.map(m => m.profileKey === 'lastName'  ? { ...m, profileKey: 'fullName' } : m);
    console.log('  姓フィールドのみ検出: フルネームとして入力します');
  } else if (hasFirstName && !hasLastName) {
    mappings = mappings.map(m => m.profileKey === 'firstName' ? { ...m, profileKey: 'fullName' } : m);
    console.log('  名フィールドのみ検出: フルネームとして入力します');
  }

  // 問い合わせ種別として認識されたフィールドに「その他」がない場合はスキップ
  const inquiryField = mappings.find(m => m.profileKey === 'inquiryType');
  if (inquiryField?.options.length > 0) {
    const hasOther = inquiryField.options.some(o => /その他|other/i.test(o.text));
    if (!hasOther) {
      console.log('問い合わせ種別に「その他」がありません。この企業はスキップします。');
      return 'inquiry_type_mismatch';
    }
  }

  for (const field of mappings) {
    const isChoice = field.tag === 'select' || field.type === 'radio' || field.type === 'checkbox';

    try {
      if (!field.profileKey) {
        // profileKey 未解決の選択肢フィールド → 「その他」があれば選択
        if (isChoice) {
          await trySelectOther(page, field);
        }
        continue;
      }

      if (field.tag === 'select') {
        await fillSelect(page, field, profile);
      } else if (field.type === 'radio') {
        await fillRadio(page, field, profile);
      } else if (field.type === 'checkbox') {
        await fillCheckbox(page, field, profile);
      } else {
        const value = resolveValue(profile, field.profileKey, field);
        if (!value) {
          console.log(`  スキップ: [${field.label || field.name}] (プロフィール未入力)`);
          continue;
        }
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

// 「その他」を選択できれば選択する（profileKey 未解決フィールド用）
async function trySelectOther(page, field) {
  const otherOption = field.options.find(o => /その他|other/i.test(o.text));
  if (!otherOption) return;

  const label = field.label || field.name || field.id || '不明';
  if (field.tag === 'select') {
    await page.selectOption(field.selector, { value: otherOption.value });
    console.log(`  入力: [${label}] → 「その他」を選択 (未認識フィールド)`);
  } else if (field.type === 'radio') {
    await page.click(otherOption.selector);
    console.log(`  入力: [${label}] → 「その他」を選択 (radio / 未認識フィールド)`);
  } else if (field.type === 'checkbox') {
    await page.check(otherOption.selector);
    console.log(`  入力: [${label}] → 「その他」にチェック (checkbox / 未認識フィールド)`);
  }
}

// select 要素への入力
async function fillSelect(page, field, profile) {
  // inquiryType または「その他」が選択肢にある場合は「その他」を優先
  const otherOption = field.options.find(o => /その他|other/i.test(o.text));
  if (field.profileKey === 'inquiryType') {
    if (otherOption) {
      await page.selectOption(field.selector, { value: otherOption.value });
      console.log(`  入力: [${field.label || field.name}] → 「その他」を選択`);
    }
    return;
  }

  const value = resolveValue(profile, field.profileKey, field);
  if (!value) {
    console.log(`  スキップ: [${field.label || field.name}] (プロフィール未入力)`);
    return;
  }

  // テキストで部分一致する選択肢を探す
  const matched = field.options.find(o =>
    o.text.includes(value) || o.value === value
  );
  if (matched) {
    await page.selectOption(field.selector, { value: matched.value });
    console.log(`  入力: [${field.label || field.name}] → 「${matched.text}」`);
  } else {
    console.log(`  スキップ: [${field.label || field.name}] (一致する選択肢なし: "${value}")`);
  }
}

// radio グループへの入力
async function fillRadio(page, field, profile) {
  const otherOption = field.options.find(o => /その他|other/i.test(o.text));
  if (field.profileKey === 'inquiryType') {
    if (otherOption) {
      await page.click(otherOption.selector);
      console.log(`  入力: [${field.label || field.name}] → 「その他」を選択 (radio)`);
    }
    return;
  }

  const value = resolveValue(profile, field.profileKey, field);
  if (!value) {
    console.log(`  スキップ: [${field.label || field.name}] (プロフィール未入力)`);
    return;
  }

  const matched = field.options.find(o =>
    o.text.includes(value) || o.value === value
  );
  if (matched) {
    await page.click(matched.selector);
    console.log(`  入力: [${field.label || field.name}] → 「${matched.text}」 (radio)`);
  } else {
    console.log(`  スキップ: [${field.label || field.name}] (一致する選択肢なし: "${value}")`);
  }
}

// checkbox グループへの入力
async function fillCheckbox(page, field, profile) {
  const otherOption = field.options.find(o => /その他|other/i.test(o.text));
  if (field.profileKey === 'inquiryType' || otherOption) {
    if (otherOption) {
      await page.check(otherOption.selector);
      console.log(`  入力: [${field.label || field.name}] → 「その他」にチェック (checkbox)`);
    }
    return;
  }

  console.log(`  スキップ: [${field.label || field.name}] (checkbox は未対応)`);
}
