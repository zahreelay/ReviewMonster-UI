import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOverview, discoverCompetitors } from '../services/api'
import AppHeader from '../components/AppHeader'
import TabNav from '../components/TabNav'
import LoadingSpinner from '../components/LoadingSpinner'
import RatingTrendChart from '../components/RatingTrendChart'
import IssueCard from '../components/IssueCard'
import RequestCard from '../components/RequestCard'
import StrengthCard from '../components/StrengthCard'

// Component to display a sample review
function SampleReview({ review }) {
  if (!review) return null
  return (
    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-yellow-500">
          {'★'.repeat(review.rating || 0)}{'☆'.repeat(5 - (review.rating || 0))}
        </span>
        {review.version && <span className="text-gray-400">v{review.version}</span>}
      </div>
      <p className="text-gray-600 italic line-clamp-2">"{review.body || review.text || review.content}"</p>
    </div>
  )
}

// Severity badge component
function SeverityBadge({ severity }) {
  const styles = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[severity] || styles.medium}`}>
      {severity}
    </span>
  )
}

// Expandable description component
function ExpandableDescription({ text }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text && text.length > 300

  if (!text) return null

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
      <p className={`text-sm text-gray-600 whitespace-pre-line ${!expanded && isLong ? 'line-clamp-4' : ''}`}>
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

// Safe array helper - returns array or empty array
function safeArray(value) {
  return Array.isArray(value) ? value : []
}

// Rating Drivers Infographic Component
function RatingDriversInfographic({ strengths = [], issues = [] }) {
  // Ensure arrays
  const safeStrengths = Array.isArray(strengths) ? strengths : []
  const safeIssues = Array.isArray(issues) ? issues : []

  // Calculate totals for the gauge
  const totalStrengthMentions = safeStrengths.reduce((sum, s) => {
    const count = typeof s === 'object' && s !== null ? (s.count || s.mentions || 1) : 1
    return sum + count
  }, 0)

  const totalIssueMentions = safeIssues.reduce((sum, s) => {
    const count = typeof s === 'object' && s !== null ? (s.count || s.mentions || 1) : 1
    return sum + count
  }, 0)

  const total = totalStrengthMentions + totalIssueMentions
  const positivePercent = total > 0 ? Math.round((totalStrengthMentions / total) * 100) : 50
  const sentiment = positivePercent >= 60 ? 'positive' : positivePercent <= 40 ? 'negative' : 'mixed'

  // Get max count for bar scaling
  const allCounts = [
    ...safeStrengths.map(s => typeof s === 'object' && s !== null ? (s.count || s.mentions || 1) : 1),
    ...safeIssues.map(s => typeof s === 'object' && s !== null ? (s.count || s.mentions || 1) : 1)
  ]
  const maxCount = Math.max(...allCounts, 1)

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
      {/* Header with Sentiment Gauge */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Rating Drivers Analysis</h3>

        {/* Sentiment Gauge */}
        <div className="inline-flex flex-col items-center">
          <div className="relative w-48 h-24 overflow-hidden">
            {/* Gauge Background */}
            <svg viewBox="0 0 200 100" className="w-full h-full">
              {/* Background arc */}
              <path
                d="M 20 90 A 80 80 0 0 1 180 90"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Colored segments */}
              <path
                d="M 20 90 A 80 80 0 0 1 60 30"
                fill="none"
                stroke="#ef4444"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M 60 30 A 80 80 0 0 1 140 30"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="16"
              />
              <path
                d="M 140 30 A 80 80 0 0 1 180 90"
                fill="none"
                stroke="#22c55e"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Needle */}
              <line
                x1="100"
                y1="90"
                x2={100 + 60 * Math.cos((Math.PI * (180 - positivePercent * 1.8)) / 180)}
                y2={90 - 60 * Math.sin((Math.PI * (180 - positivePercent * 1.8)) / 180)}
                stroke="#1f2937"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Center dot */}
              <circle cx="100" cy="90" r="6" fill="#1f2937" />
            </svg>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-2xl font-bold ${
              sentiment === 'positive' ? 'text-green-600' :
              sentiment === 'negative' ? 'text-red-600' : 'text-amber-600'
            }`}>
              {positivePercent}%
            </span>
            <span className="text-sm text-gray-500">Positive Sentiment</span>
          </div>
        </div>
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Positive Drivers */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">What Users Love</h4>
              <p className="text-xs text-green-600">{totalStrengthMentions} positive mentions</p>
            </div>
          </div>
          {safeStrengths.length > 0 ? (
            <div className="space-y-3">
              {safeStrengths.slice(0, 5).map((driver, i) => {
                const text = typeof driver === 'string' ? driver : (driver?.title || driver?.name || driver?.text || String(driver))
                const count = typeof driver === 'object' && driver !== null ? (driver.count || driver.mentions || 1) : 1
                const barWidth = Math.max(20, (count / maxCount) * 100)
                return (
                  <div key={i} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 font-medium truncate pr-2">{text}</span>
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {count} mentions
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No positive drivers found</p>
          )}
        </div>

        {/* Negative Drivers */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-red-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-rose-500 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Pain Points</h4>
              <p className="text-xs text-red-600">{totalIssueMentions} negative mentions</p>
            </div>
          </div>
          {safeIssues.length > 0 ? (
            <div className="space-y-3">
              {safeIssues.slice(0, 5).map((driver, i) => {
                const text = typeof driver === 'string' ? driver : (driver?.title || driver?.name || driver?.text || String(driver))
                const count = typeof driver === 'object' && driver !== null ? (driver.count || driver.mentions || 1) : 1
                const barWidth = Math.max(20, (count / maxCount) * 100)
                return (
                  <div key={i} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 font-medium truncate pr-2">{text}</span>
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {count} mentions
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-400 to-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No pain points found</p>
          )}
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
            <span className="text-sm text-gray-600">{safeStrengths.length} Strengths</span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-rose-500"></div>
            <span className="text-sm text-gray-600">{safeIssues.length} Issues</span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500"></div>
            <span className="text-sm text-gray-600">{total} Total Mentions</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// MemoSection component - extracted for cleaner code and error handling
function MemoSection({ memo, sampleReviews }) {
  if (!memo) return null

  // If memo is a string, render it simply
  if (typeof memo === 'string') {
    return (
      <div id="ai-brief" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <MemoHeader />
        <div className="p-6">
          <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">{memo}</p>
        </div>
      </div>
    )
  }

  // Safely extract arrays from memo object
  const summary = memo.summary || memo.text || memo.content || ''
  const keyFindings = safeArray(memo.keyFindings || memo.findings || memo.insights)
  const strengths = safeArray(memo.strengths || memo.positiveDrivers || memo.positive || memo.pros || memo.likes)
  const issues = safeArray(memo.issues || memo.negativeDrivers || memo.weaknesses || memo.negative || memo.cons || memo.dislikes || memo.problems)
  const recommendations = safeArray(memo.recommendations || memo.actions || memo.suggestions)
  const alerts = safeArray(memo.alerts || memo.warnings)
  const reviews = safeArray(memo.sampleReviews || memo.reviews || sampleReviews)

  // Debug: log memo structure to console
  console.log('[MemoSection] memo keys:', Object.keys(memo))
  console.log('[MemoSection] strengths:', strengths)
  console.log('[MemoSection] issues:', issues)

  return (
    <div id="ai-brief" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <MemoHeader />
      <div className="p-6 space-y-6">
        {/* Summary */}
        {summary && (
          <p className="text-gray-700 text-base leading-relaxed">{summary}</p>
        )}

        {/* Key Findings */}
        {keyFindings.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Key Findings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {keyFindings.map((finding, i) => (
                <div key={i} className="bg-emerald-50 rounded-lg p-3 border-l-4 border-emerald-400">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {typeof finding === 'string' ? finding : (finding?.text || finding?.title || String(finding))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rating Drivers Infographic - Always show */}
        <RatingDriversInfographic strengths={strengths} issues={issues} />

        {/* Sample Reviews */}
        {reviews.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              What Users Are Saying
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {reviews.slice(0, 6).map((review, i) => {
                if (!review || typeof review !== 'object') return null
                return (
                  <div key={i} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(star => (
                          <span key={star} className={star <= (review.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                        ))}
                      </div>
                      {review.version && <span className="text-xs text-gray-400">v{review.version}</span>}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3 italic">"{review.body || review.text || review.content || ''}"</p>
                    {review.date && (
                      <p className="text-xs text-gray-400 mt-2">{new Date(review.date).toLocaleDateString()}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recommendations + Alerts */}
        {(recommendations.length > 0 || alerts.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className={alerts.length > 0 ? "lg:col-span-3" : "lg:col-span-5"}>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Recommended Actions
                </h3>
                <div className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">{i + 1}</span>
                      <p className="text-sm text-gray-700 leading-relaxed">{typeof rec === 'string' ? rec : (rec?.text || rec?.title || String(rec))}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className={recommendations.length > 0 ? "lg:col-span-2" : "lg:col-span-5"}>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Alerts
                </h3>
                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                  <ul className="space-y-3">
                    {alerts.map((alert, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                        <span className="text-red-400 mt-0.5">!</span>
                        <span>{typeof alert === 'string' ? alert : (alert?.text || alert?.message || String(alert))}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Memo Header component
function MemoHeader() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white">AI Intelligence Brief</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-blue-100">{new Date().toLocaleDateString()}</span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition print:hidden"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>
    </div>
  )
}

// Rating trend badge component
function RatingTrendBadge({ quickInsights, ratingHistory }) {
  // Helper to extract rating from various field names
  const getRating = (item) => {
    if (!item) return null
    const val = item.rating ?? item.avgRating ?? item.averageRating ?? item.avg ?? item.value ?? item.score
    return typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val) : null)
  }

  // If quickInsights has ratingTrend, use it
  if (quickInsights?.ratingTrend) {
    const { direction, change, period } = quickInsights.ratingTrend
    return (
      <div className="mt-2">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          direction === 'up'
            ? 'bg-green-100 text-green-700'
            : direction === 'down'
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→'}
          {' '}{Math.abs(change || 0).toFixed(1)}
          {' '}({period || 'recent'})
        </span>
      </div>
    )
  }

  // Otherwise calculate from ratingHistory
  if (!ratingHistory || !Array.isArray(ratingHistory) || ratingHistory.length < 2) {
    return null
  }

  // Get last 3 entries with valid ratings
  const validEntries = ratingHistory
    .map(item => ({ ...item, _rating: getRating(item) }))
    .filter(item => item._rating !== null && !isNaN(item._rating))

  if (validEntries.length < 2) {
    return null
  }

  const recent = validEntries.slice(-3)
  const first = recent[0]._rating
  const last = recent[recent.length - 1]._rating
  const change = last - first
  const direction = change > 0.05 ? 'up' : change < -0.05 ? 'down' : 'stable'

  return (
    <div className="mt-2">
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        direction === 'up'
          ? 'bg-green-100 text-green-700'
          : direction === 'down'
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-700'
      }`}>
        {direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→'}
        {' '}{Math.abs(change).toFixed(2)} (last {recent.length} periods)
      </span>
    </div>
  )
}

export default function DashboardPage() {
  const { appId } = useParams()
  const [data, setData] = useState(null)
  const [competitiveData, setCompetitiveData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadData() {
      console.log('[Dashboard] Loading overview for appId:', appId)
      try {
        const result = await getOverview(appId)
        console.log('[Dashboard] Overview data received:', result)
        setData(result)

        // Discover competitors (runs in background, returns discovered list)
        try {
          const discoveryResult = await discoverCompetitors(appId)
          console.log('[Dashboard] Discovery result:', discoveryResult)

          // Extract competitors from various possible structures
          const competitors =
            discoveryResult?.competitors ||
            discoveryResult?.topCompetitors ||
            discoveryResult?.discovered ||
            (Array.isArray(discoveryResult) ? discoveryResult : [])

          if (competitors.length > 0) {
            setCompetitiveData({ competitors })
          }
        } catch (discoverErr) {
          console.log('[Dashboard] Competitor discovery failed:', discoverErr.message)
        }
      } catch (err) {
        console.error('[Dashboard] Error loading overview:', err)
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
        <AppHeader />
        <TabNav />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingSpinner message="Loading dashboard..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <TabNav />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      </div>
    )
  }

  // Handle various possible response structures
  // The API might return data directly or nested under different keys
  const rawMetadata = data?.metadata || data?.app || data?.appMetadata || data

  // Flatten metadata - it might have the iTunes response nested
  const metadata = {
    // App name
    name: rawMetadata?.name || rawMetadata?.trackName || rawMetadata?.appName,
    // Developer
    developer: rawMetadata?.developer || rawMetadata?.sellerName || rawMetadata?.artistName || rawMetadata?.seller,
    // Icon - try all possible iTunes API field names
    iconUrl: rawMetadata?.iconUrl || rawMetadata?.icon || rawMetadata?.artworkUrl512 || rawMetadata?.artworkUrl100 || rawMetadata?.artworkUrl60 || rawMetadata?.artwork,
    // Rating
    rating: rawMetadata?.rating ?? rawMetadata?.averageUserRating ?? rawMetadata?.averageUserRatingForCurrentVersion ?? rawMetadata?.stars,
    // Review count
    reviewCount: rawMetadata?.reviewCount ?? rawMetadata?.userRatingCount ?? rawMetadata?.userRatingCountForCurrentVersion ?? rawMetadata?.ratingCount ?? rawMetadata?.reviews,
    // Category
    category: rawMetadata?.category || rawMetadata?.primaryGenreName || rawMetadata?.genre || rawMetadata?.genres?.[0],
    // Version
    version: rawMetadata?.version || rawMetadata?.currentVersion || rawMetadata?.bundleShortVersion,
    // Release date
    releaseDate: rawMetadata?.releaseDate || rawMetadata?.currentVersionReleaseDate || rawMetadata?.updatedDate,
    // Price
    price: rawMetadata?.price ?? rawMetadata?.formattedPrice,
    // Description
    description: rawMetadata?.description || rawMetadata?.trackDescription || rawMetadata?.desc,
    // Keep original for any other fields
    ...rawMetadata
  }

  console.log('[Dashboard] Raw metadata from API:', rawMetadata)
  console.log('[Dashboard] Processed metadata:', metadata)

  const { quickInsights, ratingHistory, metrics, memo, sampleReviews, alerts } = data || {}

  // Debug log to see data structure
  console.log('[Dashboard] memo:', memo)
  console.log('[Dashboard] quickInsights:', quickInsights)
  console.log('[Dashboard] sampleReviews:', sampleReviews)

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader app={metadata} />
      <TabNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* App Metadata Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            {/* App Icon */}
            {metadata?.iconUrl ? (
              <img
                src={metadata.iconUrl}
                alt={metadata.name || 'App'}
                className="w-20 h-20 rounded-2xl shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gray-200 flex items-center justify-center text-3xl">
                📱
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {metadata?.name || 'Unknown App'}
              </h1>
              <p className="text-gray-500">
                {metadata?.developer || 'Unknown Developer'}
              </p>

              {/* Version and Release Date */}
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                {metadata?.version && (
                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                    v{metadata.version}
                  </span>
                )}
                {metadata?.releaseDate && (
                  <span>
                    Released: {new Date(metadata.releaseDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Stats Row */}
              <div className="mt-2 flex items-center gap-4 text-sm flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-500 text-lg">★</span>
                  <span className="font-semibold">
                    {metadata?.rating?.toFixed(1) || 'N/A'}
                  </span>
                </span>
                <span className="text-gray-400">•</span>
                <span>
                  {(metadata?.reviewCount ?? 0).toLocaleString()} reviews
                </span>
                <span className="text-gray-400">•</span>
                <span>{metadata?.category || 'Unknown Category'}</span>
                {metadata?.price !== undefined && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span>
                      {typeof metadata.price === 'string' ? metadata.price : (metadata.price === 0 ? 'Free' : `$${metadata.price}`)}
                    </span>
                  </>
                )}
              </div>

              {/* Rating Trend Badge */}
              <RatingTrendBadge quickInsights={quickInsights} ratingHistory={ratingHistory} />
            </div>
          </div>

          {/* Full Description - Expandable */}
          {(metadata?.description || metadata?.trackDescription) && (
            <ExpandableDescription text={metadata.description || metadata.trackDescription} />
          )}
        </div>

        {/* Metrics Row */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            {metrics.totalReviews !== undefined && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{metrics.totalReviews.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Reviews</p>
              </div>
            )}
            {metrics.avgRating !== undefined && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{metrics.avgRating.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Avg Rating</p>
              </div>
            )}
            {metrics.sentimentBreakdown && (
              <>
                <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{metrics.sentimentBreakdown.positive || 0}</p>
                  <p className="text-sm text-gray-500">Positive</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-600">{metrics.sentimentBreakdown.neutral || 0}</p>
                  <p className="text-sm text-gray-500">Neutral</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{metrics.sentimentBreakdown.negative || 0}</p>
                  <p className="text-sm text-gray-500">Negative</p>
                </div>
              </>
            )}
            {metrics.responseRate !== undefined && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{(metrics.responseRate * 100).toFixed(0)}%</p>
                <p className="text-sm text-gray-500">Response Rate</p>
              </div>
            )}
          </div>
        )}

        {/* AI Insights Memo */}
        {memo && (
          <MemoSection memo={memo} sampleReviews={sampleReviews} />
        )}

        {/* Alerts Section */}
        {alerts && alerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
              <span>⚠️</span> Alerts
            </h3>
            <ul className="space-y-2">
              {alerts.map((alert, i) => (
                <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>{typeof alert === 'string' ? alert : alert.message || alert.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {quickInsights?.topIssue && (
            <Link to={`/app/${appId}/issues`} className="block">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition h-full">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <span>🔴</span>
                  <span className="text-sm font-medium">Top Issue</span>
                  {quickInsights.topIssue.severity && (
                    <SeverityBadge severity={quickInsights.topIssue.severity} />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{quickInsights.topIssue.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {quickInsights.topIssue.count} reports
                  {quickInsights.topIssue.impactScore && ` • Impact: ${quickInsights.topIssue.impactScore}`}
                </p>
                {quickInsights.topIssue.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{quickInsights.topIssue.description}</p>
                )}
                {quickInsights.topIssue.sampleReview && (
                  <SampleReview review={quickInsights.topIssue.sampleReview} />
                )}
              </div>
            </Link>
          )}

          {quickInsights?.topRequest && (
            <Link to={`/app/${appId}/requests`} className="block">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition h-full">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <span>✨</span>
                  <span className="text-sm font-medium">Top Request</span>
                  {quickInsights.topRequest.demand && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      quickInsights.topRequest.demand === 'high' ? 'bg-purple-100 text-purple-700' :
                      quickInsights.topRequest.demand === 'medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {quickInsights.topRequest.demand} demand
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{quickInsights.topRequest.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {quickInsights.topRequest.count} requests
                  {quickInsights.topRequest.demandScore && ` • Score: ${quickInsights.topRequest.demandScore}`}
                </p>
                {quickInsights.topRequest.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{quickInsights.topRequest.description}</p>
                )}
                {quickInsights.topRequest.sampleReview && (
                  <SampleReview review={quickInsights.topRequest.sampleReview} />
                )}
              </div>
            </Link>
          )}

          {quickInsights?.topStrength && (
            <Link to={`/app/${appId}/strengths`} className="block">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition h-full">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <span>💪</span>
                  <span className="text-sm font-medium">Top Strength</span>
                </div>
                <h3 className="font-semibold text-gray-900">{quickInsights.topStrength.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {quickInsights.topStrength.count} mentions
                </p>
                {quickInsights.topStrength.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{quickInsights.topStrength.description}</p>
                )}
                {quickInsights.topStrength.sampleReview && (
                  <SampleReview review={quickInsights.topStrength.sampleReview} />
                )}
              </div>
            </Link>
          )}
        </div>

        {/* Rating Trend Chart */}
        {ratingHistory && ratingHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Trend (Last 12 Months)</h2>
            <RatingTrendChart data={ratingHistory} title="" />
          </div>
        )}

        {/* Top Competitors Section */}
        {competitiveData?.competitors?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Top Competitors</h2>
                <p className="text-sm text-gray-500">{competitiveData.competitors.length} similar apps discovered</p>
              </div>
              <Link to={`/app/${appId}/competitors`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View Full Analysis →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {competitiveData.competitors.slice(0, 10).map((comp, i) => {
                const name = comp.name || comp.trackName || comp.appName || `Competitor ${i + 1}`
                const icon = comp.iconUrl || comp.icon || comp.artworkUrl512 || comp.artworkUrl100 || comp.artworkUrl60
                const rating = comp.rating ?? comp.averageUserRating
                const reviewCount = comp.reviewCount ?? comp.userRatingCount
                const category = comp.category || comp.primaryGenreName
                const developer = comp.developer || comp.sellerName || comp.artistName

                return (
                  <div key={comp.appId || comp.trackId || i} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 hover:shadow-md transition-all border border-gray-100">
                    <div className="flex items-start gap-3">
                      {icon ? (
                        <img src={icon} alt={name} className="w-14 h-14 rounded-xl shadow-sm flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-sm">
                          {(name || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm" title={name}>{name}</p>
                        {developer && (
                          <p className="text-xs text-gray-500 truncate" title={developer}>{developer}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm font-semibold text-gray-800">{rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                      {reviewCount && (
                        <span className="text-xs text-gray-500">
                          {reviewCount >= 1000 ? `${(reviewCount / 1000).toFixed(1)}k` : reviewCount} reviews
                        </span>
                      )}
                    </div>
                    {category && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-0.5 bg-white rounded-full text-xs text-gray-600 border border-gray-200">
                          {category}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Insights Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Top Issues */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Top Issues</h2>
              <Link to={`/app/${appId}/issues`} className="text-sm text-blue-600 hover:text-blue-700">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {quickInsights?.issues?.slice(0, 3).map((issue, i) => (
                <div key={issue.id || i}>
                  <IssueCard issue={issue} />
                  {issue.sampleReview && <SampleReview review={issue.sampleReview} />}
                </div>
              ))}
              {(!quickInsights?.issues || quickInsights.issues.length === 0) && (
                <p className="text-gray-500 text-sm">No issues found</p>
              )}
            </div>
          </div>

          {/* Top Requests */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Top Requests</h2>
              <Link to={`/app/${appId}/requests`} className="text-sm text-blue-600 hover:text-blue-700">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {quickInsights?.requests?.slice(0, 3).map((request, i) => (
                <div key={request.id || i}>
                  <RequestCard request={request} />
                  {request.sampleReview && <SampleReview review={request.sampleReview} />}
                </div>
              ))}
              {(!quickInsights?.requests || quickInsights.requests.length === 0) && (
                <p className="text-gray-500 text-sm">No feature requests found</p>
              )}
            </div>
          </div>

          {/* Top Strengths */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Top Strengths</h2>
              <Link to={`/app/${appId}/strengths`} className="text-sm text-blue-600 hover:text-blue-700">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {quickInsights?.strengths?.slice(0, 3).map((strength, i) => (
                <div key={strength.id || i}>
                  <StrengthCard strength={strength} />
                  {strength.sampleReview && <SampleReview review={strength.sampleReview} />}
                </div>
              ))}
              {(!quickInsights?.strengths || quickInsights.strengths.length === 0) && (
                <p className="text-gray-500 text-sm">No strengths found</p>
              )}
            </div>
          </div>
        </div>

        {/* Sample Reviews Section */}
        {sampleReviews && sampleReviews.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sampleReviews.slice(0, 6).map((review, i) => (
                <div key={review.id || i} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">
                        {'★'.repeat(review.rating || 0)}{'☆'.repeat(5 - (review.rating || 0))}
                      </span>
                      <span className="text-sm font-medium text-gray-700">{review.rating}/5</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {review.version && `v${review.version}`}
                      {review.date && ` • ${new Date(review.date).toLocaleDateString()}`}
                    </div>
                  </div>
                  {review.title && (
                    <p className="font-medium text-gray-900 text-sm mb-1">{review.title}</p>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-3">{review.body || review.text || review.content}</p>
                  {review.author && (
                    <p className="text-xs text-gray-400 mt-2">— {review.author}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
