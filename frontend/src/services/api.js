import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_token')
      localStorage.removeItem('pos_user')
      localStorage.removeItem('pos_tenant')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Helper to get current tenant ID from localStorage
const getTenantId = () => {
  try {
    const tenant = JSON.parse(localStorage.getItem('pos_tenant'))
    return tenant?.id || tenant?.tenantId || tenant?._id
  } catch {
    return null
  }
}

// Staff management API (uses tenant‑scoped routes)
export const getStaff = () => {
  const tenantId = getTenantId()
  return api.get(`/tenants/${tenantId}/users`)
}

export const createStaff = (payload) => {
  const tenantId = getTenantId()
  return api.post(`/tenants/${tenantId}/users`, payload)
}

export const updateStaff = (id, payload) => {
  const tenantId = getTenantId()
  return api.put(`/tenants/${tenantId}/users/${id}`, payload)
}

export const deleteStaff = (id) => {
  const tenantId = getTenantId()
  return api.delete(`/tenants/${tenantId}/users/${id}`)
}

export const resetStaffPassword = (id, newPassword) => {
  const tenantId = getTenantId()
  return api.put(`/tenants/${tenantId}/users/${id}/password`, { newPassword })
}