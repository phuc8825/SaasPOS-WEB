import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '../utils/format'
import {
  Store, Plus, X, ChevronDown, ChevronUp,
  Package, Users, Receipt, DollarSign,
  Eye, EyeOff, ShieldCheck, RefreshCw, Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
// JWT token từ superadmin đăng nhập đã đủ để truy cập /admin routes

// Helper wrapper để gọi API với JWT token
const adminApi = async (method, path, body) => {
  try {
    const response = await api.request({ method, url: path, data: body })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

const emptyForm = {
  name: '', slug: '', email: '', phone: '', address: '',
  ownerUsername: '', ownerEmail: '', ownerPassword: '',
}

const emptyUserForm = {
  username: '', email: '', password: '', role: 'cashier',
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
  
  // User management state
  const [userModal, setUserModal] = useState(null) // 'create' | 'edit' | 'delete' | null
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userForm, setUserForm] = useState(emptyUserForm)

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

  // User management handlers
  const openCreateUser = (tenant) => {
    setSelectedTenant(tenant)
    setUserForm(emptyUserForm)
    setUserModal('create')
  }

  const openEditUser = (tenant, user) => {
    setSelectedTenant(tenant)
    setSelectedUser(user)
    setUserForm({ username: user.username, email: user.email || '', password: '', role: user.role })
    setUserModal('edit')
  }

  const openDeleteUser = (tenant, user) => {
    setSelectedTenant(tenant)
    setSelectedUser(user)
    setUserModal('delete')
  }

  const closeUserModal = () => {
    setUserModal(null)
    setSelectedTenant(null)
    setSelectedUser(null)
    setUserForm(emptyUserForm)
  }

  const handleSaveUser = async () => {
    if (!userForm.username) {
      return toast.error('Vui lòng nhập tên đăng nhập')
    }
    if (userModal === 'create' && !userForm.password) {
      return toast.error('Vui lòng nhập mật khẩu')
    }

    setSaving(true)
    try {
      if (userModal === 'create') {
        await adminApi('POST', `/admin/tenants/${selectedTenant.id}/users`, {
          username: userForm.username,
          email: userForm.email,
          password: userForm.password,
          role: userForm.role,
        })
        toast.success('Đã thêm nhân viên thành công!')
      } else if (userModal === 'edit') {
        await adminApi('PUT', `/admin/tenants/${selectedTenant.id}/users/${selectedUser.id}`, {
          username: userForm.username,
          email: userForm.email,
          role: userForm.role,
        })
        toast.success('Đã cập nhật nhân viên thành công!')
      }
      closeUserModal()
      fetchTenants()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    setSaving(true)
    try {
      await adminApi('DELETE', `/admin/tenants/${selectedTenant.id}/users/${selectedUser.id}`)
      toast.success('Đã xóa nhân viên thành công!')
      closeUserModal()
      fetchTenants()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-screen overflow-y-auto" style={{ background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#3b82f6' }}>
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
            { icon: Store, label: 'Tổng số shop', value: tenants.length, color: '#3b82f6' },
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
                        style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
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

                  {/* Created date */}
                  <div className="flex items-center gap-3 flex-shrink-0">
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
                          { icon: Package, label: 'Sản phẩm', value: statsMap[tenant.id].products, color: '#3b82f6' },
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
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--text-secondary)' }}>
                          Danh sách tài khoản
                        </div>
                        <button onClick={() => openCreateUser(tenant)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors"
                          style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                          <Plus size={13} /> Thêm tài khoản
                        </button>
                      </div>
                      <div className="space-y-2">
                        {tenant.users?.map(u => (
                          <div key={u.id}
                            className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                            style={{ background: 'var(--bg-secondary)' }}>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ background: '#3b82f6' }}>
                                {u.username[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                  {u.username}
                                </div>
                                {u.email && (
                                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{u.email}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button onClick={() => openEditUser(tenant, u)}
                                className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                                title="Sửa"
                                style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button onClick={() => openDeleteUser(tenant, u)}
                                className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                                title="Xóa"
                                style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
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
                  style={{ background: '#3b82f6' }}>
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
                style={{ color: '#3b82f6' }}>
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

      {/* User Modal (Create / Edit / Delete) */}
      {userModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}>
          <div className="card w-full max-w-md p-6">
            {/* Create / Edit User */}
            {(userModal === 'create' || userModal === 'edit') && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {userModal === 'create' ? 'Thêm tài khoản mới' : 'Sửa tài khoản'}
                  </h2>
                  <button onClick={closeUserModal} style={{ color: 'var(--text-secondary)' }}>
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3 mb-5">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      Tên đăng nhập <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input type="text" value={userForm.username}
                      onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))}
                      placeholder="nhanvien01" className="input-field"
                      disabled={userModal === 'edit'} />
                  </div>

                  {userModal === 'create' && (
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                        Mật khẩu <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input type="password" value={userForm.password}
                        onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="Tối thiểu 6 ký tự" className="input-field" />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      Email
                    </label>
                    <input type="email" value={userForm.email}
                      onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="nhanvien@shop.com" className="input-field" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      Vai trò
                    </label>
                    <select value={userForm.role}
                      onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}
                      className="input-field">
                      <option value="cashier">Thu ngân</option>
                      <option value="admin">Quản lý</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={closeUserModal} className="btn-secondary flex-1">
                    Hủy
                  </button>
                  <button onClick={handleSaveUser} disabled={saving}
                    className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                    {userModal === 'create' ? 'Thêm' : 'Lưu'}
                  </button>
                </div>
              </>
            )}

            {/* Delete User */}
            {userModal === 'delete' && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-red-600">Xóa tài khoản</h2>
                  <button onClick={closeUserModal} style={{ color: 'var(--text-secondary)' }}>
                    <X size={20} />
                  </button>
                </div>

                <p style={{ color: 'var(--text-secondary)' }} className="mb-5">
                  Bạn có chắc muốn xóa tài khoản <strong>{selectedUser?.username}</strong>? Hành động này không thể hoàn tác.
                </p>

                <div className="flex gap-3">
                  <button onClick={closeUserModal} className="btn-secondary flex-1">
                    Hủy
                  </button>
                  <button onClick={handleDeleteUser} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors"
                    style={{ background: '#ef4444', color: 'white' }}>
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <X size={14} />}
                    Xóa
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}