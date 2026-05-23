interface Props {
  value: string
  onChange: (value: string) => void
  onRun: () => void
  isRunning: boolean
  companyCount: number
}

export default function CompanyInput({ value, onChange, onRun, isRunning, companyCount }: Props) {
  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"営業先の会社名を1行に1社ずつ入力\n例:\n株式会社〇〇\n△△株式会社\n□□株式会社"}
        disabled={isRunning}
        rows={6}
        className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {companyCount > 0 ? `${companyCount}社が入力済み` : '会社名が入力されていません'}
        </span>
        <button
          onClick={onRun}
          disabled={isRunning || companyCount === 0}
          className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? '実行中...' : `${companyCount}社に一括送信`}
        </button>
      </div>
    </div>
  )
}
