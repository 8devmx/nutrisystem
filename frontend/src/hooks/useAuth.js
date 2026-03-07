"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { getToken, getUser, setToken, setUser, clearAuth, isAuthenticated as checkAuth } from "@/lib/api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (checkAuth()) {
      setUserState(getUser())
    }
    setLoading(false)
  }, [])

  const login = (userData, token) => {
    setToken(token)
    setUser(userData)
    setUserState(userData)
  }

  const logout = () => {
    clearAuth()
    setUserState(null)
  }

  const updateUser = (userData) => {
    setUser(userData)
    setUserState(userData)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
