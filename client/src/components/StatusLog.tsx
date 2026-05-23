interface Props {
  logs: string[]
  currentCompany?: string
}

const DONE_LABELS: Record<string, string> = {
  'success':               '送信完了',
  'no_contact_page':       'お問い合わせページなし',
  'cloudflare_blocked':    'Cloudflare ブロック（手動対応が必要）',
  'captcha_detected':      'CAPTCHA 検出（手動対応が必要）',
  'form_parse_failed':     'フォーム解析失敗（手動対応が必要）',
  'submit_failed':         '送信ボタンが見つかりません（手動対応が必要）',
  'validation_failed':     'バリデーションエラー（手動で確認してください）',
  'inquiry_type_mismatch': '問い合わせ種別が対象外のためスキップ',
  'unknown_error':         '予期しないエラーが発生しました',
}

function parseDone(line: string): { key: string; label: string } | null {
  const match = line.match(/^\[DONE:([^\]]+)\]$/)
  if (!match) return null
  const key = match[1]
  return { key, label: DONE_LABELS[key] ?? key }
}

function lineColor(line: string): string {
  const done = parseDone(line)
  if (done) {
    if (done.key === 'success') return 'text-yellow-300 font-bold'
    if (done.key === 'no_contact_page' || done.key === 'inquiry_type_mismatch') return 'text-orange-400 font-bold'
    return 'text-red-400 font-bold'
  }
  if (line.startsWith('[エラー]') || line.startsWith('エラー')) return 'text-red-400'
  if (line.startsWith('  警告:')) return 'text-yellow-400'
  return 'text-green-400'
}

export default function StatusLog({ logs, currentCompany }: Props) {
  return (
    <div className="mt-4">
      {currentCompany && (
        <p className="text-xs text-gray-500 mb-1">
          実行中: <span className="font-semibold text-gray-700">{currentCompany}</span>
        </p>
      )}
      <div className="bg-gray-900 rounded-lg p-4 h-40 overflow-y-auto font-mono text-sm">
        {logs.length === 0 ? (
          <p className="text-gray-500">待機中...</p>
        ) : (
          logs.map((log, i) => {
            const done = parseDone(log)
            const displayText = done ? `[完了] ${done.label}` : log
            return (
              <p key={i} className={`leading-relaxed ${lineColor(log)}`}>
                &gt; {displayText}
              </p>
            )
          })
        )}
      </div>
    </div>
  )
}
