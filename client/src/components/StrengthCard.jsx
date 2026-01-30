export default function StrengthCard({ strength }) {
  return (
    <div className="p-4 rounded-lg border bg-green-100 text-green-800 border-green-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span>💪</span>
          <h3 className="font-semibold">{strength.title}</h3>
        </div>
        <span className="text-sm font-medium">{strength.count} mentions</span>
      </div>
      {strength.description && (
        <p className="mt-2 text-sm opacity-80 line-clamp-2">{strength.description}</p>
      )}
      <div className="mt-2 flex items-center gap-3 text-xs">
        <span className="capitalize">{strength.sentiment || 'positive'} sentiment</span>
      </div>
    </div>
  )
}
