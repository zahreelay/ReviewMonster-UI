import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { queryApp, getOverview } from '../services/api'
import AppHeader from '../components/AppHeader'
import TabNav from '../components/TabNav'
import LoadingSpinner from '../components/LoadingSpinner'

const EXAMPLE_QUERIES = [
  "What's the main issue users are complaining about?",
  "What features do users want the most?",
  "How has the rating changed in the last 3 months?",
  "What do users love about this app?",
  "What bugs were introduced in recent versions?",
]

export default function QueryPage() {
  const { appId } = useParams()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    async function loadMetadata() {
      try {
        const data = await getOverview(appId)
        setMetadata(data.metadata)
      } catch (err) {
        console.error('Failed to load metadata:', err)
      }
    }
    loadMetadata()
  }, [appId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await queryApp(appId, query)
      setResult(data)
      setHistory((prev) => [
        { query, answer: data.answer, timestamp: new Date().toISOString() },
        ...prev.slice(0, 9),
      ])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleExampleClick(exampleQuery) {
    setQuery(exampleQuery)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader app={metadata} />
      <TabNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Query Console</h1>
          <p className="text-gray-500">Ask questions about your app's reviews</p>
        </div>

        {/* Query Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ask a question
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., What are users complaining about?"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Asking...' : 'Ask'}
              </button>
            </div>
          </form>

          {/* Example Queries */}
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.map((example, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(example)}
                  className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Analyzing reviews...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                💬
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Answer</p>
                <div className="prose prose-sm max-w-none text-gray-800">
                  {result.answer.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-2">{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Sources */}
            {result.sources && result.sources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Sources:</p>
                <div className="space-y-2">
                  {result.sources.map((source, i) => (
                    <div key={i} className="text-sm bg-gray-50 rounded-lg p-3">
                      {source.type === 'own_request' && (
                        <span className="text-purple-600">✨ Feature Request: </span>
                      )}
                      {source.type === 'own_issue' && (
                        <span className="text-red-600">🔴 Issue: </span>
                      )}
                      {source.type === 'own_strength' && (
                        <span className="text-green-600">💪 Strength: </span>
                      )}
                      {source.type === 'review' && (
                        <span className="text-gray-600">📝 Review: </span>
                      )}
                      <span className="text-gray-800">{source.feature || source.title || source.content}</span>
                      {source.count && (
                        <span className="text-gray-500"> ({source.count} mentions)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence */}
            {result.confidence && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <span>Confidence:</span>
                <span className={`font-medium ${
                  result.confidence === 'high' ? 'text-green-600' :
                  result.confidence === 'medium' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Query History */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous Queries</h2>
            <div className="space-y-3">
              {history.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(item.query)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{item.query}</p>
                  <p className="text-sm text-gray-500 truncate mt-1">{item.answer}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
