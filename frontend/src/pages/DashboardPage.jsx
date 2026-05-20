import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency, formatDate } from '../utils/format'
import {
  TrendingUp, ShoppingBag, Package, DollarSign,
  RefreshCw, Calendar, ArrowUp, ArrowDown
} from 'lucide-react'
import toast from 'react-hot-toast'

const PERIODS = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'year', label: 'Năm nay' },
]

export default function DashboardPage() {
  const { tenant } = useAuth()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [period, setPeriod] = useState('today')
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, recentRes] = await Promise.all([
        api.get(`/dashboard/stats?period=${period}`),
        api.get('/dashboard/recent?limit=8'),
      ])
      setStats(statsRes.data.data)
      setRecent(recentRes.data.data)
    } catch {
      toast.error('Không thể tải dữ liệu dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [period])

  const StatCard = ({ icon: Icon, label, value, color, subtitle }) => (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl" style={{ background: `${color}18` }}>
          <Icon size={22} style={{ color }} />
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ background: `${color}12`, color }}>
          {PERIODS.find(p => p.value === period)?.label}
        </span>
      </div>
      <div className="text-2xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {subtitle && <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{subtitle}</div>}
    </div>
  )

  const maxRev = stats?.revenueByDay ? Math.max(...stats.revenueByDay.map(d => d.revenue), 1) : 1

  return (
    <div className="h-screen overflow-y-auto" style={{ background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{tenant?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className="px-3 py-2 text-xs font-medium transition-all"
                style={{
                  background: period === p.value ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'var(--bg-card)',
                  color: period === p.value ? 'white' : 'var(--text-secondary)',
                }}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="p-2 rounded-xl transition-colors" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="w-10 h-10 rounded-xl mb-4" style={{ background: 'var(--border)' }} />
                <div className="h-7 w-24 rounded mb-1" style={{ background: 'var(--border)' }} />
                <div className="h-4 w-20 rounded" style={{ background: 'var(--border)' }} />
              </div>
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={DollarSign} label="Tổng doanh thu" value={formatCurrency(stats.totalRevenue)} color="#8b5cf6" />
            <StatCard icon={ShoppingBag} label="Số hóa đơn" value={stats.totalOrders.toLocaleString()} color="#06b6d4" />
            <StatCard icon={TrendingUp} label="Trung bình/đơn" value={formatCurrency(stats.avgOrderValue)} color="#10b981" />
            <StatCard icon={Package} label="Sản phẩm" value={stats.totalProducts.toLocaleString()} color="#f59e0b" subtitle="đang hoạt động" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Revenue Chart */}
          <div className="card p-5 lg:col-span-3">
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
              Doanh thu 7 ngày gần nhất
            </h3>
            {stats?.revenueByDay && (
              <div className="flex items-end gap-2 h-40">
                {stats.revenueByDay.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                      {day.revenue > 0 ? formatCurrency(day.revenue).replace('₫','').trim() : ''}
                    </div>
                    <div className="w-full rounded-t-lg transition-all relative overflow-hidden"
                      style={{
                        height: `${Math.max((day.revenue / maxRev) * 120, day.revenue > 0 ? 8 : 2)}px`,
                        background: day.revenue > 0 ? 'linear-gradient(180deg, #8b5cf6, #6d28d9)' : 'var(--border)',
                        minHeight: '4px',
                      }} />
                    <div className="text-xs" style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>{day.date}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Products */}
          <div className="card p-5 lg:col-span-2">
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
              🏆 Top sản phẩm
            </h3>
            <div className="space-y-2">
              {(stats?.topProducts || []).slice(0, 6).map((product, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-5 text-center" style={{ color: i < 3 ? '#f59e0b' : 'var(--text-secondary)' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{product.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{product.quantity} cái</div>
                  </div>
                  <div className="text-xs font-semibold" style={{ color: '#8b5cf6' }}>
                    {formatCurrency(product.revenue)}
                  </div>
                </div>
              ))}
              {!stats?.topProducts?.length && (
                <div className="text-center py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Chưa có dữ liệu
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Giao dịch gần đây
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Mã HĐ', 'Khách hàng', 'Phương thức', 'Tổng tiền', 'Thời gian', 'Trạng thái'].map(h => (
                    <th key={h} className="text-left pb-3 text-xs font-semibold uppercase tracking-wide pr-4"
                      style={{ color: 'var(--text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 pr-4">
                      <span className="font-mono text-xs font-semibold" style={{ color: '#8b5cf6' }}>{t.transaction_code}</span>
                    </td>
                    <td className="py-3 pr-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {t.customer_name || <span style={{ color: 'var(--text-secondary)' }}>Khách lẻ</span>}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                        {t.payment_method === 'cash' ? '💵 Tiền mặt' : t.payment_method === 'card' ? '💳 Thẻ' : '🏦 Chuyển khoản'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(t.total)}
                    </td>
                    <td className="py-3 pr-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(t.created_at)}
                    </td>
                    <td className="py-3">
                      <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                        ✓ Hoàn thành
                      </span>
                    </td>
                  </tr>
                ))}
                {!recent.length && (
                  <tr><td colSpan={6} className="py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Chưa có giao dịch nào
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}