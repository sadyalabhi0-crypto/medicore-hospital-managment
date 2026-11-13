import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  DollarSign,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';

const BillingPage = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'receptionist';

  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalBills: 0,
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Create Bill Modal (Admin / Receptionist)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    amount: 150,
    paymentStatus: 'pending',
    paymentMethod: 'unpaid',
  });
  const [submitting, setSubmitting] = useState(false);

  // Payment Settlement Modal (Staff or Patient paying invoice)
  const [payingBill, setPayingBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bills', {
        params: { paymentStatus: statusFilter },
      });
      setBills(data.bills || []);
      setSummary(
        data.summary || { totalPaid: 0, totalPending: 0, totalBills: 0 }
      );
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Unable to load billing records.',
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  useEffect(() => {
    if (!isStaff) return;
    api
      .get('/patients', { params: { limit: 100 } })
      .then((res) => {
        const pts = res.data.patients || [];
        setPatients(pts);
        setFormData((prev) => ({ ...prev, patientId: prev.patientId || pts[0]?._id || '' }));
      })
      .catch(() => {});
  }, [isStaff]);

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/bills', formData);
      showToast('success', 'Invoice generated successfully.');
      setIsCreateOpen(false);
      fetchBills();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to create invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettleBill = async (e) => {
    e.preventDefault();
    if (!payingBill) return;
    setSubmitting(true);
    try {
      await api.put(`/bills/${payingBill._id}`, {
        paymentStatus: 'paid',
        paymentMethod,
      });
      showToast('success', 'Payment recorded and invoice marked as PAID.');
      setPayingBill(null);
      fetchBills();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to process payment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Build Payment Method Revenue Breakdown for Recharts
  const methodTotals = {
    card: 0,
    cash: 0,
    insurance: 0,
    online: 0,
  };
  bills
    .filter((b) => b.paymentStatus === 'paid')
    .forEach((b) => {
      const m = b.paymentMethod || 'card';
      if (methodTotals[m] !== undefined) {
        methodTotals[m] += b.amount || 0;
      }
    });

  const revenueChartData = [
    { name: 'Card', amount: methodTotals.card, color: '#2563eb' },
    { name: 'Insurance', amount: methodTotals.insurance, color: '#10b981' },
    { name: 'Online', amount: methodTotals.online, color: '#8b5cf6' },
    { name: 'Cash', amount: methodTotals.cash, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isStaff
              ? 'Hospital Billing & Financial Reports'
              : 'My Invoices & Payment History'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isStaff
              ? 'Generate patient invoices, record payments across methods, and track hospital revenue.'
              : 'View your consultation invoices and settle pending balances online.'}
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Create New Invoice
          </button>
        )}
      </div>

      {feedback.message && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-sm ${
            feedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Collected Revenue (Paid)"
          value={`$${summary.totalPaid.toLocaleString()}`}
          subtitle="Settled invoices"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Pending Balance"
          value={`$${summary.totalPending.toLocaleString()}`}
          subtitle="Awaiting settlement"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Total Invoices"
          value={summary.totalBills}
          subtitle="All billing records"
          icon={FileSpreadsheet}
          color="blue"
        />
      </div>

      {/* Staff Financial Analytics Chart */}
      {isStaff && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Revenue Breakdown by Payment Channel
            </h2>
            <p className="text-xs text-slate-500">
              Distribution of paid invoices across Card, Insurance, Online, and Cash
            </p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueChartData}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value) => [`$${value}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {revenueChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-medical-600" />
            <span className="text-sm font-bold text-slate-900">
              Billing Ledger ({bills.length})
            </span>
          </div>

          <div className="w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field py-1.5 text-xs"
            >
              <option value="">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 pl-6 pr-4">Invoice Date</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Appointment Details</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    No billing records found.
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-slate-50/70">
                    <td className="py-4 pl-6 pr-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-900">
                        {bill.patientId?.userId?.name || 'Patient'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {bill.patientId?.userId?.phone}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600">
                      {bill.appointmentId ? (
                        <div>
                          <p className="font-medium text-slate-800">
                            {bill.appointmentId.appointmentDate} (
                            {bill.appointmentId.doctorId?.userId?.name || 'Doctor'})
                          </p>
                          <p className="truncate max-w-xs">{bill.appointmentId.reason}</p>
                        </div>
                      ) : (
                        <span>Direct Hospital Service Charge</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      ${bill.amount?.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 capitalize text-xs font-medium text-slate-600">
                      {bill.paymentMethod}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={bill.paymentStatus} />
                    </td>
                    <td className="py-4 pl-4 pr-6 text-right">
                      {bill.paymentStatus === 'pending' ? (
                        <button
                          onClick={() => {
                            setPayingBill(bill);
                            setPaymentMethod('card');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-medical-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-medical-700"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          {isStaff ? 'Record Payment' : 'Pay Now'}
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">
                          {bill.paymentStatus === 'paid' ? 'Settled' : 'Void'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal (Admin / Receptionist) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Create Patient Invoice</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Patient *
                </label>
                <select
                  value={formData.patientId}
                  onChange={(e) =>
                    setFormData({ ...formData, patientId: e.target.value })
                  }
                  className="input-field"
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map((pt) => (
                    <option key={pt._id} value={pt._id}>
                      {pt.userId?.name} ({pt.userId?.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Amount ($ USD) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Payment Status
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentStatus: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid Immediately</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentMethod: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="card">Card</option>
                    <option value="cash">Cash</option>
                    <option value="insurance">Insurance</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Creating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle / Pay Bill Modal */}
      {payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Settle Invoice Payment</h2>
              <button
                onClick={() => setPayingBill(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSettleBill} className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 text-sm border border-slate-100">
                <p className="text-xs text-slate-500">Patient</p>
                <p className="font-bold text-slate-900">
                  {payingBill.patientId?.userId?.name}
                </p>
                <p className="mt-2 text-xs text-slate-500">Amount Due</p>
                <p className="text-2xl font-bold text-emerald-700">
                  ${payingBill.amount?.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Select Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input-field"
                >
                  <option value="card">Credit / Debit Card</option>
                  <option value="online">Online Banking / Portal</option>
                  <option value="insurance">Health Insurance Claim</option>
                  <option value="cash">Cash at Front Desk</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setPayingBill(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
