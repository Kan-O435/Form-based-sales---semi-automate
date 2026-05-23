import { useState } from 'react'
import type { CompanyResult, CompanyStatus } from '../types'

const FAILED_STATUSES: CompanyStatus[] = [
  'submit_failed',
  'validation_failed',
  'form_parse_failed',
  'cloudflare_blocked',
  'captcha_detected',
  'unknown_error',
]

const STATUS_LABELS: Record<CompanyStatus, string> = {
  pending:               '待機中',
  running:               '実行中...',
  success:               '送信完了',
  no_contact_page:       'お問い合わせページなし',
  cloudflare_blocked:    'Cloudflare ブロック',
  captcha_detected:      'CAPTCHA 検出',
  form_parse_failed:     'フォーム解析失敗',
  submit_failed:         '送信失敗',
  validation_failed:     'バリデーションエラー',
  inquiry_type_mismatch: '種別不一致',
  unknown_error:         'エラー',
}

const STATUS_BADGE_COLOR: Partial<Record<CompanyStatus, string>> = {
  cloudflare_blocked: 'bg-orange-100 text-orange-600',
  captcha_detected:   'bg-orange-100 text-orange-600',
  submit_failed:      'bg-red-100 text-red-600',
  validation_failed:  'bg-yellow-100 text-yellow-700',
  form_parse_failed:  'bg-red-100 text-red-600',
  unknown_error:      'bg-gray-200 text-gray-600',
}

function lineColor(line: string): string {
  if (/^\[DONE:/.test(line))           return 'text-red-400 font-semibold'
  if (line.startsWith('[エラー]'))     return 'text-red-400'
  if (line.startsWith('エラー'))       return 'text-red-400'
  if (line.startsWith('タイムアウト')) return 'text-red-400'
  if (line.startsWith('  警告:'))      return 'text-yellow-400'
  if (line.startsWith('  スキップ:'))  return 'text-gray-500'
  if (line.startsWith('  入力:'))      return 'text-green-500'
  return 'text-gray-400'
}

interface CardProps {
  result: CompanyResult
  onMarkAsSent: (name: string) => void
}

function FailureCard({ result, onMarkAsSent }: CardProps) {
  const [open, setOpen] = useState(false)
  const badgeColor = STATUS_BADGE_COLOR[result.status] ?? 'bg-red-100 text-red-600'

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onMarkAsSent(result.name)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
        {/* 送信済みチェックボックス */}
        <label className="flex items-center gap-1.5 shrink-0 cursor-pointer group">
          <input
            type="checkbox"
            onChange={handleCheck}
            className="w-4 h-4 accent-green-600 cursor-pointer"
          />
          <span className="text-xs text-gray-400 group-hover:text-green-600 whitespace-nowrap">
            送信済み
          </span>
        </label>

        {/* 会社名 + ステータス（クリックでログ展開） */}
        <button
          className="flex-1 flex items-center gap-2 min-w-0 text-left"
          onClick={() => setOpen(v => !v)}
        >
          <span className="text-sm font-medium text-gray-800 truncate">{result.name}</span>
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${badgeColor}`}>
            {STATUS_LABELS[result.status]}
          </span>
          <span className="shrink-0 ml-auto text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* ログ全件表示 */}
      {open && (
        <div className="bg-gray-950 px-4 py-3">
          {result.logs.length === 0 ? (
            <p className="text-xs text-gray-500 font-mono">ログなし</p>
          ) : (
            result.logs.map((line, i) => (
              <p key={i} className={`text-xs font-mono leading-relaxed ${lineColor(line)}`}>
                &gt; {line}
              </p>
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  results: CompanyResult[]
  onMarkAsSent: (name: string) => void
}

export default function FailureDetails({ results, onMarkAsSent }: Props) {
  const failures = results.filter(r => FAILED_STATUSES.includes(r.status))
  if (failures.length === 0) return null

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-600 mb-1">
        対応できなかった企業
        <span className="ml-2 text-xs font-normal text-red-500">{failures.length} 社</span>
      </h2>
      <p className="text-xs text-gray-400 mb-3">
        手動で送信した企業は左のチェックボックスを押すと送信完了に移動します
      </p>
      <div className="space-y-2">
        {failures.map((r, i) => (
          <FailureCard key={i} result={r} onMarkAsSent={onMarkAsSent} />
        ))}
      </div>
    </div>
  )
}
