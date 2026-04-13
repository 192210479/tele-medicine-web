import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Wallet, Smartphone, Download, Check, Plus, ChevronRight, Activity, TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socketUtils';

// ============================================
// PATIENT VIEW
// ============================================
function PatientBilling({ userId }: { userId: number }) {
  const [methods, setMethods] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [newMethodType, setNewMethodType] = useState('card');
  const [newMethodDetails, setNewMethodDetails] = useState('');
  const [newMethodExpiry, setNewMethodExpiry] = useState('');

  const fetchPatientData = useCallback(async () => {
    try {
      const [histRes, methodsRes] = await Promise.all([
        fetch(`/api/billing/history?patient_id=${userId}`),
        fetch(`/api/payment-methods?patient_id=${userId}`)
      ]);
      if (histRes.ok) {
        const hData = await histRes.json();
        setHistory(hData.billing_history || []);
      }
      if (methodsRes.ok) {
        const mData = await methodsRes.json();
        setMethods(mData.payment_methods || []);
        if (mData.payment_methods?.length > 0 && !selectedMethod) {
          setSelectedMethod(mData.payment_methods.find((m: any) => m.is_default)?.id || mData.payment_methods[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedMethod]);

  const handleAddMethod = async () => {
    if (!newMethodDetails) {
      alert("Please enter card or UPI details");
      return;
    }

    // Determine Mock Provider
    let provider = "Card";
    if (newMethodType === 'upi') provider = newMethodDetails.includes('@ok') ? "Google Pay" : "PhonePe UPI";
    else if (newMethodDetails.startsWith('4')) provider = "Visa";
    else if (newMethodDetails.startsWith('5')) provider = "MasterCard";

    try {
      const res = await fetch("/api/payment-methods/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          role: "patient",
          method_type: newMethodType,
          provider: provider,
          details: newMethodDetails,
          expiry: newMethodExpiry || "12/28"
        })
      });
      if (res.ok) {
        setIsAddingMode(false);
        setNewMethodDetails('');
        fetchPatientData();
      } else {
        alert("Failed to add payment method");
      }
    } catch (e) {
      console.error("Connectivity issue", e);
    }
  };

  useEffect(() => {
    fetchPatientData();
    const socket = getSocket();
    socket.on('payment_success', fetchPatientData);
    socket.on('refund_update', fetchPatientData);

    return () => {
      socket.off('payment_success', fetchPatientData);
      socket.off('refund_update', fetchPatientData);
    };
  }, [fetchPatientData]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Billing Data...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      {/* Left Column: Summary & Payment Methods */}
      <div className="lg:col-span-5 space-y-8">
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 text-white shadow-lg w-full">
          <p className="text-blue-100 text-sm font-medium mb-1">Total Spent</p>
          <h2 className="text-4xl font-bold mb-6">
            ₹{history.reduce((acc, curr) => acc + (curr.payment_status === 'success' ? curr.total_amount : 0), 0).toFixed(2)}
          </h2>
          <Button onClick={() => {
            const section = document.getElementById('payment-methods-section');
            section?.scrollIntoView({ behavior: 'smooth' });
          }} variant="secondary" className="w-full bg-white/20 hover:bg-white/30 text-white border-none rounded-xl" icon={<Plus size={18} />}>
            View Saved Cards
          </Button>
        </div>

        <div id="payment-methods-section">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex justify-between items-center">
            Payment Methods
            {!isAddingMode && (
              <button onClick={() => setIsAddingMode(true)} className="text-primary text-sm font-bold flex items-center gap-1 hover:opacity-80">
                <Plus size={16} /> Add New
              </button>
            )}
          </h3>

          {isAddingMode && (
            <Card className="p-4 mb-4 border-primary border-2 bg-blue-50/20">
              <div className="flex gap-4 mb-3">
                <select
                  value={newMethodType}
                  onChange={e => setNewMethodType(e.target.value)}
                  className="p-2 border rounded-lg text-sm bg-white"
                >
                  <option value="card">Credit/Debit Card</option>
                  <option value="upi">UPI ID</option>
                </select>
                <input
                  type="text"
                  placeholder={newMethodType === 'card' ? "Card Number" : "UPI ID (e.g. john@okicici)"}
                  value={newMethodDetails}
                  onChange={e => setNewMethodDetails(e.target.value)}
                  className="flex-1 p-2 border rounded-lg text-sm"
                />
                {newMethodType === 'card' && (
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={newMethodExpiry}
                    onChange={e => setNewMethodExpiry(e.target.value)}
                    className="w-20 p-2 border rounded-lg text-sm"
                  />
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsAddingMode(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddMethod}>Save Method</Button>
              </div>
            </Card>
          )}

          <div className="space-y-3">
            {methods.length === 0 ? (
              <p className="text-gray-400 text-sm italic">No saved payment methods yet.</p>
            ) : methods.map(m => (
              <Card key={m.id} className={`flex items-center gap-4 p-4 cursor-pointer border-2 transition-colors ${selectedMethod === m.id ? 'border-primary bg-primary/5' : 'border-transparent hover:border-gray-200'}`} onClick={() => setSelectedMethod(m.id)}>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  {m.method_type === 'card' ? <CreditCard size={20} /> : <Smartphone size={20} />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-text-primary text-sm capitalize">{m.provider} {m.masked_details || (m.details && m.details.length > 4 ? `•••• ${m.details.slice(-4)}` : m.details)}</h4>
                  {m.expiry && <p className="text-xs text-text-secondary">Expires {m.expiry}</p>}
                </div>
                {selectedMethod === m.id && <Check size={20} className="text-primary text-xl" />}
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Billing History */}
      <div className="lg:col-span-7">
        <h3 className="text-lg font-bold text-text-primary mb-4">Billing History</h3>
        <div className="space-y-4">
          {history.length === 0 ? (
            <Card className="p-8 text-center"><p className="text-gray-400 text-sm py-4">No billing history found.</p></Card>
          ) : history.map((tx: any) => (
            <Card key={tx.id} className="p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-text-primary text-base">Dr. {tx.doctor_name || 'Consultation'}</h4>
                  <p className="text-sm text-text-secondary mt-1">{new Date(tx.created_at || tx.payment_date || `${tx.appointment_date}T${tx.appointment_time}Z` || Date.now()).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="block font-black text-text-primary text-lg">₹{tx.total_amount?.toFixed(2)}</span>
                  <Badge variant={tx.payment_status === 'success' ? 'success' : tx.payment_status === 'refunded' ? 'info' : 'warning'} className="mt-2 flex items-center gap-1 justify-center scale-[0.85] origin-top-right">
                    {tx.payment_status?.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button onClick={() => window.open(`/api/invoice/${tx.id}`, '_blank')} className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-dark transition-colors">
                  <Download size={16} /> Invoice #{tx.invoice_number?.slice(-6) || tx.id}
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// DOCTOR VIEW
// ============================================
function DoctorBilling({ userId }: { userId: number }) {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctorData = useCallback(async () => {
    try {
      const [walletRes, txnRes] = await Promise.all([
        fetch(`/api/doctor/wallet?doctor_id=${userId}`),
        fetch(`/api/doctor/transactions?doctor_id=${userId}&limit=20`)
      ]);
      if (walletRes.ok) setWallet(await walletRes.json());
      if (txnRes.ok) setTransactions((await txnRes.json()).transactions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDoctorData();
    const socket = getSocket();
    socket.on('wallet_update', fetchDoctorData);

    // Fallback polling
    const int = setInterval(fetchDoctorData, 15000);
    return () => {
      socket.off('wallet_update', fetchDoctorData);
      clearInterval(int);
    };
  }, [fetchDoctorData]);

  const handleWithdrawal = async () => {
    const rawAmount = window.prompt(`Enter amount to withdraw (Available: ₹${wallet?.available_balance || 0}):`);
    if (!rawAmount) return;
    const amount = parseFloat(rawAmount);
    if (isNaN(amount) || amount <= 0) { alert('Invalid amount'); return; }
    if (amount > (wallet?.available_balance || 0)) { alert('Insufficient balance'); return; }

    try {
      const res = await fetch('/api/doctor/withdrawal/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: 'doctor', amount })
      });
      if (res.ok) {
        alert('Withdrawal request submitted securely.');
        fetchDoctorData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit withdrawal request.');
      }
    } catch (e) {
      alert('Connectivity error. Please try again later.');
    }
  };

  if (loading || !wallet) return <div className="p-8 text-center text-gray-500">Syncing Ledger...</div>;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 border-none shadow-md flex flex-col justify-between">
          <div>
            <p className="text-green-100 text-sm font-black tracking-wider uppercase mb-2 flex items-center gap-2"><CheckCircle size={16} /> Available Balance</p>
            <h2 className="text-4xl font-black">₹{(wallet.available_balance || 0).toFixed(2)}</h2>
          </div>
          <Button onClick={handleWithdrawal} className="mt-6 w-full bg-white text-green-700 hover:bg-gray-100 font-bold border-none transition-colors py-3">
            Withdraw Funds
          </Button>
        </Card>
        <Card className="bg-white p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className="text-gray-400 text-xs font-black tracking-wider uppercase flex items-center gap-2"><Clock size={16} /> Pending Clearing</p>
          <h3 className="text-3xl font-bold text-gray-800 mt-2">₹{(wallet.pending_balance || 0).toFixed(2)}</h3>
        </Card>
        <Card className="bg-white p-6 border border-gray-100 shadow-sm flex flex-col justify-center items-end text-right">
          <p className="text-gray-400 text-xs font-black tracking-wider uppercase flex items-center gap-2"><TrendingUp size={16} /> Lifetime Earnings</p>
          <h3 className="text-3xl font-bold text-primary mt-2">₹{(wallet.total_earned || 0).toFixed(2)}</h3>
        </Card>
      </div>

      <div>
        <h3 className="text-xl font-black text-gray-900 mb-6 tracking-tight">Ledger History</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transactions.length === 0 ? (
            <Card className="p-8 text-center md:col-span-2"><p className="text-gray-400 text-sm border-none shadow-none">No transactions yet.</p></Card>
          ) : transactions.map(t => (
            <Card key={t.id} className="p-5 hover:border-gray-200 transition-colors border-transparent border shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${t.net_amount >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                    {t.net_amount >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900">{t.transaction_type?.replace('_', ' ').toUpperCase() || 'TXN'}</p>
                    <p className="text-sm text-gray-500 max-w-[200px] truncate">{t.note || `Appt #${t.appointment_id}`}</p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">{new Date(t.created_at_utc || t.created_at || Date.now()).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className={`font-black text-lg ${t.net_amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {t.net_amount >= 0 ? '+' : '-'}₹{Math.abs(t.net_amount || 0).toFixed(2)}
                  </span>
                  <Badge variant={t.status === 'pending' ? 'warning' : 'success'} className="scale-[0.85] origin-top-right mt-2">
                    {t.status?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// ADMIN VIEW
// ============================================
function AdminBilling() {
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'payments' | 'withdrawals'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState<any[]>([]);

  const fetchAdminData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/finance/summary");
      if (res.ok) setSummary(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  const fetchList = async (type: 'payments' | 'withdrawals') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/finance/${type}?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setLists(data[type] || data.transactions || data.withdrawals || data.payments || data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'dashboard') { fetchAdminData(); }
    else { fetchList(activeTab); }
    const interval = setInterval(() => {
      if (activeTab === 'dashboard') fetchAdminData();
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab, fetchAdminData]);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/withdrawal/${action}/${id}`, { method: 'POST' });
      if (res.ok) fetchList('withdrawals');
      else alert("Failed to process withdrawal action.");
    } catch (e) { console.error(e); }
  }

  if (loading && !summary && activeTab === 'dashboard') return <div className="p-8 text-center text-gray-500">Compiling Platform Finances...</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {activeTab !== 'dashboard' && (
        <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-2 text-primary font-bold hover:underline mb-4">
          ← Back to Dashboard
        </button>
      )}

      {activeTab === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Revenue Card */}
            <Card className="lg:col-span-8 bg-gradient-to-br from-indigo-800 to-purple-900 border-none shadow-xl p-8 text-white rounded-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
              <div>
                <p className="text-indigo-200 text-sm font-black uppercase tracking-widest mb-3 relative z-10">Total Platform Revenue</p>
                <h1 className="text-5xl lg:text-6xl font-black mb-4 relative z-10">₹{((summary?.total_platform_revenue || summary?.revenue || 0)).toFixed(2)}</h1>
              </div>
              <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-white/10 relative z-10 w-full">
                <div>
                  <p className="text-xs text-indigo-200 uppercase tracking-wider mb-1">Total GMV</p>
                  <p className="font-bold text-2xl">₹{(summary?.total_gmv || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-indigo-200 uppercase tracking-wider mb-1">Total Payments</p>
                  <p className="font-bold text-2xl">{summary?.total_transactions_count || 0}</p>
                </div>
              </div>
            </Card>

            {/* Secondary Stats */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <Card className="p-8 border border-gray-100 flex flex-col justify-center items-center text-center shadow-sm flex-1">
                <p className="text-gray-400 text-xs font-black uppercase mb-2 tracking-widest">Pending Withdrawals</p>
                <h3 className="text-4xl font-black text-orange-500 mt-1">{summary?.pending_withdrawals_count || 0}</h3>
              </Card>
              <Card className="p-8 border border-gray-100 flex flex-col justify-center items-center text-center shadow-sm flex-1">
                <p className="text-gray-400 text-xs font-black uppercase mb-2 tracking-widest">Refunds Processed</p>
                <h3 className="text-4xl font-black text-red-500 mt-1">{summary?.refunds_count || 0}</h3>
              </Card>
            </div>
          </div>

          {/* Admin Action Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <button onClick={() => setActiveTab('payments')} className="bg-white border border-gray-200 p-6 rounded-2xl flex items-center justify-between text-left hover:border-primary transition-colors hover:shadow-md group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Activity size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">All Payments Ledger</h4>
                  <p className="text-sm text-gray-500 mt-1">View real-time global transactions.</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300" size={24} />
            </button>

            <button onClick={() => setActiveTab('withdrawals')} className="bg-white border border-gray-200 p-6 rounded-2xl flex items-center justify-between text-left hover:border-primary transition-colors hover:shadow-md group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <Wallet size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Global Withdrawals</h4>
                  <p className="text-sm text-gray-500 mt-1">Approve/Reject payouts.</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300" size={24} />
            </button>
          </div>
        </>
      )}

      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Withdrawal Requests</h3>
          {(!lists || lists.length === 0) && !loading && <p className="text-center text-gray-500 py-10">No withdrawals found.</p>}
          {lists && lists.length > 0 && lists.map(w => (
            <Card key={w.id} className="p-5 flex justify-between items-center hover:border-orange-200 transition-colors">
              <div>
                <h4 className="font-bold text-gray-900">Dr. {w.doctor_name || `ID: ${w.doctor_id}`}</h4>
                <p className="text-sm text-gray-500">{new Date(w.created_at_utc || w.created_at || Date.now()).toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">{w.bank_account || 'Default Account'}</p>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-xl font-black text-orange-600">₹{w.amount?.toFixed(2)}</span>
                {w.status === 'pending' ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAction(w.id, 'approve')} className="bg-green-600 hover:bg-green-700">Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(w.id, 'reject')} className="text-red-500 border-red-500 hover:bg-red-50">Reject</Button>
                  </div>
                ) : (
                  <Badge variant={w.status === 'approved' ? 'success' : 'warning'}>{(w.status || '').toUpperCase()}</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-4">
          <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Global Payments</h3>
          {(!lists || lists.length === 0) && !loading && <p className="text-center text-gray-500 py-10">No payments found.</p>}
          {lists && lists.length > 0 && lists.map(tx => (
            <Card key={tx.id} className="p-5 flex justify-between items-center hover:border-primary transition-colors">
              <div>
                <h4 className="font-bold text-gray-900">{tx.patient_name || `Patient #${tx.patient_id}`} → Dr. {tx.doctor_name || `Doctor #${tx.doctor_id}`}</h4>
                <p className="text-sm text-gray-500">{tx.transaction_id || tx.razorpay_payment_id || `TRX-${tx.id}`}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(tx.created_at || tx.payment_date || Date.now()).toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xl font-black text-gray-900">₹{tx.total_amount?.toFixed(2)}</span>
                <Badge className="mt-1" variant={tx.payment_status === 'success' ? 'success' : tx.payment_status === 'refunded' ? 'info' : 'warning'}>
                  {(tx.payment_status || 'UNKNOWN').toUpperCase()}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// MAIN COMPONENT EXPORT
// ============================================

export function PaymentsBillingScreen() {
  // @ts-ignore
  const { role: authRole, userId: authUserId } = useAuth();

  // Safe resolution
  const role = authRole || localStorage.getItem("role") || "patient";
  const getUserId = () => {
    if (authUserId) return Number(authUserId);
    const keys = ["user_id", "userId", "id", "doctor_id", "patient_id"];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v && !isNaN(Number(v))) return Number(v);
    }
    return 1; // Fallback
  };

  const userId = getUserId();

  return (
    <ScreenContainer title={role === 'doctor' ? "Wallet & Earnings" : role === 'admin' ? "Financial Control" : "Payments & Billing"} showBack className="bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-6 py-8 md:px-8 lg:px-12 mb-10 w-full">
        {role === 'patient' && <PatientBilling userId={userId} />}
        {role === 'doctor' && <DoctorBilling userId={userId} />}
        {role === 'admin' && <AdminBilling />}
      </div>
    </ScreenContainer>
  );
}
