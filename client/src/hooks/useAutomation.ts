import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useState, useEffect, useRef } from 'react'

export function useAutomation() {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const unlistenRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      unlistenRef.current?.()
    }
  }, [])

  const run = async (companyName: string) => {
    if (isRunning || !companyName.trim()) return

    setIsRunning(true)
    setLogs([])

    unlistenRef.current = await listen<string>('automation-status', (event) => {
      setLogs(prev => [...prev, event.payload])
    })

    try {
      await invoke('launch_browser', { companyName })
    } catch (err) {
      setLogs(prev => [...prev, `エラー: ${String(err)}`])
    } finally {
      setIsRunning(false)
      unlistenRef.current?.()
      unlistenRef.current = null
    }
  }

  return { isRunning, logs, run }
}
