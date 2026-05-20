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
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0f0f1a 100%)' }}>

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-10 animate-pulse"
            style={{
              width: `${150 + i * 80}px`, height: `${150 + i * 80}px`,
              background: `radial-gradient(circle, #7c3aed, transparent)`,
              left: `${10 + i * 15}%`, top: `${5 + i * 12}%`,
              animationDelay: `${i * 0.8}s`, animationDuration: `${3 + i}s`,
            }} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <ShoppingBag size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">SaaS POS</h1>
          <p className="text-purple-300 text-sm">Hệ thống bán hàng thông minh</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
          <h2 className="text-xl font-semibold text-white mb-6">Đăng nhập</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Nhập tên đăng nhập"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none text-white placeholder-gray-500 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Nhập mật khẩu"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none text-white placeholder-gray-500 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                  required
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all active:scale-95 disabled:opacity-50 mt-2"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
              }}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}