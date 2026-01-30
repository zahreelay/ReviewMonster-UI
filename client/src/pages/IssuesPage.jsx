import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getIssues, getOverview } from '../services/api'
import AppHeader from '../components/AppHeader'
import TabNav from '../components/TabNav'
import LoadingSpinner from '../components/LoadingSpinner'
import IssueCard from '../components/IssueCard'

export default function IssuesPage() {
  const { appId } = useParams()
  const [issues, setIssues] = useState([])
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function loadData() {
      try {
        const [issuesData, overviewData] = await Promise.all([
          getIssues(appId),
          getOverview(appId),
        ])
        setIssues(issuesData.issues || [])
        setMetadata(overviewData.metadata)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [appId])

  const filteredIssues = issues.filter((issue) => {
    if (filter === 'all') return true
    if (filter === 'active') return issue.status !== 'resolved'
    if (filter === 'resolved') return issue.status === 'resolved'
    return issue.severity === filter
  })

  const severityCounts = issues.reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] || 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader app={metadata} />
        <TabNav />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingSpinner message="Loading issues..." />
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
            <h1 className="text-2xl font-bold text-gray-900">Issues</h1>
            <p className="text-gray-500">{issues.length} issues identified from reviews</p>
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
            <p className="text-2xl font-bold text-gray-900">{issues.length}</p>
            <p className="text-sm text-gray-500">All Issues</p>
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`p-4 rounded-lg border text-left transition ${
              filter === 'critical'
                ? 'bg-red-50 border-red-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-2xl font-bold text-red-600">{severityCounts.critical || 0}</p>
            <p className="text-sm text-gray-500">Critical</p>
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`p-4 rounded-lg border text-left transition ${
              filter === 'high'
                ? 'bg-orange-50 border-orange-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-2xl font-bold text-orange-600">{severityCounts.high || 0}</p>
            <p className="text-sm text-gray-500">High</p>
          </button>
          <button
            onClick={() => setFilter('medium')}
            className={`p-4 rounded-lg border text-left transition ${
              filter === 'medium'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-2xl font-bold text-yellow-600">{severityCounts.medium || 0}</p>
            <p className="text-sm text-gray-500">Medium</p>
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`p-4 rounded-lg border text-left transition ${
              filter === 'low'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-2xl font-bold text-blue-600">{severityCounts.low || 0}</p>
            <p className="text-sm text-gray-500">Low</p>
          </button>
        </div>

        {/* Filter by status */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'active'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'resolved'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Resolved
          </button>
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          {filteredIssues.map((issue, i) => (
            <IssueCard key={issue.id || i} issue={issue} />
          ))}
          {filteredIssues.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No issues match the selected filter
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
