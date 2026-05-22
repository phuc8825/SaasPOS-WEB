import { useState, useEffect } from 'react'
import api from '../services/api'
import { formatCurrency, formatDate } from '../utils/format'
import { Receipt, ChevronDown, ChevronUp, Calendar, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const LIMIT = 20

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: LIMIT })
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', new Date(dateTo + 'T23:59:59').toISOString())
      const res = await api.get(`/transactions?${params}`)
      setTransactions(res.data.data.transactions)
      setTotal(res.data.data.total)
    } catch { toast.error('Không thể tải lịch sử giao dịch') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTransactions() }, [page, dateFrom, dateTo])

  const paymentLabel = (m) => ({ cash: '💵 Tiền mặt', card: '💳 Thẻ', transfer: '🏦 Chuyển khoản' }[m] || m)

  return (
    <div className="h-screen overflow-y-auto" style={{ background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Lịch sử giao dịch</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{total} giao dịch</p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 pt-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <Calendar size={14} />
          <span>Từ:</span>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }}
            className="outline-none bg-transparent text-sm" style={{ color: 'var(--text-primary)' }} />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <Calendar size={14} />
          <span>Đến:</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }}
            className="outline-none bg-transparent text-sm" style={{ color: 'var(--text-primary)' }} />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-colors"
            style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
            <X size={14} /> Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="p-6 space-y-2">
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)
        ) : transactions.length === 0 ? (
          <div className="card p-12 text-center" style={{ color: 'var(--text-secondary)' }}>
            <Receipt size={48} className="mx-auto mb-3 opacity-30" />
            <p>Không có giao dịch nào</p>
          </div>
        ) : (
          <>
            {transactions.map(t => (
              <div key={t.id} className="card overflow-hidden">
                <button onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                    <Receipt size={18} style={{ color: '#3b82f6' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-sm" style={{ color: '#3b82f6' }}>{t.transaction_code}</span>
                      <span className="badge text-xs" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>✓ Hoàn thành</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {t.customer_name || 'Khách lẻ'} • {paymentLabel(t.payment_method)} • {formatDate(t.created_at)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{formatCurrency(t.total)}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {t.transaction_items?.length || 0} sản phẩm
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {expanded === t.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {expanded === t.id && (
                  <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="pt-3 space-y-1.5">
                      {t.transaction_items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm py-1">
                          <span style={{ color: 'var(--text-primary)' }}>
                            {item.product_name}
                            <span className="ml-2 text-xs" style={{ color: 'var(--text-secondary)' }}>×{item.quantity} @ {formatCurrency(item.price)}</span>
                          </span>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.subtotal)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 font-bold" style={{ borderTop: '1px dashed var(--border)', color: 'var(--text-primary)' }}>
                        <span>TỔNG</span>
                        <span style={{ color: '#3b82f6' }}>{formatCurrency(t.total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Trang {page} / {Math.ceil(total / LIMIT)}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-secondary px-3 py-2 text-xs disabled:opacity-40">← Trước</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page * LIMIT >= total}
                  className="btn-secondary px-3 py-2 text-xs disabled:opacity-40">Sau →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}