export const AUTH_CONFIG = {
  // Modo de autenticación: 'local' | 'hub'
  mode: process.env.NEXT_PUBLIC_AUTH_MODE || 'local',
  
  // URL del Hub (solo se usa cuando mode es 'hub')
  hubUrl: process.env.NEXT_PUBLIC_HUB_URL || 'http://localhost:8001',
  
  // Rutas de autenticación del Hub
  hubAuth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    register: '/api/auth/register',
  },
  
  // Rutas de autenticación local
  localAuth: {
    login: '/v1/auth/login',
    logout: '/v1/auth/logout',
    me: '/v1/auth/me',
    register: '/v1/auth/register',
  },
}

export function getAuthEndpoints() {
  if (AUTH_CONFIG.mode === 'hub') {
    return AUTH_CONFIG.hubAuth
  }
  return AUTH_CONFIG.localAuth
}

export function isHubMode() {
  return AUTH_CONFIG.mode === 'hub'
}
