// フロントエンドが完了を検知するためのステータスマーカー
export const DONE = {
  SUCCESS:               '[DONE:success]',
  NO_CONTACT_PAGE:       '[DONE:no_contact_page]',
  CLOUDFLARE_BLOCKED:    '[DONE:cloudflare_blocked]',
  CAPTCHA_DETECTED:      '[DONE:captcha_detected]',
  FORM_PARSE_FAILED:     '[DONE:form_parse_failed]',
  SUBMIT_FAILED:         '[DONE:submit_failed]',
  VALIDATION_FAILED:     '[DONE:validation_failed]',
  INQUIRY_TYPE_MISMATCH: '[DONE:inquiry_type_mismatch]',
  UNKNOWN_ERROR:         '[DONE:unknown_error]',
};

// フィールド → プロフィールキーのマッピングルール
// patterns は小文字で記述し、照合時に toLowerCase() で比較する
export const FIELD_RULES = [
  { key: 'lastName',      patterns: ['sei', '姓', 'last_name', 'lastname', '苗字', 'family_name', 'familyname', 'surname'] },
  { key: 'firstName',     patterns: ['mei', '名', 'first_name', 'firstname', 'given_name', 'givenname'] },
  { key: 'fullName',      patterns: ['name', '氏名', 'お名前', 'fullname', 'full_name', 'your-name', 'your_name', 'contactname'] },
  { key: 'lastNameKana',  patterns: ['seikana', 'sei_kana', 'last_kana', '姓（ふりがな）', '姓かな', '姓フリガナ'] },
  { key: 'firstNameKana', patterns: ['meikana', 'mei_kana', 'first_kana', '名（ふりがな）', '名かな', '名フリガナ'] },
  { key: 'fullNameKana',  patterns: ['kana', 'furigana', 'ふりがな', 'フリガナ', 'yomi', 'ruby', 'namekana', 'name_kana'] },
  { key: 'emailConfirm',  patterns: ['email_confirm', 'mail_confirm', 'confirm_mail', 'confirm_email', 'email_check', 'mail_check', 'email2', 'mail2', 'remail', 'retype'] },
  { key: 'email',         patterns: ['mail', 'email', 'メール', 'e_mail', 'e-mail', 'メールアドレス'] },
  { key: 'phone',         patterns: ['tel', 'phone', '電話', 'fax', 'phonenumber', 'phone_number', 'tel_number', '電話番号'] },
  { key: 'company',       patterns: ['company', 'corp', '会社', '企業', 'organization', 'organisation', '会社名', '企業名', 'companyname', 'company_name'] },
  { key: 'department',    patterns: ['dept', 'department', '部署', '部門', '所属', 'division'] },
  { key: 'position',      patterns: ['position', '役職', 'title', 'post', 'jobtitle', 'job_title', '役職名'] },
  { key: 'postalCode',    patterns: ['zip', 'postal', '郵便', 'yuubin', 'postcode', 'post_code', '郵便番号'] },
  { key: 'prefecture',    patterns: ['prefecture', 'pref', '都道府県', 'todofuken'] },
  { key: 'city',          patterns: ['city', 'town', '市区町村', 'municipality'] },
  { key: 'address1',      patterns: ['address', '住所', '番地', 'addr', '丁目', '番地以降'] },
  { key: 'inquiryType',   patterns: ['type', 'category', '種別', '種類', 'inquiry_type', 'contact_type', 'お問い合わせ種別', 'お問い合わせ種類', '問い合わせ種別', '問い合わせの種類', 'subject', '件名カテゴリ'] },
  { key: 'message',       patterns: ['message', 'content', 'body', '内容', '本文', 'detail', 'memo', 'お問い合わせ内容', '相談内容', 'inquiry', 'comment', 'remarks', 'note'] },
];
