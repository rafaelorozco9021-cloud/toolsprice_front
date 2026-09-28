import { createClient } from 'axios'

const api = createClient({
  baseURL: 'https://toolsprice-back.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api

```