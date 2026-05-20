import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/common/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import POSPage from './pages/POSPage'
import ProductsPage from './pages/ProductsPage'
import TransactionsPage from './pages/TransactionsPage'
import AdminPage from './pages/AdminPage'
import StaffPage from './pages/StaffPage.jsx'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'

// Guard: chỉ cho vào /admin nếu role là 'admin'
function AdminRoute() {
  const { user } = useAuth()
  // Allow both regular admin (role "admin") and super admin (role "super_admin")
  const allowedRoles = ['admin', 'super_admin']
  if (!allowedRoles.includes(user?.role)) return <Navigate to="/dashboard" replace />
  return <AdminPage />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/pos" element={<POSPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/admin" element={<AdminRoute />} />
              <Route path="/staff" element={<StaffPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}