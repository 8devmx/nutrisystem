// Siempre usamos rutas relativas para que funcione tanto en local como en Docker.
// El browser hace la petición a /api/... y Nginx la redirige al backend.
// Esto evita que el browser intente resolver hostnames internos de Docker (ej: nginx:8090).
const API_BASE = '/api'

async function fetchWithAuth(url, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

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

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de servidor' }))
    throw new Error(error.message || 'Error en la solicitud')
  }

  return response.json()
}

export const api = {
  get: (url) => fetchWithAuth(url),
  post: (url, data) => fetchWithAuth(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url, data) => fetchWithAuth(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url) => fetchWithAuth(url, { method: 'DELETE' }),
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
