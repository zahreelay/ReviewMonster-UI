import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getRegressionTimeline, getOverview } from '../services/api'
import AppHeader from '../components/AppHeader'
import TabNav from '../components/TabNav'
import LoadingSpinner from '../components/LoadingSpinner'
import RatingTrendChart from '../components/RatingTrendChart'

// Safely convert any value to displayable string
function safeString(val) {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (Array.isArray(val)) return val.map(safeString).filter(Boolean).join(', ')
  if (typeof val === 'object') {
    // Try common text properties on nested objects
    const text = val.title || val.name || val.text || val.description || val.message || val.en || val.value
    if (text && typeof text === 'string') return text
    // Last resort: stringify but don't return [object Object]
    try {
      const str = JSON.stringify(val)
      return str.length < 200 ? str : ''
    } catch {
      return ''
    }
  }
  return ''
}

// Extract text from an issue object or string
function getIssueText(issue) {
  if (!issue) return ''
  if (typeof issue === 'string') return issue
  if (typeof issue !== 'object') return String(issue)

  // Based on PRD: { issueId, title, evidence }
  // Check each field and make sure it's actually a string
  const candidates = [
    issue.title, issue.name, issue.issueId, issue.issue,
    issue.text, issue.description, issue.message, issue.summary
  ]

  for (const candidate of candidates) {
    const text = safeString(candidate)
    if (text && text.length > 0 && !text.startsWith('{') && !text.startsWith('[')) {
      return text
    }
  }

  return ''
}

// Extract text from an event object or string
function getEventText(event) {
  if (!event) return ''
  if (typeof event === 'string') return event
  if (typeof event !== 'object') return String(event)

  const candidates = [
    event.description, event.text, event.event, event.name,
    event.title, event.message, event.summary, event.content
  ]

  for (const candidate of candidates) {
    const text = safeString(candidate)
    if (text && text.length > 0 && !text.startsWith('{') && !text.startsWith('[')) {
      return text
    }
  }

  return ''
}

// Normalize array field - handle string, array, or object
function normalizeArray(val) {
  if (!val) return []
  if (Array.isArray(val)) {
    // Filter out empty/null items and flatten if needed
    return val.filter(item => item !== null && item !== undefined && item !== '')
  }
  if (typeof val === 'string') {
    // Skip empty strings
    if (!val.trim()) return []
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
      if (parsed && typeof parsed === 'object') return [parsed]
      return parsed ? [parsed] : []
    } catch {
      // Not JSON, treat as single item or split by delimiters
      if (val.includes(',')) return val.split(',').map(s => s.trim()).filter(Boolean)
      if (val.includes(';')) return val.split(';').map(s => s.trim()).filter(Boolean)
      return [val]
    }
  }
  if (typeof val === 'object') {
    // Single object, wrap in array
    return [val]
  }
  return [val]
}

