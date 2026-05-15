interface Props {
  value: string
  onChange: (value: string) => void
  onRun: () => void
  isRunning: boolean
}

export default function CompanyInput({ value, onChange, onRun, isRunning }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isRunning) onRun()
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="営業先の会社名を入力"
        disabled={isRunning}
        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      />
      <button
        onClick={onRun}
        disabled={isRunning || value.trim() === ''}
        className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isRunning ? '実行中...' : '実行'}
      </button>
    </div>
  )
}
