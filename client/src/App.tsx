import { useState, useEffect } from 'react'
import CompanyInput from './components/CompanyInput'
import StatusLog from './components/StatusLog'
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

export default function App() {
  const [companyName, setCompanyName] = useState('')
  const [profile, setProfile] = useState<UserProfile>(loadProfile)
  const { isRunning, logs, run } = useAutomation()

  useEffect(() => {
    saveProfile(profile)
  }, [profile])

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-xl font-bold text-gray-800 mb-6">フォーム半自動送信ツール</h1>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">営業先</h2>
          <CompanyInput
            value={companyName}
            onChange={setCompanyName}
            onRun={() => run(companyName, profile, () => setCompanyName(''))}
            isRunning={isRunning}
          />
          <StatusLog logs={logs} />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-4">
          <UserProfileForm profile={profile} onChange={setProfile} />
        </section>
      </div>
    </div>
  )
}
