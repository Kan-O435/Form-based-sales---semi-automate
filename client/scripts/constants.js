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
export const FIELD_RULES = [
  { key: 'lastName',      patterns: ['sei', '姓', 'last_name', 'lastname', '苗字'] },
  { key: 'firstName',     patterns: ['mei', 'first_name', 'firstname'] },
  { key: 'fullName',      patterns: ['name', '氏名', 'お名前', 'fullname', 'full_name'] },
  { key: 'lastNameKana',  patterns: ['seikana', 'sei_kana', 'last_kana'] },
  { key: 'firstNameKana', patterns: ['meikana', 'mei_kana', 'first_kana'] },
  { key: 'fullNameKana',  patterns: ['kana', 'furigana', 'ふりがな', 'フリガナ', 'yomi', 'ruby'] },
  { key: 'emailConfirm',  patterns: ['email_confirm', 'mail_confirm', 'confirm_mail', 'confirm_email', 'email_check', 'mail_check'] },
  { key: 'email',         patterns: ['mail', 'email', 'メール', 'e_mail'] },
  { key: 'phone',         patterns: ['tel', 'phone', '電話', 'fax'] },
  { key: 'company',       patterns: ['company', 'corp', '会社', '企業', 'organization'] },
  { key: 'department',    patterns: ['dept', 'department', '部署', '部門'] },
  { key: 'position',      patterns: ['position', '役職', 'title', 'post'] },
  { key: 'postalCode',    patterns: ['zip', 'postal', '郵便', 'yuubin'] },
  { key: 'prefecture',    patterns: ['prefecture', 'pref', '都道府県'] },
  { key: 'city',          patterns: ['city', 'town', '市区町村'] },
  { key: 'address1',      patterns: ['address', '住所', '番地', 'addr'] },
  { key: 'inquiryType',   patterns: ['type', 'category', '種別', '種類', 'inquiry_type'] },
  { key: 'message',       patterns: ['message', 'content', 'body', '内容', '本文', 'detail', 'memo'] },
];
