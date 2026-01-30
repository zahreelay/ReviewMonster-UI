import { NavLink, useParams } from 'react-router-dom'

const tabs = [
  { name: 'Overview', path: '' },
  { name: 'Issues', path: '/issues' },
  { name: 'Requests', path: '/requests' },
  { name: 'Strengths', path: '/strengths' },
  { name: 'Timeline', path: '/timeline' },
  { name: 'Competitors', path: '/competitors' },
  { name: 'Roadmap', path: '/roadmap' },
  { name: 'Query', path: '/query' },
]

export default function TabNav() {
  const { appId } = useParams()
  const basePath = `/app/${appId}`

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={`${basePath}${tab.path}`}
              end={tab.path === ''}
              className={({ isActive }) =>
                `py-3 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
