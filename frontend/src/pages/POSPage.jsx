import { useState, useEffect, useRef, memo } from 'react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency } from '../utils/format'
import {
  Search, ShoppingCart, Plus, Minus, Trash2, Package,
  CreditCard, Banknote, Building2, User, Phone,
  X, Receipt, CheckCircle, AlertCircle, Mail, AtSign
} from 'lucide-react'
import toast from 'react-hot-toast'
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tiền mặt', icon: Banknote },
  { value: 'card', label: 'Thẻ', icon: CreditCard },
  { value: 'transfer', label: 'Chuyển khoản', icon: Building2 },
]

// InputField tách ra NGOÀI hoàn toàn để tránh re-mount mỗi render
const InputField = ({ label, icon: Icon, field, type = 'text', placeholder, required, value, onChange, error }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
      <span className="flex items-center gap-1.5">
        {Icon && <Icon size={13} style={{ color: 'var(--text-secondary)' }} />}
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </span>
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(field, e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      className={`input-field${error ? ' border-red-400' : ''}`}
    />
    {error && (
      <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#ef4444' }}>
        <AlertCircle size={11} /> {error}
      </div>
    )}
  </div>
)

// ─────────────────────────────────────────────────────────────
// CheckoutModal tách ra NGOÀI POSPage để tránh re-mount mỗi lần state thay đổi
// ─────────────────────────────────────────────────────────────
const CheckoutModal = memo(function CheckoutModal({
  checkoutForm, errors, processing, subtotal, total, tax, discount, itemCount,
  onClose, onSubmit, onFieldChange,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Xác nhận thanh toán
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Customer info */}
        <div className="mb-5">
          <div className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-secondary)' }}>
            Thông tin khách hàng
          </div>
          <div className="space-y-3">
            <InputField
              label="Họ và tên" icon={User} field="customerName"
              placeholder="Nguyễn Văn A" required
              value={checkoutForm.customerName}
              onChange={onFieldChange}
              error={errors.customerName}
            />
            <InputField
              label="Số điện thoại" icon={Phone} field="customerPhone"
              type="tel" placeholder="0901 234 567" required
              value={checkoutForm.customerPhone}
              onChange={onFieldChange}
              error={errors.customerPhone}
            />
            <InputField
              label="Email" icon={AtSign} field="customerEmail"
              type="email" placeholder="abc@example.com" required
              value={checkoutForm.customerEmail}
              onChange={onFieldChange}
              error={errors.customerEmail}
            />
          </div>
        </div>

        <div className="h-px mb-4" style={{ background: 'var(--border)' }} />

        {/* Payment method */}
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-secondary)' }}>
            Phương thức thanh toán
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
              <button key={value} type="button"
                onClick={() => onFieldChange('paymentMethod', value)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: checkoutForm.paymentMethod === value ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-secondary)',
                  border: `1.5px solid ${checkoutForm.paymentMethod === value ? '#3b82f6' : 'var(--border)'}`,
                  color: checkoutForm.paymentMethod === value ? '#3b82f6' : 'var(--text-secondary)',
                }}>
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Discount and Tax */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Giảm giá (VND)
            </label>
            <input
              type="number"
              value={checkoutForm.discount}
              onChange={e => onFieldChange('discount', e.target.value)}
              placeholder="0"
              min="0"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Thuế (VND) - Để trống = 10%
            </label>
            <input
              type="number"
              value={checkoutForm.tax}
              onChange={e => onFieldChange('tax', e.target.value)}
              placeholder={formatCurrency(subtotal * 0.1)}
              min="0"
              className="input-field"
            />
          </div>
        </div>

        {/* Order summary */}
        <div className="p-4 rounded-xl mb-4 space-y-1.5" style={{ background: 'var(--bg-secondary)' }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Tạm tính ({itemCount} sản phẩm)</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(subtotal)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Thuế</span>
              <span style={{ color: '#f59e0b' }}>+{formatCurrency(tax)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Giảm giá</span>
              <span style={{ color: '#10b981' }}>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-1.5"
            style={{ borderTop: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <span>TỔNG</span>
            <span style={{ color: '#3b82f6' }}>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Email note */}
        <div className="flex items-start gap-2 text-xs mb-5 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
          <Mail size={13} className="flex-shrink-0 mt-0.5" />
          <span>Hóa đơn sẽ được gửi tự động đến email khách hàng sau khi thanh toán</span>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
          <button onClick={onSubmit} disabled={processing}
            className="btn-primary flex-1 flex items-center justify-center gap-2">
            {processing ? 'Đang xử lý...' : <><Receipt size={16} /> Xác nhận</>}
          </button>
        </div>
      </div>
    </div>
  )
})

