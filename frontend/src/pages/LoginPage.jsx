import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { ShoppingBag, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(form.username, form.password)
    if (result.success) {
      toast.success('Đăng nhập thành công!')
      // Redirect theo role
      if (result.role === 'super_admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)' }}>

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-5 animate-pulse"
            style={{
              width: `${150 + i * 80}px`, height: `${150 + i * 80}px`,
              background: `radial-gradient(circle, #3b82f6, transparent)`,
              left: `${10 + i * 15}%`, top: `${5 + i * 12}%`,
              animationDelay: `${i * 0.8}s`, animationDuration: `${3 + i}s`,
            }} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: '#3b82f6' }}>
            <ShoppingBag size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">SaaS POS</h1>
          <p className="text-gray-600 text-sm">Hệ thống bán hàng thông minh</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.05)',
          }}>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Đăng nhập</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Nhập tên đăng nhập"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none text-gray-900 placeholder-gray-400 transition-all"
                style={{ background: '#f3f4f6', border: '1.5px solid #e5e7eb' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Nhập mật khẩu"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none text-gray-900 placeholder-gray-400 transition-all"
                  style={{ background: '#f3f4f6', border: '1.5px solid #e5e7eb' }}
                  required
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all active:scale-95 disabled:opacity-50 mt-2"
              style={{
                background: '#3b82f6',
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
              }}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}