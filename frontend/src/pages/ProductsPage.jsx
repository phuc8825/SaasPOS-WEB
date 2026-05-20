import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency } from '../utils/format'
import { Plus, Search, Edit2, Trash2, Package, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyForm = { name: '', price: '', description: '', image_url: '', category: '', sku: '', stock_quantity: 999 }

export default function ProductsPage() {
  const { isAdmin } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [modal, setModal] = useState(null) // null | 'create' | product object
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterCat) params.set('category', filterCat)
      const res = await api.get(`/products?${params}`)
      setProducts(res.data.data.products)
    } catch { toast.error('Không thể tải danh sách sản phẩm') }
    finally { setLoading(false) }
  }

  const fetchCategories = async () => {
    const res = await api.get('/products/categories')
    setCategories(res.data.data)
  }

  useEffect(() => { fetchProducts(); fetchCategories() }, [])
  useEffect(() => { fetchProducts() }, [search, filterCat])

  const openCreate = () => { setForm(emptyForm); setModal('create') }
  const openEdit = (p) => { setForm({ name: p.name, price: p.price, description: p.description || '', image_url: p.image_url || '', category: p.category || '', sku: p.sku || '', stock_quantity: p.stock_quantity }); setModal(p) }
  const closeModal = () => { setModal(null); setForm(emptyForm) }

  const handleSave = async () => {
    if (!form.name || !form.price) return toast.error('Tên và giá là bắt buộc')
    setSaving(true)
    try {
      if (modal === 'create') {
        await api.post('/products', form)
        toast.success('Đã thêm sản phẩm')
      } else {
        await api.put(`/products/${modal.id}`, form)
        toast.success('Đã cập nhật sản phẩm')
      }
      closeModal()
      fetchProducts()
      fetchCategories()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`)
      toast.success('Đã xóa sản phẩm')
      setDeleteId(null)
      fetchProducts()
    } catch { toast.error('Không thể xóa sản phẩm') }
  }

  return (
    <div className="h-screen overflow-y-auto" style={{ background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Sản phẩm</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{products.length} sản phẩm</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Thêm sản phẩm
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="px-6 pt-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm..."
            className="input-field pl-9" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input-field w-44">
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Products Grid */}
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="aspect-square rounded-xl mb-3" style={{ background: 'var(--border)' }} />
                <div className="h-4 rounded mb-2" style={{ background: 'var(--border)' }} />
                <div className="h-5 w-20 rounded" style={{ background: 'var(--border)' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map(p => (
              <div key={p.id} className="card p-4 group">
                {/* Image */}
                <div className="aspect-square rounded-xl mb-3 flex items-center justify-center overflow-hidden"
                  style={{ background: 'var(--bg-secondary)' }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={32} style={{ color: 'var(--text-secondary)' }} />
                  )}
                </div>
                {p.category && (
                  <div className="text-xs mb-1.5 font-medium" style={{ color: '#8b5cf6' }}>{p.category}</div>
                )}
                <div className="font-semibold text-sm mb-1 leading-tight" style={{ color: 'var(--text-primary)' }}>{p.name}</div>
                {p.description && (
                  <div className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{p.description}</div>
                )}
                <div className="font-bold text-base" style={{ color: '#8b5cf6' }}>{formatCurrency(p.price)}</div>

                {isAdmin && (
                  <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                      <Edit2 size={12} /> Sửa
                    </button>
                    <button onClick={() => setDeleteId(p.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                      <Trash2 size={12} /> Xóa
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!products.length && (
              <div className="col-span-full text-center py-16" style={{ color: 'var(--text-secondary)' }}>
                <Package size={48} className="mx-auto mb-3 opacity-30" />
                <p>Không có sản phẩm nào</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {modal === 'create' ? 'Thêm sản phẩm' : 'Chỉnh sửa sản phẩm'}
              </h2>
              <button onClick={closeModal} style={{ color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {[
                { key: 'name', label: 'Tên sản phẩm *', type: 'text', placeholder: 'Nhập tên sản phẩm' },
                { key: 'price', label: 'Giá (VND) *', type: 'number', placeholder: '0' },
                { key: 'category', label: 'Danh mục', type: 'text', placeholder: 'VD: Đồ uống' },
                { key: 'sku', label: 'Mã SKU', type: 'text', placeholder: 'SP001' },
                { key: 'image_url', label: 'URL hình ảnh', type: 'text', placeholder: 'https://...' },
                { key: 'stock_quantity', label: 'Tồn kho', type: 'number', placeholder: '999' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder} className="input-field" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Mô tả</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả sản phẩm..." rows={3} className="input-field resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="btn-secondary flex-1">Hủy</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? 'Đang lưu...' : <><Check size={16} /> Lưu</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="card p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Xác nhận xóa</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Bạn có chắc muốn xóa sản phẩm này? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Hủy</button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}