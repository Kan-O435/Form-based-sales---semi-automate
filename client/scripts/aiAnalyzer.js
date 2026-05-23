import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const VALID_KEYS = [
  'lastName', 'firstName', 'fullName',
  'lastNameKana', 'firstNameKana', 'fullNameKana',
  'email', 'emailConfirm',
  'phone', 'company', 'department', 'position',
  'postalCode', 'prefecture', 'city', 'address1',
  'subject', 'inquiryType', 'message',
];

// ─────────────────────────────────────────────
// 1. お問い合わせページの URL を LLM で選択する
//    keyword スコアが低い / 候補なしのときに呼ぶ
// ─────────────────────────────────────────────
export async function selectContactUrl(links, pageTitle) {
  if (links.length === 0) return null;

  const linkList = links
    .map((l, i) => `[${i}] "${l.text}" → ${l.url}`)
    .join('\n');

  const prompt = `
あなたはWebサイト分析アシスタントです。
以下のリンク一覧から、企業への「お問い合わせ・コンタクトフォーム」に最も近いURLを1つ選んでください。

ページタイトル: ${pageTitle}

リンク一覧:
${linkList}

# 選ぶ基準
- お問い合わせ / 問合せ / contact / inquiry / コンタクト / ご相談 / 資料請求 に関するページ
- メールフォームや入力フォームがある可能性が高いページ
- 採用・ニュース・製品紹介・ブログなどは選ばない

# 出力形式（JSONのみ・他テキスト不要）
見つかった場合: {"index": 2}
見つからない場合: {"index": null}
`.trim();

  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    });
    const parsed = JSON.parse(res.choices[0].message.content);
    if (parsed.index !== null && parsed.index !== undefined) {
      const chosen = links[Number(parsed.index)];
      if (chosen) {
        console.log(`  AI選択: "${chosen.text}" → ${chosen.url}`);
        return chosen.url;
      }
    }
    return null;
  } catch (e) {
    console.log(`  AI(contactPage)エラー: ${e.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// 2. フォームの HTML を丸ごと解析して全フィールドを分類する
//    認識済みフィールドが少ない場合に呼ぶ
// ─────────────────────────────────────────────
export async function analyzeFormFromHtml(formHtml, existingFields) {
  // HTML が大きすぎる場合は先頭6000文字に絞る
  const html = formHtml.length > 6000
    ? formHtml.slice(0, 6000) + '\n<!-- truncated -->'
    : formHtml;

  const fieldList = existingFields
    .map((f, i) => {
      const info = [f.name, f.id, f.label, f.placeholder].filter(Boolean).join(' | ');
      return `[${i}] type=${f.type || f.tag} info="${info}" current=${f.profileKey ?? '未解決'}`;
    })
    .join('\n');

  const prompt = `
あなたはWebフォーム解析の専門家です。
以下のフォームHTMLと現在の解析結果を見て、各フィールドが何の入力欄かを判定してください。

# フォームHTML
${html}

# 現在の解析結果（未解決のものを解決してください）
${fieldList}

# 使用可能なプロフィールキー
lastName（姓）, firstName（名）, fullName（氏名）,
lastNameKana（姓かな）, firstNameKana（名かな）, fullNameKana（氏名かな）,
email（メールアドレス）, emailConfirm（メール確認）,
phone（電話番号）, company（会社名）, department（部署）, position（役職）,
postalCode（郵便番号）, prefecture（都道府県）, city（市区町村）, address1（番地）,
subject（件名）, inquiryType（問い合わせ種別の選択肢）, message（本文）,
null（上記以外・無視してよいフィールド）

# 出力形式（JSONのみ・全インデックスを含めること）
{"0": "fullName", "1": "email", "2": "message", "3": null}
`.trim();

  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    });
    const parsed = JSON.parse(res.choices[0].message.content);

    const result = {};
    for (const [idx, key] of Object.entries(parsed)) {
      result[Number(idx)] = VALID_KEYS.includes(key) ? key : null;
    }
    return result;
  } catch (e) {
    console.log(`  AI(formHtml)エラー: ${e.message}`);
    return {};
  }
}

// ─────────────────────────────────────────────
// 3. 送信ボタンのセレクタを LLM で特定する
//    通常の検索でボタンが見つからないときに呼ぶ
// ─────────────────────────────────────────────
export async function findSubmitSelector(pageHtml) {
  const html = pageHtml.length > 5000
    ? pageHtml.slice(0, 5000) + '\n<!-- truncated -->'
    : pageHtml;

  const prompt = `
以下のHTMLページから、フォームを送信するためのボタン・リンクを特定してください。

# HTML
${html}

# 出力形式（JSONのみ）
見つかった場合: {"selector": "button#submit", "text": "送信する"}
見つからない場合: {"selector": null, "text": null}
`.trim();

  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    });
    const parsed = JSON.parse(res.choices[0].message.content);
    return parsed.selector ?? null;
  } catch (e) {
    console.log(`  AI(submitSelector)エラー: ${e.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// 4. 未解決フィールドのみをメタデータで分類する（既存）
// ─────────────────────────────────────────────
export async function classifyUnknownFields(fields) {
  if (fields.length === 0) return {};

  const fieldDescriptions = fields.map((f, i) => {
    const parts = [
      `[${i}]`,
      f.name        ? `name="${f.name}"`               : '',
      f.id          ? `id="${f.id}"`                   : '',
      f.label       ? `label="${f.label}"`             : '',
      f.placeholder ? `placeholder="${f.placeholder}"` : '',
      f.type        ? `type="${f.type}"`               : '',
      f.options.length > 0
        ? `options=[${f.options.map(o => o.text).join(', ')}]`
        : '',
    ].filter(Boolean).join(' ');
    return parts;
  }).join('\n');

  const prompt = `
あなたはWebフォームのフィールド分類アシスタントです。
以下のフォームフィールド情報を見て、各フィールドが何の入力欄かを判定してください。

# 使用可能なキー
lastName, firstName, fullName, lastNameKana, firstNameKana, fullNameKana,
email, emailConfirm, phone, company, department, position,
postalCode, prefecture, city, address1, subject, inquiryType, message, null

# フィールド一覧
${fieldDescriptions}

# 出力形式（JSONのみ）
{"0": "fullName", "1": "email", "2": null}
`.trim();

  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    });
    const parsed = JSON.parse(res.choices[0].message.content);

    const result = {};
    for (const [idx, key] of Object.entries(parsed)) {
      result[Number(idx)] = VALID_KEYS.includes(key) ? key : null;
    }
    return result;
  } catch (e) {
    console.log(`  AI(classify)エラー: ${e.message}`);
    return {};
  }
}
