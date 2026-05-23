import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ルールベースで解決できなかったフィールドをAIで分類する
// 戻り値: profileKey の文字列 または null
const VALID_KEYS = [
  'lastName', 'firstName', 'fullName',
  'lastNameKana', 'firstNameKana', 'fullNameKana',
  'email', 'emailConfirm',
  'phone', 'company', 'department', 'position',
  'postalCode', 'prefecture', 'city', 'address1',
  'subject', 'inquiryType', 'message',
];

// 未解決フィールドをまとめてAIに投げ、profileKey を返す
export async function classifyUnknownFields(fields) {
  if (fields.length === 0) return {};

  const fieldDescriptions = fields.map((f, i) => {
    const parts = [
      `[${i}]`,
      f.name   ? `name="${f.name}"`        : '',
      f.id     ? `id="${f.id}"`            : '',
      f.label  ? `label="${f.label}"`      : '',
      f.placeholder ? `placeholder="${f.placeholder}"` : '',
      f.type   ? `type="${f.type}"`        : '',
      f.options.length > 0 ? `options=[${f.options.map(o => o.text).join(', ')}]` : '',
    ].filter(Boolean).join(' ');
    return parts;
  }).join('\n');

  const prompt = `
あなたはWebフォームのフィールド分類アシスタントです。
以下のフォームフィールド情報を見て、各フィールドが何の入力欄かを判定してください。

# 判定ルール
- 以下のキーのいずれかを返す。当てはまらない場合は null を返す。
- lastName（姓）, firstName（名）, fullName（氏名フルネーム）
- lastNameKana（姓ふりがな）, firstNameKana（名ふりがな）, fullNameKana（氏名ふりがな）
- email（メールアドレス）, emailConfirm（メールアドレス確認）
- phone（電話番号）
- company（会社名）, department（部署）, position（役職）
- postalCode（郵便番号）, prefecture（都道府県）, city（市区町村）, address1（番地以降の住所）
- subject（件名・タイトル）
- inquiryType（問い合わせ種別・カテゴリの選択）
- message（問い合わせ本文・メッセージ）
- null（上記以外）

# フィールド一覧
${fieldDescriptions}

# 出力形式
JSONのみで返すこと。他のテキストは不要。
{"0": "fullName", "1": "email", "2": null, ...}
`.trim();

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0].message.content;
    const parsed = JSON.parse(raw);

    // インデックス → profileKey のマップを返す
    const result = {};
    for (const [idx, key] of Object.entries(parsed)) {
      result[Number(idx)] = VALID_KEYS.includes(key) ? key : null;
    }
    return result;

  } catch (e) {
    console.log(`  AI分類エラー: ${e.message}`);
    return {};
  }
}