// ─────────────────────────────────────────────────────────────
const ReceiptModal = memo(function ReceiptModal({ transaction, tenant, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md">
        <div className="card p-6 max-h-[88vh] overflow-y-auto">
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3"
              style={{ background: 'rgba(16,185,129,0.12)' }}>
              <CheckCircle size={36} style={{ color: '#10b981' }} />
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Thanh toán thành công!
            </h2>
            <code className="text-sm font-semibold" style={{ color: '#3b82f6' }}>
              {transaction.transaction_code}
            </code>
          </div>

          <div className="text-center pb-4 mb-3" style={{ borderBottom: '1px dashed var(--border)' }}>
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{tenant?.name}</div>
            {tenant?.address && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{tenant.address}</div>
            )}
          </div>

          {(transaction.customer_name || transaction.customer_phone) && (
            <div className="mb-3 pb-3 space-y-1.5" style={{ borderBottom: '1px dashed var(--border)' }}>
              {transaction.customer_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User size={13} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ color: 'var(--text-primary)' }}>{transaction.customer_name}</span>
                </div>
              )}
              {transaction.customer_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={13} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ color: 'var(--text-primary)' }}>{transaction.customer_phone}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5 mb-4">
            {transaction.transaction_items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-primary)' }}>
                  {item.product_name}
                  <span className="ml-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>×{item.quantity}</span>
                </span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 space-y-1.5" style={{ borderTop: '1px dashed var(--border)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Tạm tính</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(transaction.subtotal)}</span>
            </div>
            {transaction.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Thuế</span>
                <span style={{ color: '#f59e0b' }}>+{formatCurrency(transaction.tax)}</span>
              </div>
            )}
            {transaction.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Giảm giá</span>
                <span style={{ color: '#10b981' }}>-{formatCurrency(transaction.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2"
              style={{ borderTop: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <span>TỔNG CỘNG</span>
              <span style={{ color: '#3b82f6' }}>{formatCurrency(transaction.total)}</span>
            </div>
          </div>

          <button onClick={onClose} className="btn-primary w-full mt-5">Đóng</button>
        </div>
      </div>
    </div>
  )
})

// ─────────────────────────────────────────────────────────────
// Main POS Page
// ─────────────────────────────────────────────────────────────
export default function POSPage() {
  const { tenant } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: '', customerPhone: '', customerEmail: '',
    paymentMethod: 'cash', discount: 0, tax: '',
  })
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)
  const searchRef = useRef()

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    searchRef.current?.focus()
  }, [])

  useEffect(() => { fetchProducts() }, [search, filterCat])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 100 })
      if (search) params.set('search', search)
      if (filterCat) params.set('category', filterCat)
      const res = await api.get(`/products?${params}`)
      setProducts(res.data.data.products)
    } finally { setLoading(false) }
  }

  const fetchCategories = async () => {
    const res = await api.get('/products/categories')
    setCategories(res.data.data)
  }

  // ── Cart ────────────────────────────────────────────────────
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...product, quantity: 1 }]
    })
    toast.success(`Đã thêm ${product.name}`, { duration: 900, position: 'bottom-right' })
  }

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
  }

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id))
  const clearCart = () => setCart([])

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const discount = parseFloat(checkoutForm.discount) || 0
  const taxInput = parseFloat(checkoutForm.tax)
  const tax = isNaN(taxInput) ? subtotal * 0.1 : taxInput // Mặc định 10% nếu không nhập
  const total = Math.max(0, subtotal + tax - discount)
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  // ── Checkout form field handler (stable reference) ──────────
  const handleFieldChange = (key, value) => {
    setCheckoutForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => prev[key] ? { ...prev, [key]: '' } : prev)
  }

  const validateForm = () => {
    const errs = {}
    if (!checkoutForm.customerName.trim()) errs.customerName = 'Vui lòng nhập họ tên'
    if (!checkoutForm.customerPhone.trim()) errs.customerPhone = 'Vui lòng nhập số điện thoại'
    if (!checkoutForm.customerEmail.trim()) errs.customerEmail = 'Vui lòng nhập email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutForm.customerEmail)) errs.customerEmail = 'Email không hợp lệ'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleCheckout = async () => {
    if (!cart.length) return toast.error('Giỏ hàng trống!')
    if (!validateForm()) return toast.error('Vui lòng điền đầy đủ thông tin')
    setProcessing(true)
    try {
      const res = await api.post('/transactions', {
        items: cart.map(i => ({ productId: i.id, quantity: i.quantity })),
        customerName: checkoutForm.customerName.trim(),
        customerPhone: checkoutForm.customerPhone.trim(),
        customerEmail: checkoutForm.customerEmail.trim(),
        paymentMethod: checkoutForm.paymentMethod,
        discount,
        tax,
      })
      const transaction = res.data.data
      setReceiptData(transaction)
      setCheckoutOpen(false)
      clearCart()
      setCheckoutForm({ customerName: '', customerPhone: '', customerEmail: '', paymentMethod: 'cash', discount: 0, tax: '' })
      setErrors({})
      toast.success('Thanh toán thành công!')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Thanh toán thất bại')
    } finally { setProcessing(false) }
  }

  const handleCloseCheckout = () => { setCheckoutOpen(false); setErrors({}) }

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
      {/* ── Left: Products ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-3 flex gap-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-secondary)' }} />
            <input ref={searchRef} value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm sản phẩm..." className="input-field pl-9 py-2 text-sm" />
          </div>
        </div>

        <div className="flex gap-1.5 px-3 py-2 overflow-x-auto flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          {['', ...categories].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all"
              style={{
                background: filterCat === c ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'var(--bg-secondary)',
                color: filterCat === c ? 'white' : 'var(--text-secondary)',
              }}>
              {c || 'Tất cả'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...Array(6)].map((_, i) => <div key={i} className="card animate-pulse aspect-square rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map(p => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="product-card text-left group relative overflow-hidden">
                  <div className="aspect-square rounded-xl mb-2.5 flex items-center justify-center overflow-hidden relative"
                    style={{ background: 'var(--bg-secondary)' }}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      : <Package size={28} style={{ color: 'var(--text-secondary)' }} />}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-xl"
                      style={{ background: 'rgba(124,58,237,0.18)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ background: '#3b82f6' }}>
                        <Plus size={18} />
                      </div>
                    </div>
                  </div>
                  {p.category && <div className="text-xs font-medium mb-0.5" style={{ color: '#60a5fa' }}>{p.category}</div>}
                  <div className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{p.name}</div>
                  <div className="font-bold text-sm mt-1" style={{ color: '#3b82f6' }}>{formatCurrency(p.price)}</div>
                </button>
              ))}
              {!products.length && (
                <div className="col-span-full text-center py-16" style={{ color: 'var(--text-secondary)' }}>
                  <Package size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Không có sản phẩm nào</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Cart ─── */}
      <div className="w-80 xl:w-96 flex flex-col flex-shrink-0"
        style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border)' }}>
        <div className="p-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} style={{ color: '#3b82f6' }} />
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Giỏ hàng</span>
            {itemCount > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ background: '#3b82f6' }}>{itemCount}</span>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
              style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>
              <Trash2 size={11} /> Xóa tất cả
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full"
              style={{ color: 'var(--text-secondary)' }}>
              <ShoppingCart size={40} className="mb-3 opacity-20" />
              <p className="text-sm">Giỏ hàng trống</p>
              <p className="text-xs opacity-60 mt-1">Nhấn sản phẩm để thêm</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-2.5 p-3 rounded-xl group"
                style={{ background: 'var(--bg-secondary)' }}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: '#3b82f6' }}>{formatCurrency(item.price)}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => updateQty(item.id, -1)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                    <Minus size={11} />
                  </button>
                  <span className="w-7 text-center text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {item.quantity}
                  </span>
                  <button onClick={() => updateQty(item.id, 1)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                    <Plus size={11} />
                  </button>
                  <button onClick={() => removeItem(item.id)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center ml-0.5 opacity-0 group-hover:opacity-100 transition-all"
                    style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>
                    <X size={11} />
                  </button>
                </div>
                <div className="text-sm font-bold w-20 text-right flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Tạm tính</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Thuế (10%)</span>
              <span style={{ color: '#f59e0b' }}>+{formatCurrency(tax)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Giảm giá</span>
                <span style={{ color: '#10b981' }}>-{formatCurrency(discount)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between font-bold text-lg pt-2" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <span>TỔNG</span>
            <span style={{ color: '#3b82f6' }}>{formatCurrency(total)}</span>
          </div>
          <button onClick={() => setCheckoutOpen(true)}
            disabled={!cart.length}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-base disabled:opacity-40 disabled:cursor-not-allowed mt-3">
            <CreditCard size={18} /> Thanh toán
          </button>
        </div>
      </div>

      {/* ── Modals ─── */}
      {checkoutOpen && (
        <CheckoutModal
          checkoutForm={checkoutForm}
          errors={errors}
          processing={processing}
          subtotal={subtotal}
          total={total}
          discount={discount}
          tax={tax}
          itemCount={itemCount}
          onClose={handleCloseCheckout}
          onSubmit={handleCheckout}
          onFieldChange={handleFieldChange}
        />
      )}

      {receiptData && (
        <ReceiptModal
          transaction={receiptData}
          tenant={tenant}
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  )
}