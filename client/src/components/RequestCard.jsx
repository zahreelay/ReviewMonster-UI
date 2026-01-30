const priorityColors = {
  high: 'bg-purple-100 text-purple-800 border-purple-200',
  medium: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200',
}

export default function RequestCard({ request }) {
  const priority = request.priority || 'medium'

  return (
    <div className={`p-4 rounded-lg border ${priorityColors[priority]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span>✨</span>
          <h3 className="font-semibold">{request.title}</h3>
        </div>
        <span className="text-sm font-medium">{request.count} requests</span>
      </div>
      {request.description && (
        <p className="mt-2 text-sm opacity-80 line-clamp-2">{request.description}</p>
      )}
      <div className="mt-2 flex items-center gap-3 text-xs">
        <span className="capitalize">{priority} priority</span>
        {request.competitorHas && request.competitorHas.length > 0 && (
          <span className="text-red-600">
            {request.competitorHas.length} competitor(s) have this
          </span>
        )}
      </div>
    </div>
  )
}
