import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useState, useEffect, useRef } from 'react'
import type { UserProfile } from '../types'

const FILL_COMPLETE_MARKER = '━━━ 入力完了 ━━━'

export function useAutomation() {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const unlistenRef = useRef<(() => void) | null>(null)
  const completedRef = useRef(false)

  useEffect(() => {
    return () => {
      unlistenRef.current?.()
    }
  }, [])

  const run = async (companyName: string, profile: UserProfile, onComplete?: () => void) => {
    if (isRunning || !companyName.trim()) return

    setIsRunning(true)
    setLogs([])
    completedRef.current = false

    unlistenRef.current = await listen<string>('automation-status', (event) => {
      setLogs(prev => [...prev, event.payload])

      if (event.payload.includes(FILL_COMPLETE_MARKER) && !completedRef.current) {
        completedRef.current = true
        setIsRunning(false)
        unlistenRef.current?.()
        unlistenRef.current = null
        onComplete?.()
      }
    })

    try {
      await invoke('launch_browser', { companyName, profile })
    } catch (err) {
      if (!completedRef.current) {
        setLogs(prev => [...prev, `エラー: ${String(err)}`])
      }
    } finally {
      setIsRunning(false)
      unlistenRef.current?.()
      unlistenRef.current = null
    }
  }

  return { isRunning, logs, run }
}
