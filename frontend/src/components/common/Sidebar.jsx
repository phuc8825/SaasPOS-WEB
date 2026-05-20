import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import {
  LayoutDashboard, ShoppingCart, Package, Receipt,
  LogOut, Moon, Sun, ShoppingBag, ChevronRight, ShieldCheck, Users
} from 'lucide-react'
import { getInitials } from '../../utils/format'

// Navigation items for normal shop users (manager / cashier)
const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pos', icon: ShoppingCart, label: 'Bán hàng (POS)' },
  { to: '/products', icon: Package, label: 'Sản phẩm' },
  { to: '/transactions', icon: Receipt, label: 'Lịch sử' },
  // Staff management – visible for manager and cashier (non‑superadmin)
  { to: '/staff', icon: Users, label: 'Nhân viên' },
]

const SUPER_ADMIN_KEY = import.meta.env.VITE_SUPER_ADMIN_KEY || ''

export default function Sidebar() {
  const { user, tenant, logout, isAdmin, isSuperAdmin } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="w-64 min-h-screen flex flex-col flex-shrink-0"
      style={{
        background: 'linear-gradient(180deg, #0a0a14 0%, #0f0f1a 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>

      {/* Logo */}
      <div className="p-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <ShoppingBag size={17} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white text-sm truncate">{tenant?.name || 'POS System'}</div>
            <div className="text-xs opacity-40 text-white">SaaS Point of Sale</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        <div className="text-xs font-semibold uppercase tracking-widest mb-2 px-3"
          style={{ color: 'rgba(255,255,255,0.22)' }}>
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

        {/* Admin section – shown for superadmin (or when SUPER_ADMIN_KEY is set) */}
        {(SUPER_ADMIN_KEY || isSuperAdmin) && (
          <>
            <div className="text-xs font-semibold uppercase tracking-widest mb-1 mt-4 px-3"
              style={{ color: 'rgba(255,255,255,0.22)' }}>
              Hệ thống
            </div>
            <NavLink to="/admin"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <ShieldCheck size={17} />
              <span className="flex-1">Quản lý shop</span>
              <ChevronRight size={13} className="opacity-30" />
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={toggle} className="sidebar-item w-full">
          {dark ? <Sun size={17} /> : <Moon size={17} />}
          <span>{dark ? 'Chế độ sáng' : 'Chế độ tối'}</span>
        </button>

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mt-1"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
            {getInitials(user?.username)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.username}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {user?.role === 'super_admin' ? '🛡️ Super Admin'
                : user?.role === 'admin' ? '👑 Admin'
                : user?.role === 'manager' ? '🎯 Manager'
                : '💼 Cashier'}
            </div>
          </div>
          <button onClick={handleLogout} title="Đăng xuất"
            className="text-red-400 hover:text-red-300 transition-colors">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}