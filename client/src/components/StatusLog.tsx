interface Props {
  logs: string[]
}

export default function StatusLog({ logs }: Props) {
  return (
    <div className="mt-4 bg-gray-900 rounded-lg p-4 h-40 overflow-y-auto font-mono text-sm">
      {logs.length === 0 ? (
        <p className="text-gray-500">待機中...</p>
      ) : (
        logs.map((log, i) => (
          <p key={i} className="text-green-400 leading-relaxed">
            &gt; {log}
          </p>
        ))
      )}
    </div>
  )
}
