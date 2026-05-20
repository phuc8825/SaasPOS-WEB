import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_user')) } catch { return null }
  })
  const [tenant, setTenant] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_tenant')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (username, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { username, password })
      const { token, user: userData, tenant: tenantData } = data.data
      localStorage.setItem('pos_token', token)
      localStorage.setItem('pos_user', JSON.stringify(userData))
      localStorage.setItem('pos_tenant', JSON.stringify(tenantData))
      setUser(userData)
      setTenant(tenantData)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('pos_token')
    localStorage.removeItem('pos_user')
    localStorage.removeItem('pos_tenant')
    setUser(null)
    setTenant(null)
  }, [])

  const isAdmin = user?.role === 'admin' || user?.role === 'manager'

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}