import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function RatingTrendChart({ data, title = 'Rating Trend' }) {
  console.log('[RatingTrendChart] Received data:', data)

  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log('[RatingTrendChart] No valid data, showing empty state')
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No rating data available</p>
      </div>
    )
  }

  // Extract labels and values, handling different possible data structures
  const labels = data.map((d) => {
    const label = d.month || d.period || d.version || d.date || d.label || ''
    return label
  })

  const values = data.map((d) => {
    // Handle many possible field names for rating
    const value = d.rating ?? d.avgRating ?? d.averageRating ?? d.avg ?? d.value ?? d.score ?? 0
    return value
  })

  // Filter out entries with no valid data
  const validIndices = values.map((v, i) => (v > 0 ? i : -1)).filter(i => i >= 0)
  const filteredLabels = validIndices.map(i => labels[i])
  const filteredValues = validIndices.map(i => values[i])

  console.log('[RatingTrendChart] Processed labels:', filteredLabels)
  console.log('[RatingTrendChart] Processed values:', filteredValues)

  if (filteredValues.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No rating data available</p>
      </div>
    )
  }

  console.log('[RatingTrendChart] Processed labels:', labels)
  console.log('[RatingTrendChart] Processed values:', values)

  const chartData = {
    labels: filteredLabels,
    datasets: [
      {
        label: 'Rating',
        data: filteredValues,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: !!title,
        text: title,
      },
    },
    scales: {
      y: {
        min: 1,
        max: 5,
        ticks: {
          stepSize: 0.5,
        },
      },
    },
  }

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  )
}
