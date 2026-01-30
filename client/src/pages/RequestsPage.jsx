import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getRequests, getOverview } from '../services/api'
import AppHeader from '../components/AppHeader'
import TabNav from '../components/TabNav'
import LoadingSpinner from '../components/LoadingSpinner'
import RequestCard from '../components/RequestCard'

export default function RequestsPage() {
  const { appId } = useParams()
  const [requests, setRequests] = useState([])
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function loadData() {
      try {
        const [requestsData, overviewData] = await Promise.all([
          getRequests(appId),
          getOverview(appId),
        ])
        setRequests(requestsData.requests || [])
        setMetadata(overviewData.metadata)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [appId])

  const filteredRequests = requests.filter((request) => {
    if (filter === 'all') return true
    if (filter === 'competitive') return request.competitorHas && request.competitorHas.length > 0
    return request.priority === filter
  })

  const priorityCounts = requests.reduce((acc, request) => {
    acc[request.priority] = (acc[request.priority] || 0) + 1
    return acc
  }, {})

  const competitiveCount = requests.filter(
    (r) => r.competitorHas && r.competitorHas.length > 0
  ).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader app={metadata} />
        <TabNav />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingSpinner message="Loading feature requests..." />
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
            <h1 className="text-2xl font-bold text-gray-900">Feature Requests</h1>
            <p className="text-gray-500">{requests.length} feature requests from reviews</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`p-4 rounded-lg border text-left transition ${
              filter === 'all'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
            <p className="text-sm text-gray-500">All Requests</p>
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`p-4 rounded-lg border text-left transition ${
              filter === 'high'
                ? 'bg-purple-50 border-purple-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-2xl font-bold text-purple-600">{priorityCounts.high || 0}</p>
            <p className="text-sm text-gray-500">High Priority</p>
          </button>
          <button
            onClick={() => setFilter('medium')}
            className={`p-4 rounded-lg border text-left transition ${
              filter === 'medium'
                ? 'bg-indigo-50 border-indigo-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-2xl font-bold text-indigo-600">{priorityCounts.medium || 0}</p>
            <p className="text-sm text-gray-500">Medium Priority</p>
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`p-4 rounded-lg border text-left transition ${
              filter === 'low'
                ? 'bg-gray-100 border-gray-300'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-2xl font-bold text-gray-600">{priorityCounts.low || 0}</p>
            <p className="text-sm text-gray-500">Low Priority</p>
          </button>
          <button
            onClick={() => setFilter('competitive')}
            className={`p-4 rounded-lg border text-left transition ${
              filter === 'competitive'
                ? 'bg-red-50 border-red-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-2xl font-bold text-red-600">{competitiveCount}</p>
            <p className="text-sm text-gray-500">Competitor Has</p>
          </button>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.map((request, i) => (
            <RequestCard key={request.id || i} request={request} />
          ))}
          {filteredRequests.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No feature requests match the selected filter
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
