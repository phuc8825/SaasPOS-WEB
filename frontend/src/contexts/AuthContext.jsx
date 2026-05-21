import { createContext, useContext, useState, useCallback } from 'react'
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

      // Trả về role để LoginPage redirect đúng chỗ
      return { success: true, role: userData.role }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Đăng nhập thất bại' }
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

  const isSuperAdmin = user?.role === 'super_admin'
  const isAdmin = user?.role === 'admin'
  const isCashier = user?.role === 'cashier'

  return (
    <AuthContext.Provider value={{
      user, tenant, loading,
      login, logout,
      isSuperAdmin, isCashier, isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}