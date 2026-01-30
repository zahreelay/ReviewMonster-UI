import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getRoadmap, getOverview } from '../services/api'
import AppHeader from '../components/AppHeader'
import TabNav from '../components/TabNav'
import LoadingSpinner from '../components/LoadingSpinner'

function PriorityBadge({ priority }) {
  const styles = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  }
  return (
    <span className={`px-2 py-1 rounded border text-xs font-medium uppercase ${styles[priority] || styles.medium}`}>
      {priority}
    </span>
  )
}

function ImpactBadge({ impact }) {
  const styles = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-blue-500 text-white',
    low: 'bg-gray-400 text-white',
  }
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[impact] || styles.medium}`}>
      {impact} impact
    </span>
  )
}

function CategoryIcon({ category }) {
  const icons = {
    bug_fix: { icon: '🐛', label: 'Bug Fix' },
    feature: { icon: '✨', label: 'Feature' },
    improvement: { icon: '🔧', label: 'Improvement' },
    competitive: { icon: '📊', label: 'Competitive' },
    quick_win: { icon: '⚡', label: 'Quick Win' },
  }
  const cat = icons[category] || { icon: '📋', label: category || 'Task' }
  return (
    <span className="flex items-center gap-1 text-sm text-gray-500">
      <span>{cat.icon}</span>
      <span>{cat.label}</span>
    </span>
  )
}

function RoadmapItem({ item, appId }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition">
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CategoryIcon category={item.category} />
              <PriorityBadge priority={item.priority} />
              <ImpactBadge impact={item.impact} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
            {item.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
            )}
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <svg
              className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
          {/* Evidence */}
          {item.evidence && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Evidence</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {item.evidence.reportCount && (
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <p className="text-lg font-semibold text-gray-900">{item.evidence.reportCount}</p>
                    <p className="text-xs text-gray-500">Reports</p>
                  </div>
                )}
                {item.evidence.ratingImpact && (
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <p className={`text-lg font-semibold ${item.evidence.ratingImpact < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {item.evidence.ratingImpact > 0 ? '+' : ''}{item.evidence.ratingImpact}
                    </p>
                    <p className="text-xs text-gray-500">Rating Impact</p>
                  </div>
                )}
                {item.evidence.affectedUsers && (
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <p className="text-lg font-semibold text-gray-900">{item.evidence.affectedUsers}</p>
                    <p className="text-xs text-gray-500">Affected Users</p>
                  </div>
                )}
                {item.evidence.demandCount && (
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <p className="text-lg font-semibold text-gray-900">{item.evidence.demandCount}</p>
                    <p className="text-xs text-gray-500">Requests</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Competitive Context */}
          {item.competitiveContext && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Competitive Context</h4>
              <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded p-3">
                {item.competitiveContext}
              </p>
            </div>
          )}

          {/* Recommendation */}
          {item.recommendation && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recommended Action</h4>
              <p className="text-sm text-gray-600">{item.recommendation}</p>
            </div>
          )}

          {/* Sample Reviews */}
          {item.evidence?.sampleReviews && item.evidence.sampleReviews.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Sample Reviews</h4>
              <div className="space-y-2">
                {item.evidence.sampleReviews.slice(0, 3).map((review, i) => (
                  <div key={i} className="text-sm text-gray-600 bg-gray-50 rounded p-3 italic">
                    "{typeof review === 'string' ? review : review.body || review.text}"
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Link to Issue Detail if applicable */}
          {item.issueId && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                to={`/app/${appId}/issues/${item.issueId}`}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Issue Details →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function RoadmapPage() {
  const { appId } = useParams()
  const [roadmapData, setRoadmapData] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Load overview first (should always work)
        const overview = await getOverview(appId)
        const rawMeta = overview?.metadata || overview?.app || overview
        setMetadata({
          name: rawMeta?.name || rawMeta?.trackName,
          iconUrl: rawMeta?.iconUrl || rawMeta?.icon || rawMeta?.artworkUrl512 || rawMeta?.artworkUrl100,
          rating: rawMeta?.rating ?? rawMeta?.averageUserRating,
          reviewCount: rawMeta?.reviewCount ?? rawMeta?.userRatingCount,
          ...rawMeta
        })

        // Try to load roadmap data (may not exist if analysis not done)
        try {
          const roadmap = await getRoadmap(appId)
          console.log('[Roadmap] Data received:', roadmap)
          setRoadmapData(roadmap)
        } catch (roadmapErr) {
          console.log('[Roadmap] No roadmap data available:', roadmapErr.message)
          // Not an error - just means roadmap not generated yet
          setRoadmapData(null)
        }
      } catch (err) {
        console.error('[Roadmap] Error loading data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [appId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader app={metadata} />
        <TabNav />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingSpinner message="Loading roadmap recommendations..." />
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

  const { recommendations, summary } = roadmapData || {}

  // Group recommendations by priority
  const highPriority = (recommendations || []).filter(r => r.priority === 'high')
  const mediumPriority = (recommendations || []).filter(r => r.priority === 'medium')
  const lowPriority = (recommendations || []).filter(r => r.priority === 'low' || !r.priority)

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader app={metadata} />
      <TabNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Recommended Roadmap</h1>
          <p className="text-gray-500">Data-driven recommendations based on reviews + competitive analysis</p>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{summary.totalRecommendations || recommendations?.length || 0}</p>
              <p className="text-sm text-gray-500">Total Items</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{summary.criticalBugs || highPriority.filter(r => r.category === 'bug_fix').length}</p>
              <p className="text-sm text-gray-500">Critical Bugs</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{summary.competitiveGaps || 0}</p>
              <p className="text-sm text-gray-500">Competitive Gaps</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{summary.quickWins || lowPriority.length}</p>
              <p className="text-sm text-gray-500">Quick Wins</p>
            </div>
          </div>
        )}

        {/* High Priority */}
        {highPriority.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-red-500 text-xl">🔥</span>
              <h2 className="text-lg font-semibold text-gray-900">High Priority</h2>
              <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded">
                {highPriority.length}
              </span>
            </div>
            <div className="space-y-3">
              {highPriority.map((item, i) => (
                <RoadmapItem key={item.id || i} item={item} appId={appId} />
              ))}
            </div>
          </div>
        )}

        {/* Medium Priority */}
        {mediumPriority.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-yellow-500 text-xl">📌</span>
              <h2 className="text-lg font-semibold text-gray-900">Medium Priority</h2>
              <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded">
                {mediumPriority.length}
              </span>
            </div>
            <div className="space-y-3">
              {mediumPriority.map((item, i) => (
                <RoadmapItem key={item.id || i} item={item} appId={appId} />
              ))}
            </div>
          </div>
        )}

        {/* Low Priority / Quick Wins */}
        {lowPriority.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-green-500 text-xl">⚡</span>
              <h2 className="text-lg font-semibold text-gray-900">Quick Wins</h2>
              <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded">
                {lowPriority.length}
              </span>
            </div>
            <div className="space-y-3">
              {lowPriority.map((item, i) => (
                <RoadmapItem key={item.id || i} item={item} appId={appId} />
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {(!recommendations || recommendations.length === 0) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Roadmap Data Yet</h3>
            <p className="text-gray-500">
              Roadmap recommendations haven't been generated for this app yet.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
