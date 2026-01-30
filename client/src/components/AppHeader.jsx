import { Link } from 'react-router-dom'

// ReviewMonster Logo Component
function Logo() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#2563EB"/>
      <path d="M14 18C14 16.8954 14.8954 16 16 16H32C33.1046 16 34 16.8954 34 18V30C34 31.1046 33.1046 32 32 32H16C14.8954 32 14 31.1046 14 30V18Z" fill="white"/>
      <circle cx="20" cy="22" r="2" fill="#2563EB"/>
      <circle cx="28" cy="22" r="2" fill="#2563EB"/>
      <path d="M20 27C20 27 22 29 24 29C26 29 28 27 28 27" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 14L14 18" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"/>
      <path d="M38 14L34 18" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 10V16" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export default function AppHeader({ app: rawApp }) {
  // Normalize app metadata fields
  const app = rawApp ? {
    name: rawApp.name || rawApp.trackName || rawApp.appName,
    iconUrl: rawApp.iconUrl || rawApp.icon || rawApp.artworkUrl512 || rawApp.artworkUrl100 || rawApp.artworkUrl60 || rawApp.artwork,
    rating: rawApp.rating ?? rawApp.averageUserRating ?? rawApp.averageUserRatingForCurrentVersion ?? rawApp.stars,
    reviewCount: rawApp.reviewCount ?? rawApp.userRatingCount ?? rawApp.userRatingCountForCurrentVersion ?? rawApp.ratingCount ?? rawApp.reviews,
  } : null

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <Logo />
            <span className="text-xl font-bold text-blue-600">ReviewMonster</span>
          </Link>
          {app && (
            <div className="flex items-center gap-3">
              {app.iconUrl ? (
                <img
                  src={app.iconUrl}
                  alt={app.name || 'App'}
                  className="w-10 h-10 rounded-lg"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-xl">
                  📱
                </div>
              )}
              <div>
                <h1 className="font-semibold text-gray-900">{app.name || 'Unknown App'}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="text-yellow-500">
                    {'★'.repeat(Math.round(app.rating || 0))}
                  </span>
                  <span>{app.rating?.toFixed(1) || 'N/A'}</span>
                  <span>•</span>
                  <span>{(app.reviewCount ?? 0).toLocaleString()} reviews</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
