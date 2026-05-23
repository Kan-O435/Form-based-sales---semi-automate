import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useState, useRef } from 'react'
import type { UserProfile, CompanyResult, CompanyStatus } from '../types'

// お問い合わせページまで到達したが送信できなかった場合に手動確認が必要なステータス
const MANUAL_REVIEW_STATUSES: CompanyStatus[] = [
  'submit_failed',
  'validation_failed',
  'form_parse_failed',
  'cloudflare_blocked',
  'captcha_detected',
]

export interface ManualReviewState {
  companyName: string
  companyIndex: number
}

export function useAutomation() {
  const [isRunning, setIsRunning]     = useState(false)
  const [currentLogs, setCurrentLogs] = useState<string[]>([])
  const [results, setResults]         = useState<CompanyResult[]>([])
  const [waitingForReview, setWaitingForReview] = useState<ManualReviewState | null>(null)

  const resolveReviewRef = useRef<((outcome: 'success' | 'skipped') => void) | null>(null)

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

      // 手動対応が必要なステータスの場合、ユーザーの確認を待ってからキューを再開
      if (MANUAL_REVIEW_STATUSES.includes(capturedStatus)) {
        setWaitingForReview({ companyName, companyIndex: i })

        const outcome = await new Promise<'success' | 'skipped'>((resolve) => {
          resolveReviewRef.current = resolve
        })

        setWaitingForReview(null)
        resolveReviewRef.current = null

        if (outcome === 'success') {
          setResults(prev => prev.map((r, idx) =>
            idx === i ? { ...r, status: 'success' } : r
          ))
        }
      }
    }

    setIsRunning(false)
  }

  // ユーザーが手動確認後に○か×を選択したときに呼ぶ
  const confirmManualReview = (outcome: 'success' | 'skipped') => {
    if (resolveReviewRef.current) {
      resolveReviewRef.current(outcome)
    }
  }

  // 手動送信済みとしてマークする（失敗 → 送信完了 に変更）
  const markAsSent = (name: string) => {
    setResults(prev => prev.map(r =>
      r.name === name ? { ...r, status: 'success' } : r
    ))
  }

  return { isRunning, currentLogs, results, runBatch, markAsSent, waitingForReview, confirmManualReview }
}
