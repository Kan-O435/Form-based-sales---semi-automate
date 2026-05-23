interface Props {
  companyName: string
  onConfirm: (outcome: 'success' | 'skipped') => void
}

export default function ManualReviewPrompt({ companyName, onConfirm }: Props) {
  return (
    <div className="mt-4 p-5 bg-yellow-50 border-2 border-yellow-400 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
        <p className="text-sm font-bold text-yellow-800">手動対応が必要です</p>
      </div>
      <p className="text-sm text-yellow-700 mb-4">
        <span className="font-semibold">{companyName}</span> のフォームページが開いています。
        <br />
        Chromium で手動確認・送信を行い、完了したら結果を選択してください。
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
