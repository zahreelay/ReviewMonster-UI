import { Link, useParams } from 'react-router-dom'

const severityColors = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
}

const severityIcons = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
}

export default function IssueCard({ issue, showLink = true }) {
  const { appId } = useParams()
  const severity = issue.severity || 'medium'

  const content = (
    <div className={`p-4 rounded-lg border ${severityColors[severity]} transition-transform hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span>{severityIcons[severity]}</span>
          <h3 className="font-semibold">{issue.title}</h3>
        </div>
        <span className="text-sm font-medium">{issue.count} reports</span>
      </div>
      {issue.description && (
        <p className="mt-2 text-sm opacity-80 line-clamp-2">{issue.description}</p>
      )}
      <div className="mt-2 flex items-center gap-3 text-xs">
        <span className="capitalize">{severity} severity</span>
        {issue.firstSeen && <span>First seen: {issue.firstSeen}</span>}
        {issue.status && (
          <span className={issue.status === 'resolved' ? 'text-green-700' : ''}>
            {issue.status === 'resolved' ? '✅ Resolved' : '🔄 Active'}
          </span>
        )}
      </div>
    </div>
  )

  if (showLink && issue.id) {
    return (
      <Link to={`/app/${appId}/issues/${issue.id}`}>
        {content}
      </Link>
    )
  }

  return content
}
