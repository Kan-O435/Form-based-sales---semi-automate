import { useState, useEffect } from 'react'
import CompanyInput from './components/CompanyInput'
import StatusLog from './components/StatusLog'
import BatchResultTable from './components/BatchResultTable'
import FailureDetails from './components/FailureDetails'
import ManualReviewPrompt from './components/ManualReviewPrompt'
import UserProfileForm from './components/UserProfileForm'
import { useAutomation } from './hooks/useAutomation'
import type { UserProfile } from './types'

const STORAGE_KEY = 'user_profile'

// message は毎回入力するため保存対象外
type SavedProfile = Omit<UserProfile, 'message'>

const defaultProfile: UserProfile = {
  lastName: '佐藤',
  firstName: '光河',
  lastNameKana: 'さとう',
  firstNameKana: 'こうが',
  email: 'koga.sato@neurestx-ai.com',
  phone: '090-2015-8169',
  company: '株式会社NuerestX',
  department: '代表室',
  position: '代表取締役',
  postalCode: '820-0044',
  prefecture: '福岡県',
  city: '飯塚市',
  address1: '横田721-3',
  address2: '',
  subject: '高専発AIスタートアップNeurestX：御社の業務を革新するAI実装のご提案',
  message: '',
}

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProfile
    const saved: SavedProfile = JSON.parse(raw)
    return { ...defaultProfile, ...saved, message: '' }
  } catch {
    return defaultProfile
  }
}

function saveProfile(profile: UserProfile) {
  const { message: _omit, ...saved } = profile
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
}

// テキストエリアの入力を1行1社のリストに変換
function parseCompanies(text: string): string[] {
  return text
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

export default function App() {
  const [companiesText, setCompaniesText] = useState('')
  const [profile, setProfile]             = useState<UserProfile>(loadProfile)
  const { isRunning, currentLogs, results, runBatch, markAsSent, waitingForReview, confirmManualReview } = useAutomation()

  useEffect(() => {
    saveProfile(profile)
  }, [profile])

  const companies   = parseCompanies(companiesText)
  const currentName = results.find(r => r.status === 'running')?.name

  const handleRun = () => {
    runBatch(companies, profile)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-xl font-bold text-gray-800 mb-6">フォーム半自動送信ツール</h1>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">営業先リスト</h2>
          <CompanyInput
            value={companiesText}
            onChange={setCompaniesText}
            onRun={handleRun}
            isRunning={isRunning}
            companyCount={companies.length}
          />

          {/* バッチ結果テーブル */}
          <BatchResultTable results={results} />

          {/* 現在処理中企業のリアルタイムログ */}
          {(isRunning || currentLogs.length > 0) && (
            <StatusLog logs={currentLogs} currentCompany={currentName} />
          )}

          {/* 手動確認待ちプロンプト */}
          {waitingForReview && (
            <ManualReviewPrompt
              companyName={waitingForReview.companyName}
              onConfirm={confirmManualReview}
            />
          )}
        </section>

        {results.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-4">
            <FailureDetails results={results} onMarkAsSent={markAsSent} />
          </section>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-4">
          <UserProfileForm profile={profile} onChange={setProfile} />
        </section>
      </div>
    </div>
  )
}
