import type { CompanyResult, CompanyStatus } from '../types'

const STATUS_LABELS: Record<CompanyStatus, string> = {
  pending:               '待機中',
  running:               '実行中...',
  success:               '送信完了',
  no_contact_page:       'お問い合わせページなし',
  cloudflare_blocked:    'Cloudflare ブロック（手動対応）',
  captcha_detected:      'CAPTCHA 検出（手動対応）',
  form_parse_failed:     'フォーム解析失敗',
  submit_failed:         '送信失敗（手動対応）',
  validation_failed:     'バリデーションエラー（手動確認）',
  inquiry_type_mismatch: '種別不一致（スキップ）',
  unknown_error:         'エラー',
}

// 表示するステータスグループの順序と色定義
const STATUS_GROUPS: { statuses: CompanyStatus[]; label: string; color: string; bg: string }[] = [
  {
    statuses: ['success'],
    label:    '送信完了',
    color:    'text-green-700',
    bg:       'bg-green-50 border-green-200',
  },
  {
    statuses: ['no_contact_page', 'inquiry_type_mismatch'],
    label:    'スキップ',
    color:    'text-orange-600',
    bg:       'bg-orange-50 border-orange-200',
  },
  {
    statuses: ['cloudflare_blocked', 'captcha_detected', 'submit_failed', 'validation_failed', 'form_parse_failed', 'unknown_error'],
    label:    '要手動対応',
    color:    'text-red-600',
    bg:       'bg-red-50 border-red-200',
  },
]

function statusColor(status: CompanyStatus): string {
  switch (status) {
    case 'pending':               return 'text-gray-400'
    case 'running':               return 'text-blue-500'
    case 'success':               return 'text-green-600 font-semibold'
    case 'no_contact_page':
    case 'inquiry_type_mismatch': return 'text-orange-500'
    default:                      return 'text-red-500'
  }
}

interface Props {
  results: CompanyResult[]
}

export default function BatchResultTable({ results }: Props) {
  if (results.length === 0) return null

  const done    = results.filter(r => r.status !== 'pending' && r.status !== 'running').length
  const success = results.filter(r => r.status === 'success').length

  // 完了済みのものだけグループ化対象
  const completedResults = results.filter(r => r.status !== 'pending' && r.status !== 'running')

  return (
    <div className="mt-4 space-y-4">
      {/* サマリー */}
      <div className="flex gap-4 text-xs text-gray-500 px-1">
        <span>全 {results.length} 社</span>
        <span>完了 {done} 社</span>
        <span className="text-green-600 font-semibold">送信成功 {success} 社</span>
      </div>

      {/* 実行順テーブル */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 w-8">#</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">会社名</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
                <td className="px-4 py-2 text-gray-700">{r.name}</td>
                <td className={`px-4 py-2 text-right text-xs ${statusColor(r.status)}`}>
                  {r.status === 'running' && (
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-1" />
                  )}
                  {STATUS_LABELS[r.status]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ステータス別グループ（完了分のみ表示） */}
      {completedResults.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 px-1">ステータス別</p>
          {STATUS_GROUPS.map(group => {
            const matched = completedResults.filter(r => group.statuses.includes(r.status))
            if (matched.length === 0) return null
            return (
              <div key={group.label} className={`border rounded-lg overflow-hidden ${group.bg}`}>
                <div className={`px-4 py-2 flex items-center justify-between border-b ${group.bg}`}>
                  <span className={`text-xs font-semibold ${group.color}`}>{group.label}</span>
                  <span className={`text-xs font-bold ${group.color}`}>{matched.length} 社</span>
                </div>
                <div className="bg-white divide-y divide-gray-100">
                  {matched.map((r, i) => (
                    <div key={i} className="px-4 py-2 flex items-center justify-between">
                      <span className="text-sm text-gray-700">{r.name}</span>
                      <span className="text-xs text-gray-400">{STATUS_LABELS[r.status]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
