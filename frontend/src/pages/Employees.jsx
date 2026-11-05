import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  DollarSign,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function Employees() {
  const { hasRole, settings } = useAuth();
  const currency = settings?.currencySymbol || '$';

  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEmpId, setCurrentEmpId] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleId: '',
    salary: 45000,
    hireDate: new Date().toISOString().split('T')[0],
    createAccount: true,
    username: '',
    password: '',
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter !== 'all') params.roleId = roleFilter;

      const [empRes, roleRes] = await Promise.all([
        api.get('/employees', { params }),
        api.get('/employees/roles'),
      ]);

      if (empRes.data?.success) setEmployees(empRes.data.data);
      if (roleRes.data?.success) {
        setRoles(roleRes.data.data);
        if (!formData.roleId && roleRes.data.data.length > 0) {
          setFormData((prev) => ({ ...prev, roleId: roleRes.data.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [roleFilter]);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setCurrentEmpId(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      roleId: roles[0]?.id || '',
      salary: 45000,
      hireDate: new Date().toISOString().split('T')[0],
      createAccount: true,
      username: '',
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setIsEditMode(true);
    setCurrentEmpId(emp.id);
    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      roleId: emp.roleId,
      salary: emp.salary,
      hireDate: new Date(emp.hireDate).toISOString().split('T')[0],
      createAccount: false,
      username: '',
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await api.put(`/employees/${currentEmpId}`, formData);
      } else {
        await api.post('/employees', formData);
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save employee');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/employees/${id}/toggle-status`);
      fetchEmployees();
    } catch (err) {
      alert('Could not update status');
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    if (window.confirm(`Delete record for "${name}"?`)) {
      try {
        await api.delete(`/employees/${id}`);
        setEmployees((prev) => prev.filter((e) => e.id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete employee');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-cream-50">
            Employee & Personnel Roster
          </h1>
          <p className="text-xs text-cream-400 mt-0.5">
            Role allocations, credential access, compensation, and active statuses
          </p>
        </div>

        {hasRole(['ADMIN', 'MANAGER']) && (
          <div className="flex items-center space-x-2.5">
            <button
              onClick={fetchEmployees}
              className="p-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-cream-300 border border-charcoal-700"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-orange-dark to-brand-orange hover:from-brand-orange text-white text-xs font-bold shadow-md shadow-brand-orange/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-charcoal-900 border border-charcoal-800 flex items-center justify-between gap-4">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-charcoal-800 border border-charcoal-700 text-cream-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
        >
          <option value="all">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Employees Table */}
      {loading ? (
        <div className="p-12 text-center text-cream-400 text-xs">Loading staff roster...</div>
      ) : employees.length === 0 ? (
        <div className="p-12 text-center bg-charcoal-900 border border-charcoal-800 rounded-2xl">
          <Briefcase className="w-10 h-10 mx-auto text-cream-400/40 mb-2" />
          <p className="text-sm font-serif font-bold text-cream-100">No staff members found</p>
        </div>
      ) : (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-800 text-[10px] font-semibold text-cream-400 uppercase tracking-wider bg-charcoal-850">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Salary</th>
                  <th className="py-3 px-4">Hire Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-charcoal-850/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-serif font-bold text-cream-100 text-sm">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-[10px] text-cream-400">
                        User: {emp.user?.username || 'No System Login'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-gold/15 border border-brand-gold/30 text-brand-gold uppercase">
                        {emp.role?.name}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-cream-300">
                      <div className="flex items-center space-x-1.5">
                        <Phone className="w-3 h-3 text-cream-400" />
                        <span>{emp.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5 text-[11px] text-cream-400">
                        <Mail className="w-3 h-3 text-cream-400" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-cream-100">
                      {currency}{Number(emp.salary).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-cream-300">
                      {new Date(emp.hireDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(emp.id)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                          emp.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                        }`}
                      >
                        {emp.status === 'ACTIVE' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        <span>{emp.status}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="p-1.5 rounded-lg text-cream-400 hover:text-white"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {hasRole(['ADMIN']) && (
                        <button
                          onClick={() => handleDeleteEmployee(emp.id, `${emp.firstName} ${emp.lastName}`)}
                          className="p-1.5 rounded-lg text-cream-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Employee Details' : 'Add New Staff Member'}
      >
        <form onSubmit={handleSaveEmployee} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Assign Role *</label>
              <select
                required
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Annual Salary ({currency})</label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          {!isEditMode && (
            <div className="p-3 rounded-xl bg-charcoal-800 border border-charcoal-700 space-y-3">
              <label className="flex items-center space-x-2 text-xs text-cream-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.createAccount}
                  onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                  className="rounded bg-charcoal-900 border-charcoal-700 text-brand-orange focus:ring-brand-orange"
                />
                <span className="font-semibold">Create System Login Account</span>
              </label>

              {formData.createAccount && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] text-cream-400 mb-1">Username *</label>
                    <input
                      type="text"
                      required={formData.createAccount}
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="e.g. jdoe"
                      className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-2.5 py-1.5 text-xs text-cream-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-cream-400 mb-1">Password *</label>
                    <input
                      type="password"
                      required={formData.createAccount}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-2.5 py-1.5 text-xs text-cream-100"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-charcoal-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-charcoal-800 text-cream-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-bold"
            >
              {isEditMode ? 'Update Staff Record' : 'Add Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
