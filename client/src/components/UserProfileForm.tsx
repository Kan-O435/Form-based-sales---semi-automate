import type { UserProfile } from '../types'

interface Props {
  profile: UserProfile
  onChange: (profile: UserProfile) => void
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">
        {label}
        {hint && <span className="ml-1 text-gray-400">({hint})</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-5 mb-3 border-b border-gray-100 pb-1">
      {children}
    </h3>
  )
}

export default function UserProfileForm({ profile, onChange }: Props) {
  const set = (key: keyof UserProfile) => (value: string) =>
    onChange({ ...profile, [key]: value })

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-600">送信者プロフィール</h2>

      {/* 名前 */}
      <SectionTitle>名前</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Field label="姓" value={profile.lastName} onChange={set('lastName')} placeholder="山田" />
        <Field label="名" value={profile.firstName} onChange={set('firstName')} placeholder="太郎" />
      </div>

      {/* ふりがな */}
      <SectionTitle>ふりがな</SectionTitle>
      <p className="text-xs text-gray-400 mb-2">ひらがなで入力。カタカナへの変換は自動対応します。</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="姓（ふりがな）" value={profile.lastNameKana} onChange={set('lastNameKana')} placeholder="やまだ" />
        <Field label="名（ふりがな）" value={profile.firstNameKana} onChange={set('firstNameKana')} placeholder="たろう" />
      </div>

      {/* 連絡先 */}
      <SectionTitle>連絡先</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Field label="メールアドレス" value={profile.email} onChange={set('email')} type="email" placeholder="taro@example.com" />
        <Field label="電話番号" value={profile.phone} onChange={set('phone')} type="tel" placeholder="090-1234-5678" hint="ハイフンあり" />
      </div>

      {/* 会社情報 */}
      <SectionTitle>会社情報</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Field label="会社名" value={profile.company} onChange={set('company')} placeholder="株式会社○○" />
        <Field label="部署" value={profile.department} onChange={set('department')} placeholder="営業部" />
        <Field label="役職" value={profile.position} onChange={set('position')} placeholder="営業担当" />
      </div>

      {/* 住所 */}
      <SectionTitle>住所</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Field label="郵便番号" value={profile.postalCode} onChange={set('postalCode')} placeholder="123-4567" hint="ハイフンあり" />
        <Field label="都道府県" value={profile.prefecture} onChange={set('prefecture')} placeholder="東京都" />
        <Field label="市区町村" value={profile.city} onChange={set('city')} placeholder="渋谷区" />
        <Field label="番地" value={profile.address1} onChange={set('address1')} placeholder="道玄坂1-2-3" />
        <div className="col-span-2">
          <Field label="建物名・部屋番号" value={profile.address2} onChange={set('address2')} placeholder="○○ビル3F（任意）" />
        </div>
      </div>

      {/* 問い合わせ内容 */}
      <SectionTitle>問い合わせ内容</SectionTitle>
      <p className="text-xs text-gray-400 mb-2">
        問い合わせ種別は「その他」を自動選択します。選択肢がない場合は送信をスキップします。
      </p>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">テンプレートメッセージ</label>
        <textarea
          value={profile.message}
          onChange={(e) => onChange({ ...profile, message: e.target.value })}
          rows={5}
          placeholder="初めてご連絡いたします。..."
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
    </div>
  )
}
