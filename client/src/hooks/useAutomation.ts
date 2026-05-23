import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useState } from 'react'
import type { UserProfile, CompanyResult, CompanyStatus } from '../types'

export function useAutomation() {
  const [isRunning, setIsRunning]     = useState(false)
  const [currentLogs, setCurrentLogs] = useState<string[]>([])
  const [results, setResults]         = useState<CompanyResult[]>([])

  const runBatch = async (companies: string[], profile: UserProfile) => {
    if (isRunning || companies.length === 0) return

    setIsRunning(true)
    setResults(companies.map(name => ({ name, status: 'pending', logs: [] })))
    setCurrentLogs([])

    for (let i = 0; i < companies.length; i++) {
      const companyName = companies[i]

      setResults(prev => prev.map((r, idx) =>
        idx === i ? { ...r, status: 'running', logs: [] } : r
      ))
      setCurrentLogs([])

      let capturedStatus: CompanyStatus = 'unknown_error'
      const companyLogs: string[] = []

      const unlisten = await listen<string>('automation-status', (event) => {
        companyLogs.push(event.payload)
        setCurrentLogs(prev => [...prev, event.payload])
        const match = event.payload.match(/^\[DONE:([^\]]+)\]$/)
        if (match) {
          capturedStatus = match[1] as CompanyStatus
        }
      })

      try {
        await invoke('launch_browser', { companyName, profile })
      } catch {
        // DONE マーカーが届いていれば capturedStatus は確定済み
      } finally {
        unlisten()
      }

      setResults(prev => prev.map((r, idx) =>
        idx === i ? { ...r, status: capturedStatus, logs: [...companyLogs] } : r
      ))
    }

    setIsRunning(false)
  }

  // 手動送信済みとしてマークする（失敗 → 送信完了 に変更）
  const markAsSent = (name: string) => {
    setResults(prev => prev.map(r =>
      r.name === name ? { ...r, status: 'success' } : r
    ))
  }

  return { isRunning, currentLogs, results, runBatch, markAsSent }
}
