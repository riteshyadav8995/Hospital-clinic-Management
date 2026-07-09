import { useEffect, useState } from "react";
import api from "../utils/api";
import { Receipt, CheckCircle, Clock } from "lucide-react";

function AdminBilling() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Payment Modal State
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [referenceNo, setReferenceNo] = useState("");

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/billing/invoices");
      setInvoices(res.data.invoices || []);
    } catch (err) {
      console.error("Failed to fetch invoices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePayment = async () => {
    if (!paymentAmount || isNaN(paymentAmount)) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      await api.post("/billing/payments", {
        invoice_id: activeInvoice.id,
        amount: paymentAmount,
        mode: paymentMode,
        reference_no: referenceNo
      });
      alert("Payment recorded successfully!");
      setActiveInvoice(null);
      setPaymentAmount("");
      setReferenceNo("");
      fetchInvoices();
    } catch (err) {
      alert("Failed to record payment.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Unpaid": return "bg-red-100 text-red-800 border-red-200";
      case "Partial": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Paid": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) return <div className="p-8 text-center">Loading invoices...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="text-teal-600" /> Billing & Finance
          </h1>
          <p className="text-gray-500">Manage hospital invoices, dues, and record payments</p>
        </div>
      </div>

      {activeInvoice && (
        <div className="mb-8 glass-panel p-8 animate-slide-in">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200/60">
            <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
            <button onClick={() => setActiveInvoice(null)} className="text-sm font-bold text-gray-500 hover:text-gray-800">Cancel</button>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">Invoice: <span className="font-bold text-gray-800">{activeInvoice.invoice_no}</span></p>
            <p className="text-sm text-gray-600">Patient: {activeInvoice.patient_name} ({activeInvoice.patient_code})</p>
            <p className="text-sm text-gray-600">Total Payable: <span className="font-bold">₹{activeInvoice.payable}</span></p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Amount Received</label>
              <input type="number" className="mt-1 w-full border px-4 py-2 rounded-xl" placeholder="e.g. 500" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Payment Mode</label>
              <select className="mt-1 w-full border px-4 py-2 rounded-xl bg-white" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Ref / Transaction ID</label>
              <input type="text" className="mt-1 w-full border px-4 py-2 rounded-xl" placeholder="Optional" value={referenceNo} onChange={e => setReferenceNo(e.target.value)} />
            </div>
          </div>

          <button onClick={handlePayment} className="premium-btn w-full md:w-auto px-8 py-3.5 flex items-center justify-center gap-2 mt-2">
            <CheckCircle size={20} /> <span className="tracking-wide">Confirm Payment</span>
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {invoices.length === 0 ? (
          <div className="p-16 text-center glass-panel">
            <p className="text-slate-500 text-lg font-medium">No invoices found.</p>
          </div>
        ) : (
          invoices.map((inv, i) => (
            <div key={inv.id} className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-lg transition-all hover:-translate-y-0.5 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex-1 w-full md:w-auto">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{inv.invoice_no}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(inv.status)}`}>
                    {inv.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Patient: <span className="font-bold text-gray-800">{inv.patient_name}</span> ({inv.patient_code})</p>
                <p className="text-sm text-gray-500 mt-1">Date: {new Date(inv.created_at).toLocaleString()}</p>
              </div>
              
              <div className="text-left md:text-right flex-shrink-0 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-slate-100 md:border-0">
                <p className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">₹{inv.payable}</p>
                {inv.status !== "Paid" && (
                  <button onClick={() => { setActiveInvoice(inv); setPaymentAmount(inv.payable); }} className="premium-btn px-6 py-2.5 w-full flex items-center justify-center gap-2 text-sm">
                    <Receipt size={16} /> Collect Payment
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminBilling;
