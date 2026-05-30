import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useState, useRef } from 'react'
import type { UserProfile, CompanyResult, CompanyStatus } from '../types'

// success 以外はすべて手動確認が必要
const MANUAL_REVIEW_STATUSES: CompanyStatus[] = [
  'no_contact_page',
  'inquiry_type_mismatch',
  'submit_failed',
  'validation_failed',
  'form_parse_failed',
  'cloudflare_blocked',
  'captcha_detected',
  'unknown_error',
]

export interface ManualReviewState {
  companyName: string
  companyIndex: number
  status: CompanyStatus
}

export function useAutomation() {
  const [isRunning, setIsRunning]     = useState(false)
  const [currentLogs, setCurrentLogs] = useState<string[]>([])
  const [results, setResults]         = useState<CompanyResult[]>([])
  const [waitingForReview, setWaitingForReview] = useState<ManualReviewState | null>(null)
  const [isFilling, setIsFilling]     = useState(false)

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
      let capturedOutcome: 'success' | 'skipped' | null = null
      const companyLogs: string[] = []

      // DONE イベント到達時に即座に使えるようハンドラを先に設定する
      resolveReviewRef.current = (outcome: 'success' | 'skipped') => {
        capturedOutcome = outcome
        // Tauri の stdin 書き込み経由で Node.js を終了させる（fire and forget）
        void invoke('release_browser')
      }

      const unlisten = await listen<string>('automation-status', (event) => {
        companyLogs.push(event.payload)
        setCurrentLogs(prev => [...prev, event.payload])
        const doneMatch = event.payload.match(/^\[DONE:([^\]]+)\]$/)
        if (doneMatch) {
          capturedStatus = doneMatch[1] as CompanyStatus
          // DONE 到達時点でプロンプトを表示する。この時点では Node.js が
          // stdin 待ちのため Chromium はまだ開いている。
          if (MANUAL_REVIEW_STATUSES.includes(capturedStatus)) {
            setWaitingForReview({ companyName, companyIndex: i, status: capturedStatus })
          }
        }
        // フォーム入力完了マーカーを検知して isFilling を解除する
        if (event.payload.startsWith('[FILL_DONE:')) {
          setIsFilling(false)
        }
      })

      try {
        // launch_browser は Node.js プロセスが終了するまでブロックする。
        // 手動確認ケースでは release_browser 呼び出し後に Node.js が終了して戻る。
        await invoke('launch_browser', { companyName, profile })
      } catch {
        // DONE マーカーが届いていれば capturedStatus は確定済み
      } finally {
        unlisten()
      }

      // launch_browser が戻った時点でユーザーは確認済み（手動確認ケース）
      setWaitingForReview(null)
      setIsFilling(false)
      resolveReviewRef.current = null

      const finalStatus: CompanyStatus =
        MANUAL_REVIEW_STATUSES.includes(capturedStatus) && capturedOutcome === 'success'
          ? 'success'
          : capturedStatus

      setResults(prev => prev.map((r, idx) =>
        idx === i ? { ...r, status: finalStatus, logs: [...companyLogs] } : r
      ))

      // React がこのレンダリングを完了させてから次の企業を開始する。
      // setTimeout(0) で新しいマクロタスクに移ることでバッチ処理の境界を作る。
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    setIsRunning(false)
  }

  // ユーザーが手動確認後に○か×を選択したときに呼ぶ
  const confirmManualReview = (outcome: 'success' | 'skipped') => {
    if (resolveReviewRef.current) {
      resolveReviewRef.current(outcome)
    }
  }

  // 現在 Chromium で開いているページのフォームを解析して入力する
  const fillCurrentPage = () => {
    setIsFilling(true)
    void invoke('fill_current_page')
  }

  // 手動送信済みとしてマークする（失敗 → 送信完了 に変更）
  const markAsSent = (name: string) => {
    setResults(prev => prev.map(r =>
      r.name === name ? { ...r, status: 'success' } : r
    ))
  }

  return { isRunning, currentLogs, results, runBatch, markAsSent, waitingForReview, confirmManualReview, isFilling, fillCurrentPage }
}
