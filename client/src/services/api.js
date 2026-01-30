const API_BASE = '/api';

// Enable/disable logging
const DEBUG = true;

function log(message, data) {
  if (DEBUG) {
    console.log(`[API] ${message}`, data !== undefined ? data : '');
  }
}

function logError(message, error) {
  console.error(`[API ERROR] ${message}`, error);
}

async function handleResponse(response, endpoint) {
  log(`Response from ${endpoint}:`, response.status);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    logError(`${endpoint} failed:`, error);
    throw new Error(error.message || `HTTP error ${response.status}`);
  }
  const data = await response.json();
  log(`Data from ${endpoint}:`, data);
  return data;
}

// List all analyzed apps
export async function getApps() {
  log('Fetching all apps');
  const response = await fetch(`${API_BASE}/apps`);
  return handleResponse(response, 'GET /apps');
}

// Initialize app analysis
export async function initApp(appId, options = {}) {
  log(`Initializing app ${appId}`, options);
  const response = await fetch(`${API_BASE}/apps/${appId}/init?cache=yes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  return handleResponse(response, `POST /apps/${appId}/init`);
}

// Check initialization status
export async function getInitStatus(appId) {
  log(`Checking init status for ${appId}`);
  const response = await fetch(`${API_BASE}/apps/${appId}/init/status`);
  return handleResponse(response, `GET /apps/${appId}/init/status`);
}

// Get app overview for dashboard
export async function getOverview(appId) {
  log(`Fetching overview for ${appId}`);
  const response = await fetch(`${API_BASE}/apps/${appId}/overview?cache=yes`);
  return handleResponse(response, `GET /apps/${appId}/overview`);
}

// Get all issues
export async function getIssues(appId) {
  log(`Fetching issues for ${appId}`);
  const response = await fetch(`${API_BASE}/apps/${appId}/issues?cache=yes`);
  return handleResponse(response, `GET /apps/${appId}/issues`);
}

// Get issue details
export async function getIssueDetail(appId, issueId) {
  log(`Fetching issue detail for ${appId}/${issueId}`);
  const response = await fetch(`${API_BASE}/apps/${appId}/issues/${issueId}?cache=yes`);
  return handleResponse(response, `GET /apps/${appId}/issues/${issueId}`);
}

// Get feature requests
export async function getRequests(appId) {
  log(`Fetching requests for ${appId}`);
  const response = await fetch(`${API_BASE}/apps/${appId}/requests?cache=yes`);
  return handleResponse(response, `GET /apps/${appId}/requests`);
}

// Get strengths
export async function getStrengths(appId) {
  log(`Fetching strengths for ${appId}`);
  const response = await fetch(`${API_BASE}/apps/${appId}/strengths?cache=yes`);
  return handleResponse(response, `GET /apps/${appId}/strengths`);
}

// Get regression timeline
export async function getRegressionTimeline(appId, view = 'version') {
  log(`Fetching regression timeline for ${appId}, view: ${view}`);
  const response = await fetch(`${API_BASE}/apps/${appId}/regression-timeline?view=${view}&cache=yes`);
  return handleResponse(response, `GET /apps/${appId}/regression-timeline`);
}

// Natural language query
export async function queryApp(appId, query) {
  log(`Querying app ${appId}:`, query);
  const response = await fetch(`${API_BASE}/apps/${appId}/query?cache=yes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return handleResponse(response, `POST /apps/${appId}/query`);
}

// Phase 1B: Competitive Intelligence

// Get competitors list
export async function getCompetitors(appId) {
  log(`Fetching competitors for ${appId}`);
  const response = await fetch(`${API_BASE}/apps/${appId}/competitors?cache=yes`);
  return handleResponse(response, `GET /apps/${appId}/competitors`);
}

// Discover competitors
export async function discoverCompetitors(appId) {
  log(`Discovering competitors for ${appId}`);
  const response = await fetch(`${API_BASE}/apps/${appId}/competitors/discover`, {
    method: 'POST',
  });
  return handleResponse(response, `POST /apps/${appId}/competitors/discover`);
}

// Analyze competitors
export async function analyzeCompetitors(appId, competitorIds, days = 365) {
  log(`Analyzing competitors for ${appId}:`, competitorIds);
  const response = await fetch(`${API_BASE}/apps/${appId}/competitors/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ competitorIds, days }),
  });
  return handleResponse(response, `POST /apps/${appId}/competitors/analyze`);
}

// Get SWOT analysis
export async function getSWOT(appId) {
  log(`Fetching SWOT for ${appId}`);
  const response = await fetch(`${API_BASE}/apps/${appId}/competitors/swot?cache=yes`);
  return handleResponse(response, `GET /apps/${appId}/competitors/swot`);
}

// Get recommended roadmap
export async function getRoadmap(appId) {
  log(`Fetching roadmap for ${appId}`);
  const response = await fetch(`${API_BASE}/apps/${appId}/roadmap?cache=yes`);
  return handleResponse(response, `GET /apps/${appId}/roadmap`);
}
