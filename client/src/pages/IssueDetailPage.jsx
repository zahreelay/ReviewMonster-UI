import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getIssueDetail, getOverview } from '../services/api'
import AppHeader from '../components/AppHeader'
import TabNav from '../components/TabNav'
import LoadingSpinner from '../components/LoadingSpinner'

const severityColors = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
}

export default function IssueDetailPage() {
  const { appId, issueId } = useParams()
  const [data, setData] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadData() {
      console.log('[IssueDetail] Loading data for appId:', appId, 'issueId:', issueId)
      try {
        const [issueData, overviewData] = await Promise.all([
          getIssueDetail(appId, issueId),
          getOverview(appId),
        ])
        console.log('[IssueDetail] Issue data received:', issueData)
        console.log('[IssueDetail] Overview data received:', overviewData)

        // Only set data when we have all required fields
        if (issueData && issueData.issue) {
          setData(issueData)
        } else {
          console.warn('[IssueDetail] Issue data incomplete:', issueData)
          setData(issueData)
        }
        setMetadata(overviewData.metadata)
      } catch (err) {
        console.error('[IssueDetail] Error loading data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [appId, issueId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader app={metadata} />
        <TabNav />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingSpinner message="Loading issue details..." />
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

  const { issue, impact, timeline, recommendations, supportingReviews } = data || {}
  const severity = issue?.severity || 'medium'

  console.log('[IssueDetail] Rendering with timeline:', timeline)
  console.log('[IssueDetail] Rendering with supportingReviews:', supportingReviews)

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader app={metadata} />
      <TabNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Link
            to={`/app/${appId}/issues`}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            ← Back to Issues
          </Link>
        </div>

        {/* Issue Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${severityColors[severity]}`}>
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </span>
                {issue?.status && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    issue.status === 'resolved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {issue.status === 'resolved' ? '✅ Resolved' : '🔄 Active'}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{issue?.title || 'Unknown Issue'}</h1>
              <p className="mt-2 text-gray-600">{issue?.description || 'No description available'}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{issue?.reportCount || issue?.count || 0}</p>
              <p className="text-sm text-gray-500">reports</p>
            </div>
          </div>
          {issue?.firstSeen && (
            <p className="mt-4 text-sm text-gray-500">
              First reported: {issue.firstSeen}
              {issue.resolvedIn && ` • Resolved in ${issue.resolvedIn}`}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Impact Analysis */}
            {impact && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Impact Analysis</h2>
                <div className="grid grid-cols-3 gap-4">
                  {impact.ratingDrop !== undefined && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className={`text-2xl font-bold ${impact.ratingDrop < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {impact.ratingDrop > 0 ? '+' : ''}{Number(impact.ratingDrop).toFixed(1)}
                      </p>
                      <p className="text-sm text-gray-500">Rating Impact</p>
                    </div>
                  )}
                  {impact.affectedPercentage !== undefined && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{impact.affectedPercentage}%</p>
                      <p className="text-sm text-gray-500">Affected Users</p>
                    </div>
                  )}
                  {impact.trend && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className={`text-2xl font-bold ${
                        impact.trend === 'decreasing' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {impact.trend === 'decreasing' ? '↓' : '↑'}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">{impact.trend}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
              {timeline && timeline.length > 0 ? (
                <div className="space-y-4">
                  {timeline.map((event, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          (event.event || '').includes('Resolved') || (event.event || '').includes('Fixed')
                            ? 'bg-green-500'
                            : (event.event || '').includes('first') || (event.event || '').includes('Introduced')
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                        }`}></div>
                        {i < timeline.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 mt-1 min-h-[20px]"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {event.date || event.month || event.version || 'Unknown date'}
                          </span>
                          {event.version && event.date && (
                            <span className="text-sm text-gray-500">({event.version})</span>
                          )}
                        </div>
                        <p className="text-gray-600">{event.event || event.description || 'Event occurred'}</p>
                        {event.reviewCount && (
                          <p className="text-sm text-gray-500">{event.reviewCount} reviews</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No timeline data available</p>
              )}
            </div>

            {/* Supporting Reviews */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Evidence ({supportingReviews?.length || 0} reviews)
              </h2>
              {supportingReviews && supportingReviews.length > 0 ? (
                <div className="space-y-4">
                  {supportingReviews.slice(0, 5).map((review, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-500">
                          {'★'.repeat(review.rating || 0)}{'☆'.repeat(5 - (review.rating || 0))}
                        </span>
                        {review.version && <span className="text-sm text-gray-500">v{review.version}</span>}
                        {review.date && (
                          <>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{review.date}</span>
                          </>
                        )}
                      </div>
                      {review.title && (
                        <p className="font-medium text-gray-900">{review.title}</p>
                      )}
                      <p className="text-gray-600 text-sm mt-1 italic">
                        "{review.body || review.text || review.content || 'No content'}"
                      </p>
                    </div>
                  ))}
                  {supportingReviews.length > 5 && (
                    <p className="text-center text-gray-500 text-sm">
                      + {supportingReviews.length - 5} more reviews
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No supporting reviews available</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recommendations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h2>
              {recommendations && recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-blue-500">💡</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No recommendations available</p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Severity</dt>
                  <dd className="font-medium capitalize">{severity}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Status</dt>
                  <dd className="font-medium capitalize">{issue?.status || 'active'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Reports</dt>
                  <dd className="font-medium">{issue?.reportCount || issue?.count || 0}</dd>
                </div>
                {issue?.firstSeen && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">First Seen</dt>
                    <dd className="font-medium">{issue.firstSeen}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
