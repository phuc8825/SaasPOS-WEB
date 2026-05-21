import { useState, useEffect } from 'react';
import {
  getStaff, createStaff, updateStaff,
  deleteStaff, resetStaffPassword,
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ROLES = [
  { value: 'cashier', label: 'Thu ngân', color: 'bg-blue-100 text-blue-700' },
  { value: 'admin', label: 'Quản lý', color: 'bg-purple-100 text-purple-700' },
];

function roleInfo(role) {
  return ROLES.find(r => r.value === role) || ROLES[0];
}

const emptyForm = { name: '', username: '', password: '', email: '', phone: '', role: 'cashier' };

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'password' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, isAdmin } = useAuth();

  useEffect(() => { fetchStaff(); }, []);

  async function fetchStaff() {
    try {
      const res = await getStaff();
      // API returns { success: true, data: [...] }
      setStaff(res.data?.data || []);
    } catch (err) {
      setError('Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(emptyForm);
    setError('');
    setModal('create');
  }

  function openEdit(s) {
    setSelected(s);
    setForm({ name: s.name || '', username: s.username, password: '', email: s.email || '', phone: s.phone || '', role: s.role });
    setError('');
    setModal('edit');
  }

  function openPassword(s) {
    setSelected(s);
    setNewPassword('');
    setError('');
    setModal('password');
  }

  function openDelete(s) {
    setSelected(s);
    setModal('delete');
  }

  function closeModal() {
    setModal(null);
    setSelected(null);
    setError('');
  }

  function notify(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await createStaff(form);
      // res.data contains { success, data }
      setStaff(prev => [res.data?.data, ...prev]);
      closeModal();
      notify('Thêm nhân viên thành công!');
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await updateStaff(selected.id, {
        name: form.name, email: form.email, phone: form.phone, role: form.role,
      });
      setStaff(prev => prev.map(s => s.id === selected.id ? res.data?.data : s));
      closeModal();
      notify('Cập nhật thành công!');
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await resetStaffPassword(selected.id, newPassword);
      closeModal();
      notify('Đổi mật khẩu thành công!');
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteStaff(selected.id);
      setStaff(prev => prev.filter(s => s.id !== selected.id));
      closeModal();
      notify('Đã vô hiệu hóa nhân viên!');
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý nhân viên</h1>
          {/* Removed active count display */}
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm nhân viên
          </button>
        )}
      </div>

      {/* Success toast */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Đang tải...</div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Chưa có nhân viên nào. Hãy thêm nhân viên đầu tiên!
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nhân viên', 'Username', 'Email / SĐT', 'Vai trò', 'Thao tác'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map(s => {
                const ri = roleInfo(s.role);
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-sm">
                          {(s.name || s.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{s.name || s.username}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(s.created_at).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-mono">{s.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{s.email || '—'}</div>
                      <div className="text-xs text-gray-400">{s.phone || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ri.color}`}>
                        {ri.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEdit(s)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              title="Chỉnh sửa"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => openPassword(s)}
                              className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
                              title="Đổi mật khẩu"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => openDelete(s)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Xóa"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal overlay */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

            {/* CREATE / EDIT modal */}
            {(modal === 'create' || modal === 'edit') && (
              <form onSubmit={modal === 'create' ? handleCreate : handleUpdate}>
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {modal === 'create' ? 'Thêm nhân viên mới' : 'Chỉnh sửa nhân viên'}
                  </h2>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <Field label="Họ và tên *">
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="input" placeholder="Nguyễn Văn A" required />
                  </Field>
                  {modal === 'create' && (
                    <>
                      <Field label="Username *">
                        <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                          className="input" placeholder="nhanvien01" required />
                      </Field>
                      <Field label="Mật khẩu *">
                        <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                          className="input" placeholder="Ít nhất 6 ký tự" required minLength={6} />
                      </Field>
                    </>
                  )}
                  <Field label="Email">
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="input" placeholder="nhanvien@shop.com" />
                  </Field>
                  <Field label="Số điện thoại">
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="input" placeholder="0912 345 678" />
                  </Field>
                  {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
                  <button type="button" onClick={closeModal} className="btn-ghost">Hủy</button>
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? 'Đang lưu...' : modal === 'create' ? 'Thêm nhân viên' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            )}

            {/* RESET PASSWORD modal */}
            {modal === 'password' && (
              <form onSubmit={handleResetPassword}>
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Đổi mật khẩu</h2>
                  <p className="text-sm text-gray-500 mt-1">Nhân viên: <strong>{selected?.name || selected?.username}</strong></p>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <Field label="Mật khẩu mới *">
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      className="input" placeholder="Ít nhất 6 ký tự" required minLength={6} />
                  </Field>
                  {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
                  <button type="button" onClick={closeModal} className="btn-ghost">Hủy</button>
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </form>
            )}

            {/* DELETE CONFIRMATION modal */}
            {modal === 'delete' && (
              <div>
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h2>
                  <p className="text-sm text-gray-500 mt-1">Bạn có chắc chắn muốn vô hiệu hóa nhân viên <strong>{selected?.name || selected?.username}</strong>?</p>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
                  <button type="button" onClick={closeModal} className="btn-ghost">Hủy</button>
                  <button onClick={handleDelete} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium">
                    {saving ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline styles for reusable classes (dùng nếu chưa có ... */}
      <style>{`
        .input { width: 100%; border: 1px solid #d1d5db; border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; }
        .input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }
        .btn-ghost { padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-weight: 500; color: #374151; background: white; cursor: pointer; }
        .btn-ghost:hover { background: #f9fafb; }
        .btn-primary { padding: 0.5rem 1rem; background: #4f46e5; color: white; border-radius: 0.5rem; font-weight: 500; cursor: pointer; border: none; }
        .btn-primary:hover { background: #4338ca; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
