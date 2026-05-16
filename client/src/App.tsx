import { useState } from 'react'
import CompanyInput from './components/CompanyInput'
import StatusLog from './components/StatusLog'
import UserProfileForm from './components/UserProfileForm'
import { useAutomation } from './hooks/useAutomation'
import type { UserProfile } from './types'

const defaultProfile: UserProfile = {
  lastName: '',
  firstName: '',
  lastNameKana: '',
  firstNameKana: '',
  email: '',
  phone: '',
  company: '',
  department: '',
  position: '',
  postalCode: '',
  prefecture: '',
  city: '',
  address1: '',
  address2: '',
  message: '',
}

export default function App() {
  const [companyName, setCompanyName] = useState('')
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const { isRunning, logs, run } = useAutomation()

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-xl font-bold text-gray-800 mb-6">フォーム半自動送信ツール</h1>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">営業先</h2>
          <CompanyInput
            value={companyName}
            onChange={setCompanyName}
            onRun={() => run(companyName)}
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
