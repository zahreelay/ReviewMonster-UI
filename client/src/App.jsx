import { Routes, Route } from 'react-router-dom'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import IssuesPage from './pages/IssuesPage'
import IssueDetailPage from './pages/IssueDetailPage'
import RequestsPage from './pages/RequestsPage'
import StrengthsPage from './pages/StrengthsPage'
import TimelinePage from './pages/TimelinePage'
import CompetitorsPage from './pages/CompetitorsPage'
import RoadmapPage from './pages/RoadmapPage'
import QueryPage from './pages/QueryPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<OnboardingPage />} />
      <Route path="/app/:appId" element={<DashboardPage />} />
      <Route path="/app/:appId/issues" element={<IssuesPage />} />
      <Route path="/app/:appId/issues/:issueId" element={<IssueDetailPage />} />
      <Route path="/app/:appId/requests" element={<RequestsPage />} />
      <Route path="/app/:appId/strengths" element={<StrengthsPage />} />
      <Route path="/app/:appId/timeline" element={<TimelinePage />} />
      <Route path="/app/:appId/competitors" element={<CompetitorsPage />} />
      <Route path="/app/:appId/roadmap" element={<RoadmapPage />} />
      <Route path="/app/:appId/query" element={<QueryPage />} />
    </Routes>
  )
}

export default App
