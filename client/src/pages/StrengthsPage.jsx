import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getStrengths, getOverview } from '../services/api'
import AppHeader from '../components/AppHeader'
import TabNav from '../components/TabNav'
import LoadingSpinner from '../components/LoadingSpinner'
import StrengthCard from '../components/StrengthCard'

export default function StrengthsPage() {
  const { appId } = useParams()
  const [strengths, setStrengths] = useState([])
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [strengthsData, overviewData] = await Promise.all([
          getStrengths(appId),
          getOverview(appId),
        ])
        setStrengths(strengthsData.strengths || [])
        setMetadata(overviewData.metadata)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [appId])

  const totalMentions = strengths.reduce((sum, s) => sum + (s.count || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader app={metadata} />
        <TabNav />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingSpinner message="Loading strengths..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader app={metadata} />
        <TabNav />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader app={metadata} />
      <TabNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Strengths</h1>
            <p className="text-gray-500">What users love about your app</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-3xl font-bold text-green-600">{strengths.length}</p>
            <p className="text-sm text-gray-500">Identified Strengths</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-3xl font-bold text-green-600">{totalMentions.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Positive Mentions</p>
          </div>
        </div>

        {/* Strengths List */}
        <div className="space-y-4">
          {strengths.map((strength, i) => (
            <StrengthCard key={strength.id || i} strength={strength} />
          ))}
          {strengths.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No strengths identified yet
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