export default function TimelinePage() {
  const { appId } = useParams()
  const [data, setData] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('version')

  useEffect(() => {
    async function loadData() {
      console.log('[Timeline] Loading data for appId:', appId, 'view:', view)
      setLoading(true)
      try {
        const [timelineData, overviewData] = await Promise.all([
          getRegressionTimeline(appId, view),
          getOverview(appId),
        ])
        console.log('[Timeline] Raw API response:', timelineData)
        setData(timelineData)

        // Normalize metadata
        const rawMeta = overviewData?.metadata || overviewData?.app || overviewData
        setMetadata({
          name: rawMeta?.name || rawMeta?.trackName,
          iconUrl: rawMeta?.iconUrl || rawMeta?.icon || rawMeta?.artworkUrl512 || rawMeta?.artworkUrl100,
          rating: rawMeta?.rating ?? rawMeta?.averageUserRating,
          reviewCount: rawMeta?.reviewCount ?? rawMeta?.userRatingCount,
          ...rawMeta
        })
      } catch (err) {
        console.error('[Timeline] Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [appId, view])

  // Extract timeline array based on view and response structure
  const getTimeline = () => {
    if (!data) return []

    let result = []

    // Check for view-specific arrays first
    if (view === 'monthly') {
      result = data.monthlyView || data.monthly || data.months || data.monthlyTimeline || []
    }

    // If no view-specific data found, try generic timeline keys
    if (result.length === 0) {
      if (Array.isArray(data)) {
        result = data
      } else {
        // Try various possible keys the API might use
        result = data.timeline || data.versions || data.data || data.entries ||
                 data.items || data.history || data.records || data.results || []
      }
    }

    // If still no array found, check if data itself has timeline-like structure
    if (result.length === 0 && typeof data === 'object') {
      // Maybe the data keys are version numbers or months
      const keys = Object.keys(data).filter(k =>
        !['viewBy', 'status', 'message', 'error', 'metadata', 'app'].includes(k)
      )
      if (keys.length > 0 && typeof data[keys[0]] === 'object') {
        result = keys.map(k => ({ ...data[k], _key: k }))
      }
    }

    return result
  }

  const rawTimeline = getTimeline()

  // Sort timeline in reverse chronological order (latest first)
  const timeline = [...rawTimeline].sort((a, b) => {
    // Try to extract a sortable value from each item
    const getDateValue = (item) => {
      // Try date fields first
      if (item.releaseDate) return new Date(item.releaseDate).getTime()
      if (item.release_date) return new Date(item.release_date).getTime()
      if (item.date) return new Date(item.date).getTime()

      // For monthly view, parse month strings like "2025-01" or "January 2025"
      if (item.month) {
        const monthStr = String(item.month)
        if (monthStr.match(/^\d{4}-\d{2}/)) return new Date(monthStr + '-01').getTime()
        const parsed = Date.parse(monthStr)
        if (!isNaN(parsed)) return parsed
      }

      // For version view, try to parse version as number (e.g., "2.4.0" -> 2.4)
      if (item.version) {
        const vStr = String(item.version).replace(/^v/i, '')
        const parts = vStr.split('.')
        if (parts.length >= 2) {
          return parseFloat(parts[0]) * 10000 + parseFloat(parts[1] || 0) * 100 + parseFloat(parts[2] || 0)
        }
      }

      return 0
    }

    const dateA = getDateValue(a)
    const dateB = getDateValue(b)

    // Sort descending (latest first)
    return dateB - dateA
  })

  // Prepare chart data (keep chronological order for chart - oldest to newest)
  const chartData = [...rawTimeline]
    .sort((a, b) => {
      const getDateValue = (item) => {
        if (item.releaseDate) return new Date(item.releaseDate).getTime()
        if (item.date) return new Date(item.date).getTime()
        if (item.month) {
          const monthStr = String(item.month)
          if (monthStr.match(/^\d{4}-\d{2}/)) return new Date(monthStr + '-01').getTime()
          return Date.parse(monthStr) || 0
        }
        if (item.version) {
          const vStr = String(item.version).replace(/^v/i, '')
          const parts = vStr.split('.')
          return parts.length >= 2 ? parseFloat(parts[0]) * 10000 + parseFloat(parts[1] || 0) * 100 : 0
        }
        return 0
      }
      return getDateValue(a) - getDateValue(b)
    })
    .map(item => ({
      month: view === 'monthly'
        ? (item.month || item.period || item.date || item._key)
        : (item.version || item.date || item._key),
      rating: item.rating ?? item.avgRating ?? item.averageRating
    }))
    .filter(item => item.month && item.rating != null)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader app={metadata} />
        <TabNav />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingSpinner message="Loading timeline..." />
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
            <h1 className="text-2xl font-bold text-gray-900">Regression Timeline</h1>
            <p className="text-gray-500">Track when issues appeared and were resolved</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('version')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                view === 'version'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              By Version
            </button>
            <button
              onClick={() => setView('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                view === 'monthly'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              By Month
            </button>
          </div>
        </div>

        {/* Rating Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Rating Impact Over Time
          </h2>
          {chartData.length > 0 ? (
            <RatingTrendChart data={chartData} title="" />
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No rating data available for chart</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {view === 'version' ? 'Version History' : 'Monthly History'}
          </h2>

          {timeline.length > 0 ? (
            <div className="space-y-6">
              {/* Show warning if monthly view but data appears version-based */}
              {view === 'monthly' && timeline[0] && !timeline[0].month && !timeline[0].period && timeline[0].version && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  Note: Monthly aggregation not available. Showing version-based data.
                </div>
              )}
              {timeline.map((item, i) => {
                const ratingChange = item.ratingChange ?? item.change ?? 0
                const rating = item.rating ?? item.avgRating ?? item.averageRating

                // Get label based on view, with proper fallbacks
                const rawLabel = view === 'monthly'
                  ? (item.month || item.period || item.date || item._key || item.version || `Month ${i + 1}`)
                  : (item.version || item.date || item._key || item.month || `Version ${i + 1}`)
                const label = safeString(rawLabel)

                const releaseDate = safeString(item.releaseDate || item.release_date)
                const introduced = normalizeArray(item.introduced || item.newIssues)
                const resolved = normalizeArray(item.resolved || item.fixedIssues)
                const keyEvents = normalizeArray(item.keyEvents || item.events)
                const reviewCount = item.reviewCount ?? item.reviews

                // Get summary/description as safe string
                const summaryText = safeString(item.summary || item.description)

                return (
                  <div key={i} className="relative pl-8 pb-6 border-l-2 border-gray-200 last:pb-0">
                    {/* Timeline dot */}
                    <div className={`absolute left-[-9px] w-4 h-4 rounded-full border-2 border-white ${
                      ratingChange > 0 ? 'bg-green-500' :
                      ratingChange < 0 ? 'bg-red-500' : 'bg-gray-400'
                    }`} />

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{label}</h3>
                      {releaseDate && (
                        <span className="text-sm text-gray-500">
                          ({releaseDate.includes('T') ? new Date(releaseDate).toLocaleDateString() : releaseDate})
                        </span>
                      )}
                      {rating != null && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          ratingChange > 0 ? 'bg-green-100 text-green-700' :
                          ratingChange < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {Number(rating).toFixed(1)}
                          {ratingChange !== 0 && ` (${ratingChange > 0 ? '+' : ''}${Number(ratingChange).toFixed(2)})`}
                        </span>
                      )}
                      {item.sentiment && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          item.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                          item.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {safeString(item.sentiment)}
                        </span>
                      )}
                    </div>

                    {/* Issues Introduced */}
                    {introduced.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-red-600 font-medium mb-1">Issues Introduced:</p>
                        <ul className="space-y-1">
                          {introduced.map((issue, j) => {
                            const text = getIssueText(issue)
                            return text ? (
                              <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-red-500 mt-0.5">✗</span>
                                <span>{text}</span>
                              </li>
                            ) : null
                          }).filter(Boolean)}
                        </ul>
                      </div>
                    )}

                    {/* Issues Resolved */}
                    {resolved.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-green-600 font-medium mb-1">Issues Resolved:</p>
                        <ul className="space-y-1">
                          {resolved.map((issue, j) => {
                            const text = getIssueText(issue)
                            return text ? (
                              <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>{text}</span>
                              </li>
                            ) : null
                          }).filter(Boolean)}
                        </ul>
                      </div>
                    )}

                    {/* Key Events */}
                    {keyEvents.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-blue-600 font-medium mb-1">Key Events:</p>
                        <ul className="space-y-1">
                          {keyEvents.map((event, j) => {
                            const text = getEventText(event)
                            return text ? (
                              <li key={j} className="text-sm text-gray-600">
                                • {text}
                              </li>
                            ) : null
                          }).filter(Boolean)}
                        </ul>
                      </div>
                    )}

                    {/* Summary */}
                    {summaryText && (
                      <p className="text-sm text-gray-600 mb-2">{summaryText}</p>
                    )}

                    {/* Review Count */}
                    {reviewCount != null && (
                      <p className="text-sm text-gray-500">{reviewCount} reviews</p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No timeline data available</p>
              <p className="text-sm mt-2">
                {data === null
                  ? 'API returned null'
                  : data?.error
                  ? `Error: ${data.error}`
                  : data?.message
                  ? `Message: ${data.message}`
                  : `Response has ${Object.keys(data || {}).length} keys: ${Object.keys(data || {}).join(', ')}`
                }
              </p>
              {data && !Array.isArray(data) && Object.keys(data).length > 0 && (
                <div className="mt-4 text-left max-w-lg mx-auto">
                  <p className="text-xs text-gray-400 mb-2">Raw response preview:</p>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32 text-left">
                    {JSON.stringify(data, null, 2).slice(0, 500)}
                    {JSON.stringify(data, null, 2).length > 500 ? '...' : ''}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
