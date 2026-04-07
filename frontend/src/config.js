const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api').replace(/\/$/, '');

const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api')
  ? API_BASE_URL.slice(0, -4)
  : API_BASE_URL;

export { API_BASE_URL, BACKEND_BASE_URL };