export type CompanyStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'no_contact_page'
  | 'cloudflare_blocked'
  | 'captcha_detected'
  | 'form_parse_failed'
  | 'submit_failed'
  | 'validation_failed'
  | 'inquiry_type_mismatch'
  | 'unknown_error'

export interface CompanyResult {
  name: string
  status: CompanyStatus
  logs: string[]
}

export interface UserProfile {
  // 名前
  lastName: string
  firstName: string

  // ふりがな（ひらがな保存、自動化側でカタカナ変換）
  lastNameKana: string
  firstNameKana: string

  // 連絡先
  email: string           // ハイフンなし変換は自動化側で対応
  phone: string           // 例: 090-1234-5678（ハイフンあり保存）

  // 会社情報
  company: string
  department: string
  position: string

  // 住所
  postalCode: string      // 例: 123-4567
  prefecture: string      // 例: 東京都
  city: string            // 例: 渋谷区
  address1: string        // 例: 道玄坂1-2-3
  address2: string        // 例: ○○ビル3F（任意）

  // 問い合わせ
  subject: string
  message: string
}
