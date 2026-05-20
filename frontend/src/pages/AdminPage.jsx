import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '../utils/format'
import {
  Store, Plus, X, ChevronDown, ChevronUp,
  Package, Users, Receipt, DollarSign,
  Eye, EyeOff, ShieldCheck, RefreshCw, Check
} from 'lucide-react'
import toast from 'react-hot-toast'

const SUPER_ADMIN_KEY = import.meta.env.VITE_SUPER_ADMIN_KEY || ''

const adminApi = async (method, path, body) => {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Super-Admin-Key': SUPER_ADMIN_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

const emptyForm = {
  name: '', slug: '', email: '', phone: '', address: '',
  ownerUsername: '', ownerEmail: '', ownerPassword: '',
}

export default function AdminPage() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statsMap, setStatsMap] = useState({})

  const fetchTenants = async () => {
    setLoading(true)
    try {
      const data = await adminApi('GET', '/admin/tenants')
      setTenants(data.data)
    } catch (e) {
      toast.error('Không thể tải danh sách shop: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async (tenantId) => {
    try {
      const data = await adminApi('GET', `/admin/tenants/${tenantId}/stats`)
      setStatsMap(prev => ({ ...prev, [tenantId]: data.data }))
    } catch {}
  }

  useEffect(() => { fetchTenants() }, [])

  const handleExpand = (id) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!statsMap[id]) fetchStats(id)
  }

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (!form.name || !form.ownerUsername || !form.ownerPassword) {
      return toast.error('Vui lòng điền tên shop, tên đăng nhập và mật khẩu')
    }
    setSaving(true)
    try {
      await adminApi('POST', '/admin/tenants', form)
      toast.success(`Đã tạo shop "${form.name}" thành công! 🎉`)
      setForm(emptyForm)
      setShowCreate(false)
      fetchTenants()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const adminCount = (t) => t.users?.filter(u => u.role === 'admin').length || 0
  const cashierCount = (t) => t.users?.filter(u => u.role === 'cashier').length || 0

  return (
    <div className="h-screen overflow-y-auto" style={{ background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Quản lý hệ thống
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {tenants.length} shop đang hoạt động
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchTenants}
            className="p-2 rounded-xl transition-colors"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Thêm shop mới
          </button>
        </div>
      </div>

      {/* Stats overview */}
      <div className="px-6 pt-5">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: Store, label: 'Tổng số shop', value: tenants.length, color: '#8b5cf6' },
            { icon: Users, label: 'Tổng tài khoản', value: tenants.reduce((s, t) => s + (t.users?.length || 0), 0), color: '#06b6d4' },
            { icon: Package, label: 'Hoạt động', value: tenants.length, color: '#10b981' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl" style={{ background: `${color}18` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tenant list */}
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse h-20" />
            ))
          ) : tenants.length === 0 ? (
            <div className="card p-12 text-center" style={{ color: 'var(--text-secondary)' }}>
              <Store size={48} className="mx-auto mb-3 opacity-30" />
              <p>Chưa có shop nào</p>
            </div>
          ) : (
            tenants.map(tenant => (
              <div key={tenant.id} className="card overflow-hidden">
                {/* Tenant row */}
                <button
                  onClick={() => handleExpand(tenant.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:opacity-80 transition-opacity">
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(79,70,229,0.1))' }}>
                    👟
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                        {tenant.name}
                      </span>
                      <span className="badge text-xs font-mono"
                        style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                        {tenant.slug}
                      </span>
                    </div>
                    <div className="text-sm mt-0.5 flex items-center gap-3 flex-wrap"
                      style={{ color: 'var(--text-secondary)' }}>
                      {tenant.email && <span>📧 {tenant.email}</span>}
                      {tenant.phone && <span>📞 {tenant.phone}</span>}
                      {tenant.address && <span>📍 {tenant.address}</span>}
                    </div>
                  </div>

                  {/* User counts */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {adminCount(tenant)}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Admin</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {cashierCount(tenant)}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Cashier</div>
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(tenant.created_at)}
                    </div>
                    {expanded === tenant.id
                      ? <ChevronUp size={16} style={{ color: 'var(--text-secondary)' }} />
                      : <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />}
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded === tenant.id && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {/* Stats row */}
                    {statsMap[tenant.id] && (
                      <div className="grid grid-cols-4 gap-0" style={{ borderBottom: '1px solid var(--border)' }}>
                        {[
                          { icon: Package, label: 'Sản phẩm', value: statsMap[tenant.id].products, color: '#8b5cf6' },
                          { icon: Users, label: 'Tài khoản', value: statsMap[tenant.id].users, color: '#06b6d4' },
                          { icon: Receipt, label: 'Đơn hàng', value: statsMap[tenant.id].transactions, color: '#f59e0b' },
                          { icon: DollarSign, label: 'Doanh thu', value: formatCurrency(statsMap[tenant.id].totalRevenue), color: '#10b981' },
                        ].map(({ icon: Icon, label, value, color }, i) => (
                          <div key={label} className="flex items-center gap-3 p-4"
                            style={{ borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                            <Icon size={16} style={{ color }} />
                            <div>
                              <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{value}</div>
                              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Users table */}
                    <div className="p-5">
                      <div className="text-xs font-semibold uppercase tracking-wider mb-3"
                        style={{ color: 'var(--text-secondary)' }}>
                        Danh sách tài khoản
                      </div>
                      <div className="space-y-2">
                        {tenant.users?.map(u => (
                          <div key={u.id}
                            className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                            style={{ background: 'var(--bg-secondary)' }}>
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ background: u.role === 'admin' ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'linear-gradient(135deg,#0891b2,#0284c7)' }}>
                                {u.username[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                  {u.username}
                                </div>
                                {u.email && (
                                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{u.email}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="badge text-xs"
                                style={u.role === 'admin'
                                  ? { background: 'rgba(124,58,237,0.12)', color: '#7c3aed' }
                                  : { background: 'rgba(8,145,178,0.12)', color: '#0891b2' }}>
                                {u.role === 'admin' ? '👑 Admin' : '💼 Cashier'}
                              </span>
                              <span className="badge text-xs"
                                style={u.is_active
                                  ? { background: 'rgba(16,185,129,0.1)', color: '#10b981' }
                                  : { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                {u.is_active ? '● Hoạt động' : '● Tắt'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="h-8" />

      {/* Create Shop Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}>
          <div className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                  <Store size={18} className="text-white" />
                </div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Thêm shop mới
                </h2>
              </div>
              <button onClick={() => { setShowCreate(false); setForm(emptyForm) }}
                style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Shop info section */}
            <div className="mb-5">
              <div className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
                style={{ color: '#8b5cf6' }}>
                <Store size={12} /> Thông tin shop
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Tên shop <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input value={form.name}
                    onChange={e => setField('name', e.target.value)}
                    placeholder="VD: Giày Thể Thao Việt" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Mã shop (slug)
                    <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--text-secondary)' }}>
                      tự động tạo nếu để trống
                    </span>
                  </label>
                  <input value={form.slug}
                    onChange={e => setField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="giay-the-thao-viet" className="input-field font-mono text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Email shop</label>
                    <input type="email" value={form.email}
                      onChange={e => setField('email', e.target.value)}
                      placeholder="shop@email.com" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Số điện thoại</label>
                    <input value={form.phone}
                      onChange={e => setField('phone', e.target.value)}
                      placeholder="028-xxxx-xxxx" className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Địa chỉ</label>
                  <input value={form.address}
                    onChange={e => setField('address', e.target.value)}
                    placeholder="123 Đường ABC, Quận XYZ, TP.HCM" className="input-field" />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px mb-5" style={{ background: 'var(--border)' }} />

            {/* Owner account section */}
            <div className="mb-5">
              <div className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
                style={{ color: '#06b6d4' }}>
                <Users size={12} /> Tài khoản chủ shop (admin)
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Tên đăng nhập <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input value={form.ownerUsername}
                    onChange={e => setField('ownerUsername', e.target.value)}
                    placeholder="admin_shop" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Email tài khoản
                  </label>
                  <input type="email" value={form.ownerEmail}
                    onChange={e => setField('ownerEmail', e.target.value)}
                    placeholder="admin@shop.com" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Mật khẩu <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'}
                      value={form.ownerPassword}
                      onChange={e => setField('ownerPassword', e.target.value)}
                      placeholder="Tối thiểu 6 ký tự" className="input-field pr-10" />
                    <button type="button" onClick={() => setShowPw(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-secondary)' }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => { setShowCreate(false); setForm(emptyForm) }}
                className="btn-secondary flex-1">
                Hủy
              </button>
              <button onClick={handleCreate} disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving
                  ? <><RefreshCw size={14} className="animate-spin" /> Đang tạo...</>
                  : <><Check size={14} /> Tạo shop</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}