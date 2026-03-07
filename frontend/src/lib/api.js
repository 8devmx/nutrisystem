// Siempre usamos rutas relativas para que funcione tanto en local como en Docker.
// El browser hace la petición a /api/... y Nginx la redirige al backend.
// Esto evita que el browser intente resolver hostnames internos de Docker (ej: nginx:8090).
const API_BASE = '/api'

const TOKEN_KEY = 'nutrisystem_token'
const USER_KEY = 'nutrisystem_user'

export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export function getUser() {
  if (typeof window === 'undefined') return null
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export function setUser(user) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
}

export function isAuthenticated() {
  return !!getToken()
}

async function fetchWithAuth(url, options = {}) {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearAuth()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('Sesión expirada')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de servidor' }))
    const err = new Error(error.message || 'Error en la solicitud')
    err.errors  = error.errors  || null
    err.status  = response.status
    err.payload = error
    throw err
  }

  return response.json()
}

export const api = {
  get: (url) => fetchWithAuth(url),
  post: (url, data) => fetchWithAuth(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url, data) => fetchWithAuth(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url) => fetchWithAuth(url, { method: 'DELETE' }),
}

export const authApi = {
  login: async (email, password) => {
    const data = await api.post('/v1/auth/login', { email, password })
    if (data.success && data.data.token) {
      setToken(data.data.token)
      setUser(data.data.user)
    }
    return data
  },

  register: async (userData) => {
    const data = await api.post('/v1/auth/register', userData)
    if (data.success && data.data.token) {
      setToken(data.data.token)
      setUser(data.data.user)
    }
    return data
  },

  logout: async () => {
    try {
      await api.post('/v1/auth/logout', {})
    } finally {
      clearAuth()
    }
  },

  me: async () => {
    return api.get('/v1/auth/me')
  },

  updateProfile: async (data) => {
    return api.put('/v1/auth/profile', data)
  },
}

export const nutritionApi = {
  getUserRequirements: (userId) =>
    api.get(`/v1/users/${userId}/requirements`),

  updateProfile: (userId, data) =>
    api.put(`/v1/users/${userId}/profile`, data),
}

export const plansApi = {
  getPlan: (planId) =>
    api.get(`/v1/plans/${planId}`),

  createPlan: (data) =>
    api.post('/v1/plans', data),
}

export const foodsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/v1/foods${query ? `?${query}` : ''}`)
  },

  getEquivalences: (foodId) =>
    api.get(`/v1/foods/${foodId}/equivalences`),
}

export const unitsApi = {
  list: () => api.get('/v1/units'),
}

export const planMealsApi = {
  add: (planId, data) =>
    api.post(`/v1/plans/${planId}/meals`, data),

  update: (planId, mealId, data) =>
    api.put(`/v1/plans/${planId}/meals/${mealId}`, data),

  remove: (planId, mealId) =>
    api.delete(`/v1/plans/${planId}/meals/${mealId}`),
}
