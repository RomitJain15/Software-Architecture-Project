const configuredBaseUrl = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api').replace(/\/$/, '');

const API_BASE_URL = configuredBaseUrl.endsWith('/api')
  ? configuredBaseUrl
  : `${configuredBaseUrl}/api`;

const BACKEND_BASE_URL = API_BASE_URL.slice(0, -4);

export { API_BASE_URL, BACKEND_BASE_URL };