import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, ShoppingCart, Package, Receipt,
  LogOut, ShoppingBag, ChevronRight, Users
} from 'lucide-react'
import { getInitials } from '../../utils/format'

// Navigation items for normal shop users (admin / cashier)
const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pos', icon: ShoppingCart, label: 'Bán hàng (POS)' },
  { to: '/products', icon: Package, label: 'Sản phẩm' },
  { to: '/transactions', icon: Receipt, label: 'Lịch sử' },
  // Staff management – visible for admin and cashier (non‑superadmin)
  { to: '/staff', icon: Users, label: 'Nhân viên' },
]

export default function Sidebar() {
  const { user, tenant, logout, isAdmin, isSuperAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="w-64 min-h-screen flex flex-col flex-shrink-0"
      style={{
        background: '#ffffff',
        borderRight: '1px solid #e5e7eb',
      }}>

      {/* Logo */}
      <div className="p-5 pb-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#3b82f6' }}>
            <ShoppingBag size={17} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-gray-900 text-sm truncate">{tenant?.name || 'POS System'}</div>
            <div className="text-xs text-gray-500">SaaS Point of Sale</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        <div className="text-xs font-semibold uppercase tracking-widest mb-2 px-3"
          style={{ color: '#9ca3af' }}>
          Menu
        </div>
        {/* Render normal navigation only for non‑superadmin users */}
        {!isSuperAdmin && navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Icon size={17} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={13} className="opacity-30" />
          </NavLink>
        ))}

        {/* Admin section – shown for superadmin only */}
        {isSuperAdmin && (
          <>
            <div className="text-xs font-semibold uppercase tracking-widest mb-1 mt-4 px-3"
              style={{ color: '#9ca3af' }}>
              Hệ thống
            </div>
            <NavLink to="/admin"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <span className="flex-1">Quản lý shop</span>
              <ChevronRight size={13} className="opacity-30" />
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-3 space-y-1" style={{ borderTop: '1px solid #e5e7eb' }}>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: '#f3f4f6' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: '#3b82f6' }}>
            {getInitials(user?.username)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{user?.username}</div>
            <div className="text-xs text-gray-500">
              {user?.role === 'super_admin' ? 'Super Admin'
                : user?.role === 'admin' ? 'Admin'
                : 'Cashier'}
            </div>
          </div>
          <button onClick={handleLogout} title="Đăng xuất"
            className="text-red-500 hover:text-red-600 transition-colors">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}