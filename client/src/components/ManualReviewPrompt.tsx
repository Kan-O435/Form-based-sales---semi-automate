import type { CompanyStatus } from '../types'

interface Props {
  companyName: string
  status: CompanyStatus
  onConfirm: (outcome: 'success' | 'skipped') => void
}

function statusMessage(status: CompanyStatus): string {
  switch (status) {
    case 'no_contact_page':
      return 'お問い合わせページが自動検出できませんでした。Chromium でサイトを確認し、フォームがあれば手動で送信してください。'
    case 'inquiry_type_mismatch':
      return '問い合わせ種別が合致しませんでした。Chromium でフォームを確認し、手動で送信できるか確認してください。'
    case 'cloudflare_blocked':
      return 'Cloudflare によるブロックが検出されました。Chromium でブロックを解除して手動送信してください。'
    case 'captcha_detected':
      return 'CAPTCHA が検出されました。Chromium で CAPTCHA を解いて手動送信してください。'
    case 'validation_failed':
      return '入力値バリデーションエラーが発生しました。Chromium でエラーを確認し、手動で修正・送信してください。'
    case 'submit_failed':
    case 'form_parse_failed':
      return 'フォームの自動送信に失敗しました。Chromium でフォームを確認し、手動で送信してください。'
    default:
      return '予期しないエラーが発生しました。Chromium でページを確認し、手動で対応してください。'
  }
}

export default function ManualReviewPrompt({ companyName, status, onConfirm }: Props) {
  return (
    <div className="mt-4 p-5 bg-yellow-50 border-2 border-yellow-400 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
        <p className="text-sm font-bold text-yellow-800">手動対応が必要です</p>
      </div>
      <p className="text-sm text-yellow-700 mb-4">
        <span className="font-semibold">{companyName}</span>：{statusMessage(status)}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => onConfirm('success')}
          className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-sm font-bold rounded-lg transition"
        >
          ○ 送信できた
        </button>
        <button
          onClick={() => onConfirm('skipped')}
          className="flex-1 py-2.5 bg-red-400 hover:bg-red-500 active:bg-red-600 text-white text-sm font-bold rounded-lg transition"
        >
          × 送信できなかった
        </button>
      </div>
    </div>
  )
}
