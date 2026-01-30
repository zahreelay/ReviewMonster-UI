import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getSWOT, getOverview, getCompetitors, discoverCompetitors } from '../services/api'
import AppHeader from '../components/AppHeader'
import TabNav from '../components/TabNav'
import LoadingSpinner from '../components/LoadingSpinner'

// Helper to extract text from various data structures
function getText(item) {
  if (!item) return ''
  if (typeof item === 'string') return item
  return item.title || item.name || item.text || item.description || item.message || ''
}

export default function CompetitorsPage() {
  const { appId } = useParams()
  const [swotData, setSwotData] = useState(null)
  const [competitorsData, setCompetitorsData] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingPhase, setLoadingPhase] = useState('discovery') // 'discovery' | 'analysis'
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setLoadingPhase('discovery')

      try {
        // First, get overview for metadata display
        const overview = await getOverview(appId)
        console.log('[Competitors] Overview:', overview)

        // Normalize metadata
        const rawMeta = overview?.metadata || overview?.app || overview
        setMetadata({
          name: rawMeta?.name || rawMeta?.trackName,
          iconUrl: rawMeta?.iconUrl || rawMeta?.icon || rawMeta?.artworkUrl512 || rawMeta?.artworkUrl100,
          rating: rawMeta?.rating ?? rawMeta?.averageUserRating,
          reviewCount: rawMeta?.reviewCount ?? rawMeta?.userRatingCount,
          ...rawMeta
        })

        // Step 1: Run competitor discovery first
        console.log('[Competitors] Starting discovery...')
        try {
          const discoveryResult = await discoverCompetitors(appId)
          console.log('[Competitors] Discovery result:', discoveryResult)
        } catch (discoverErr) {
          console.log('[Competitors] Discovery failed (may already exist):', discoverErr.message)
          // Continue even if discovery fails - competitors might already be discovered
        }

        // Step 2: Now fetch competitive analysis data
        setLoadingPhase('analysis')
        console.log('[Competitors] Fetching competitive analysis...')

        const [swotResponse, competitorsResponse] = await Promise.all([
          getSWOT(appId).catch(err => {
            console.log('[Competitors] SWOT fetch failed:', err.message)
            return null
          }),
          getCompetitors(appId).catch(err => {
            console.log('[Competitors] Competitors fetch failed:', err.message)
            return null
          })
        ])

        console.log('[Competitors] SWOT Response:', swotResponse)
        console.log('[Competitors] Competitors Response:', competitorsResponse)

        setSwotData(swotResponse)
        setCompetitorsData(competitorsResponse)
      } catch (err) {
        console.error('[Competitors] Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [appId])

  if (loading) {
    const loadingMessage = loadingPhase === 'discovery'
      ? 'Discovering competitors...'
      : 'Loading competitive analysis...'

    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader app={metadata} />
        <TabNav />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingSpinner message={loadingMessage} />
          {loadingPhase === 'discovery' && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Finding apps similar to yours in the App Store...
            </p>
          )}
          {loadingPhase === 'analysis' && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Analyzing competitor data and generating insights...
            </p>
          )}
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

  // Extract competitors from multiple possible sources
  const competitors =
    competitorsData?.competitors ||
    competitorsData?.topCompetitors ||
    competitorsData?.discovered ||
    (Array.isArray(competitorsData) ? competitorsData : null) ||
    swotData?.competitors ||
    swotData?.topCompetitors ||
    swotData?.discovered ||
    []

  // Extract SWOT data
  const swot = swotData?.swot || swotData?.analysis?.swot || swotData
  const featureMatrix = swotData?.featureMatrix || swotData?.featureComparison || swotData?.features || []
  const strategicInsights = swotData?.strategicInsights || swotData?.insights || swotData?.recommendations || []

  // Check if SWOT exists at top level or nested
  const strengths = swot?.strengths || swotData?.strengths || []
  const weaknesses = swot?.weaknesses || swotData?.weaknesses || []
  const opportunities = swot?.opportunities || swotData?.opportunities || []
  const threats = swot?.threats || swotData?.threats || []

  const hasSwotData = strengths.length > 0 || weaknesses.length > 0 || opportunities.length > 0 || threats.length > 0
  const hasAnyData = competitors.length > 0 || hasSwotData || featureMatrix.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader app={metadata} />
      <TabNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Competitive Analysis</h1>
          <p className="text-gray-500">See how you stack up against competitors</p>
        </div>

        {/* Top Competitors */}
        {competitors.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Top Competitors ({competitors.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {competitors.slice(0, 10).map((comp, i) => {
                const name = comp.name || comp.trackName || comp.appName || `Competitor ${i + 1}`
                const icon = comp.iconUrl || comp.icon || comp.artworkUrl100 || comp.artworkUrl60
                const rating = comp.rating ?? comp.averageUserRating
                const reviewCount = comp.reviewCount ?? comp.userRatingCount
                const category = comp.category || comp.primaryGenreName

                return (
                  <div key={comp.appId || i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    {icon ? (
                      <img src={icon} alt={name} className="w-14 h-14 rounded-xl shadow-sm" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-400">
                        {i + 1}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm font-medium text-gray-700">
                          {rating?.toFixed(1) || 'N/A'}
                        </span>
                        {reviewCount && (
                          <span className="text-sm text-gray-500">
                            ({reviewCount.toLocaleString()} reviews)
                          </span>
                        )}
                      </div>
                      {category && (
                        <p className="text-xs text-gray-500 mt-1">{category}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SWOT Analysis */}
        {hasSwotData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SWOT Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center text-green-700 font-bold">S</span>
                  Strengths ({strengths.length})
                </h3>
                <ul className="space-y-2">
                  {strengths.map((item, i) => (
                    <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                      <span>{getText(item)}</span>
                    </li>
                  ))}
                  {strengths.length === 0 && (
                    <li className="text-sm text-green-600 italic">None identified</li>
                  )}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center text-red-700 font-bold">W</span>
                  Weaknesses ({weaknesses.length})
                </h3>
                <ul className="space-y-2">
                  {weaknesses.map((item, i) => (
                    <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5 flex-shrink-0">✗</span>
                      <span>{getText(item)}</span>
                    </li>
                  ))}
                  {weaknesses.length === 0 && (
                    <li className="text-sm text-red-600 italic">None identified</li>
                  )}
                </ul>
              </div>

              {/* Opportunities */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold">O</span>
                  Opportunities ({opportunities.length})
                </h3>
                <ul className="space-y-2">
                  {opportunities.map((item, i) => (
                    <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5 flex-shrink-0">→</span>
                      <span>{getText(item)}</span>
                    </li>
                  ))}
                  {opportunities.length === 0 && (
                    <li className="text-sm text-blue-600 italic">None identified</li>
                  )}
                </ul>
              </div>

              {/* Threats */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 font-bold">T</span>
                  Threats ({threats.length})
                </h3>
                <ul className="space-y-2">
                  {threats.map((item, i) => (
                    <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
                      <span>{getText(item)}</span>
                    </li>
                  ))}
                  {threats.length === 0 && (
                    <li className="text-sm text-amber-600 italic">None identified</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Feature Comparison Matrix */}
        {featureMatrix.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Feature Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">You</th>
                    {competitors.slice(0, 3).map((comp, i) => (
                      <th key={i} className="text-center py-3 px-4 font-semibold text-gray-900">
                        {(comp.name || comp.trackName || '').split(' ')[0] || `Comp ${i + 1}`}
                      </th>
                    ))}
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Insight</th>
                  </tr>
                </thead>
                <tbody>
                  {featureMatrix.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">{row.feature || row.name}</td>
                      <td className="py-3 px-4 text-center">
                        {row.mainApp || row.you || row.hasFeature ? (
                          <span className="text-green-500 text-lg">✓</span>
                        ) : (
                          <span className="text-red-400 text-lg">✗</span>
                        )}
                      </td>
                      {competitors.slice(0, 3).map((comp, j) => (
                        <td key={j} className="py-3 px-4 text-center">
                          {row[`comp${j}`] || row[comp.appId] || row.competitors?.[j] ? (
                            <span className="text-green-500 text-lg">✓</span>
                          ) : (
                            <span className="text-red-400 text-lg">✗</span>
                          )}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-gray-600">
                        {(row.insight || row.note) && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            (row.insight || row.note || '').toLowerCase().includes('gap')
                              ? 'bg-red-100 text-red-700'
                              : (row.insight || row.note || '').toLowerCase().includes('win') ||
                                (row.insight || row.note || '').toLowerCase().includes('advantage')
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {row.insight || row.note}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Strategic Insights */}
        {strategicInsights.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Strategic Insights</h2>
            <ul className="space-y-3">
              {strategicInsights.map((insight, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <span className="text-blue-500 mt-0.5 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </span>
                  <span className="text-gray-700">{getText(insight)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No Data State */}
        {!hasAnyData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Competitive Data Yet</h3>
            <p className="text-gray-500">
              Competitor analysis hasn't been generated for this app yet.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
