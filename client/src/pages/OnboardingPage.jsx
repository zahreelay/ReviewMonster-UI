import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { initApp, getInitStatus, getApps } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function OnboardingPage() {
  const [appId, setAppId] = useState('')
  const [includeCompetitors, setIncludeCompetitors] = useState(true)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const [analyzedApps, setAnalyzedApps] = useState([])
  const [loadingApps, setLoadingApps] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadApps() {
      console.log('[Onboarding] Loading previously analyzed apps...')
      try {
        const data = await getApps()
        console.log('[Onboarding] Loaded apps:', data)
        setAnalyzedApps(data.apps || [])
      } catch (err) {
        console.error('[Onboarding] Failed to load apps:', err)
      } finally {
        setLoadingApps(false)
      }
    }
    loadApps()
  }, [])

  async function pollStatus(id) {
    console.log('[Onboarding] Polling status for:', id)
    try {
      const status = await getInitStatus(id)
      console.log('[Onboarding] Status received:', status)

      // Cap progress at 100%
      if (status.progress !== undefined) {
        status.progress = Math.min(status.progress, 100)
      }
      setProgress(status)

      if (status.status === 'ready' || status.status === 'completed') {
        console.log('[Onboarding] Analysis complete, navigating to dashboard')
        navigate(`/app/${id}`)
      } else if (status.status === 'failed') {
        console.error('[Onboarding] Analysis failed:', status.error)
        setError(status.error || 'Analysis failed')
        setLoading(false)
      } else {
        console.log('[Onboarding] Still analyzing, polling again in 2s...')
        setTimeout(() => pollStatus(id), 2000)
      }
    } catch (err) {
      console.error('[Onboarding] Poll error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const cleanId = appId.replace(/[^0-9]/g, '')
    console.log('[Onboarding] Submitting app ID:', cleanId)

    if (!cleanId) {
      setError('Please enter a valid App Store ID')
      return
    }

    setLoading(true)
    setError(null)
    setProgress({ status: 'starting', message: 'Initializing...', progress: 0 })

    try {
      console.log('[Onboarding] Calling initApp with includeCompetitors:', includeCompetitors)
      const result = await initApp(cleanId, { includeCompetitors })
      console.log('[Onboarding] Init result:', result)

      if (result.status === 'ready' || result.status === 'completed') {
        console.log('[Onboarding] Already ready, navigating...')
        navigate(`/app/${cleanId}`)
      } else {
        console.log('[Onboarding] Starting status polling...')
        pollStatus(cleanId)
      }
    } catch (err) {
      console.error('[Onboarding] Init error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  function handleSelectApp(id) {
    console.log('[Onboarding] Selected existing app:', id)
    navigate(`/app/${id}`)
  }

  // Calculate display progress (capped at 100)
  const displayProgress = progress?.progress !== undefined
    ? Math.min(Math.round(progress.progress), 100)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="#2563EB"/>
              <path d="M14 18C14 16.8954 14.8954 16 16 16H32C33.1046 16 34 16.8954 34 18V30C34 31.1046 33.1046 32 32 32H16C14.8954 32 14 31.1046 14 30V18Z" fill="white"/>
              <circle cx="20" cy="22" r="2" fill="#2563EB"/>
              <circle cx="28" cy="22" r="2" fill="#2563EB"/>
              <path d="M20 27C20 27 22 29 24 29C26 29 28 27 28 27" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10 14L14 18" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"/>
              <path d="M38 14L34 18" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"/>
              <path d="M24 10V16" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h1 className="text-3xl font-bold text-gray-900">ReviewMonster</h1>
          </div>
          <p className="mt-2 text-gray-600">App Store Intelligence Platform</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Analyze Your App
          </h2>

          {loading ? (
            <div className="py-8">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">{progress?.message || 'Analyzing...'}</p>
                {displayProgress !== null && (
                  <div className="w-full mt-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${displayProgress}%` }}
                      ></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 text-center">
                      {displayProgress}% complete
                    </p>
                  </div>
                )}
                {progress?.steps && (
                  <ul className="mt-4 text-sm text-left w-full space-y-1">
                    {progress.steps.map((step, i) => (
                      <li key={i} className="flex items-center gap-2">
                        {step.status === 'completed' && <span className="text-green-500">✓</span>}
                        {step.status === 'in_progress' && <span className="text-blue-500">⏳</span>}
                        {step.status === 'pending' && <span className="text-gray-400">○</span>}
                        <span className={step.status === 'completed' ? 'text-gray-500' : ''}>
                          {step.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App Store ID
              </label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="e.g., 1234567890 or id1234567890"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <p className="font-medium mb-1">How to find your App Store ID:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open your app in the App Store</li>
                  <li>Copy the number from the URL</li>
                  <li>Example: apps.apple.com/app/id<strong>1234567890</strong></li>
                </ol>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCompetitors}
                    onChange={(e) => setIncludeCompetitors(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Include Competitive Analysis</span>
                    <p className="text-sm text-gray-600 mt-1">
                      Discover top competitors, generate SWOT analysis, and get strategic recommendations.
                    </p>
                  </div>
                </label>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="mt-4 w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Analyze App
              </button>
            </form>
          )}
        </div>

        {!loading && analyzedApps.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Previously Analyzed
            </h3>
            <div className="space-y-2">
              {analyzedApps.map((app) => (
                <button
                  key={app.appId}
                  onClick={() => handleSelectApp(app.appId)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-left"
                >
                  {app.iconUrl ? (
                    <img src={app.iconUrl} alt={app.name} className="w-10 h-10 rounded-lg" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                      📱
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{app.name}</p>
                    <p className="text-sm text-gray-500">
                      {app.rating?.toFixed(1)} ★ • {app.reviewCount?.toLocaleString()} reviews
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {loadingApps && (
          <div className="mt-6 text-center text-gray-500 text-sm">
            Loading previously analyzed apps...
          </div>
        )}
      </div>
    </div>
  )
}
