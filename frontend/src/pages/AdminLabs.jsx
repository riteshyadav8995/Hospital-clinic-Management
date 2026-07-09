import { useEffect, useState } from "react";
import api from "../utils/api";
import { FlaskConical, FileText, Upload, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

function AdminLabs() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Results Entry Form
  const [activeOrder, setActiveOrder] = useState(null);
  const [resultValue, setResultValue] = useState("");
  const [normalRange, setNormalRange] = useState("");

  const fetchOrders = async () => {
    try {
      const res = await api.get("/labs/orders");
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Failed to fetch lab orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/labs/orders/${id}/status`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const submitResults = async () => {
    if (!resultValue) {
      alert("Please enter a result value.");
      return;
    }
    
    try {
      await api.post(`/labs/orders/${activeOrder.id}/results`, {
        result_value: resultValue,
        normal_range: normalRange
      });
      alert("Results Submitted Successfully!");
      setActiveOrder(null);
      setResultValue("");
      setNormalRange("");
      fetchOrders();
    } catch (err) {
      alert("Failed to submit results.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Ordered": return "bg-gray-100 text-gray-800 border-gray-200";
      case "Sample Collected": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Processing": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Report Ready": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) return <div className="p-8 text-center">Loading lab orders...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical className="text-teal-600" /> Laboratory Dashboard
          </h1>
          <p className="text-gray-500">Manage internal lab orders and update reports</p>
        </div>
      </div>

      {activeOrder && (
        <div className="mb-8 bg-white p-6 rounded-3xl border border-teal-200 shadow-md">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-teal-100">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><FileText className="text-teal-600" /> Enter Test Results</h2>
            <button onClick={() => setActiveOrder(null)} className="text-sm font-bold text-gray-500 hover:text-gray-800">Cancel</button>
          </div>
          
          <div className="mb-4">
            <p className="font-bold text-gray-800">Test: {activeOrder.test_name}</p>
            <p className="text-sm text-gray-600">Patient: {activeOrder.patient_name} ({activeOrder.patient_code})</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Observed Result Value</label>
              <input type="text" className="mt-1 w-full border px-4 py-2 rounded-xl" placeholder="e.g. 14.5 g/dL" value={resultValue} onChange={e => setResultValue(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Normal Range / Reference</label>
              <input type="text" className="mt-1 w-full border px-4 py-2 rounded-xl" placeholder="e.g. 13.0 - 17.0 g/dL" value={normalRange} onChange={e => setNormalRange(e.target.value)} />
            </div>
          </div>

          <button onClick={submitResults} className="bg-teal-700 text-white font-bold px-6 py-3 rounded-xl hover:bg-teal-800 transition flex items-center justify-center gap-2 w-full md:w-auto">
            <Upload size={18} /> Submit Verified Report
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {orders.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed">
            <p className="text-gray-500 italic">No pending lab orders.</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1 w-full md:w-auto">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{order.test_name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Patient: <span className="font-bold text-gray-800">{order.patient_name}</span> ({order.patient_code})</p>
                <p className="text-sm text-gray-500 mt-1">Ordered By: Dr. {order.doctor_name} | Date: {new Date(order.created_at).toLocaleString()}</p>
              </div>
              
              <div className="flex flex-wrap gap-2 shrink-0">
                {order.status === "Ordered" && (
                  <button onClick={() => updateStatus(order.id, "Sample Collected")} className="bg-yellow-50 text-yellow-700 border border-yellow-200 font-bold px-4 py-2 rounded-lg text-sm hover:bg-yellow-100 transition">
                    Mark Sample Collected
                  </button>
                )}
                {order.status === "Sample Collected" && (
                  <button onClick={() => updateStatus(order.id, "Processing")} className="bg-purple-50 text-purple-700 border border-purple-200 font-bold px-4 py-2 rounded-lg text-sm hover:bg-purple-100 transition">
                    Start Processing
                  </button>
                )}
                {order.status === "Processing" && (
                  <button onClick={() => setActiveOrder(order)} className="bg-teal-600 text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-teal-700 transition">
                    Enter Results
                  </button>
                )}
                {order.status === "Report Ready" && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-green-700 font-bold flex items-center gap-1 bg-green-50 px-4 py-2 rounded-lg border border-green-200 text-sm">
                      <CheckCircle size={16} /> Completed
                    </span>
                    <button onClick={() => navigate("/lab-report-print", { state: { lab: order } })} className="bg-teal-700 text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-teal-800 transition">
                      View PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminLabs;
