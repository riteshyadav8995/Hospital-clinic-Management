import { useEffect, useState } from "react";
import api from "../utils/api";
import { Pill, CheckCircle, Package, Plus } from "lucide-react";

function AdminPharmacy() {
  const [activeTab, setActiveTab] = useState("prescriptions");
  const [orders, setOrders] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [medData, setMedData] = useState({ name: "", generic_name: "", reorder_level: "" });

  const [showAddStock, setShowAddStock] = useState(false);
  const [stockData, setStockData] = useState({ medicine_id: "", batch_no: "", expiry: "", qty: "", rate: "" });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, medRes] = await Promise.all([
        api.get("/pharmacy/prescriptions"),
        api.get("/pharmacy/medicines")
      ]);
      setOrders(orderRes.data.orders || []);
      setMedicines(medRes.data.medicines || []);
    } catch (err) {
      console.error("Failed to fetch pharmacy data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fulfillOrder = async (consultation_id, prescriptions) => {
    const ids = prescriptions.map(p => p.prescription_id);
    try {
      await api.post("/pharmacy/prescriptions/fulfill", { prescription_ids: ids });
      alert("Order Fulfilled Successfully!");
      fetchData();
    } catch (err) {
      alert("Failed to fulfill order.");
    }
  };

  const handleAddMedicine = async () => {
    try {
      await api.post("/pharmacy/medicines", medData);
      alert("Medicine added successfully");
      setShowAddMedicine(false);
      setMedData({ name: "", generic_name: "", reorder_level: "" });
      fetchData();
    } catch (err) {
      alert("Failed to add medicine");
    }
  };

  const handleAddStock = async () => {
    try {
      await api.post("/pharmacy/stock", stockData);
      alert("Stock batch added successfully");
      setShowAddStock(false);
      setStockData({ medicine_id: "", batch_no: "", expiry: "", qty: "", rate: "" });
      fetchData();
    } catch (err) {
      alert("Failed to add stock");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading pharmacy...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Pill className="text-teal-600" /> Pharmacy & Dispensary
          </h1>
          <p className="text-gray-500">Manage prescription orders and medicine inventory</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        <button onClick={() => setActiveTab("prescriptions")} className={`pb-2 px-4 font-bold ${activeTab === "prescriptions" ? "text-teal-700 border-b-2 border-teal-700" : "text-gray-500 hover:text-gray-800"}`}>
          Live Prescriptions
        </button>
        <button onClick={() => setActiveTab("inventory")} className={`pb-2 px-4 font-bold ${activeTab === "inventory" ? "text-teal-700 border-b-2 border-teal-700" : "text-gray-500 hover:text-gray-800"}`}>
          Inventory & Stock
        </button>
      </div>

      {activeTab === "prescriptions" && (
        <div className="grid gap-6">
        {orders.length === 0 ? (
          <div className="p-16 text-center glass-panel">
            <p className="text-slate-500 text-lg font-medium">No pending prescriptions.</p>
          </div>
        ) : (
          orders.map((order, i) => (
            <div key={order.consultation_id} className="glass-panel p-6 flex flex-col md:flex-row justify-between gap-6 hover:-translate-y-0.5 transition-all hover:shadow-lg animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex-1">
                <div className="flex justify-between items-start border-b pb-3 mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">{order.patient_name} <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md ml-2 border border-slate-200">ID: {order.patient_code}</span></h3>
                    <p className="text-sm text-slate-600 mt-1.5 font-medium">Prescribed by: Dr. {order.doctor_name} <span className="text-slate-400">({order.doctor_department})</span></p>
                  </div>
                  <div className="bg-slate-900 text-white text-sm font-mono font-bold px-4 py-1.5 rounded-lg shadow-sm border border-slate-700">
                    {order.token_no}
                  </div>
                </div>

                <div className="space-y-3">
                  {order.prescriptions.map(p => (
                    <div key={p.prescription_id} className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-3 rounded-xl border items-center">
                      <div className="font-bold text-sm text-gray-800">{p.medicine_name}</div>
                      <div className="text-sm text-gray-600">{p.dosage}</div>
                      <div className="text-sm text-gray-600">{p.frequency} x {p.duration}</div>
                      <div className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-1 rounded">{p.instructions || "No Specific Instructions"}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 shrink-0">
                <button onClick={() => fulfillOrder(order.consultation_id, order.prescriptions)} className="premium-btn px-6 py-3.5 flex items-center justify-center gap-2">
                  <CheckCircle size={18} /> Dispense & Fulfill
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">Deducts from inventory</p>
              </div>
            </div>
          ))
        )}
      </div>
      )}

      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => setShowAddMedicine(!showAddMedicine)} className="bg-white/80 backdrop-blur border border-teal-600 text-teal-700 font-bold px-5 py-2.5 rounded-xl hover:bg-teal-50 transition-all flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5">
              <Plus size={18}/> Add New Medicine
            </button>
            <button onClick={() => setShowAddStock(!showAddStock)} className="premium-btn px-5 py-2.5 flex items-center justify-center gap-2">
              <Package size={18}/> Add Stock Batch
            </button>
          </div>

          {showAddMedicine && (
            <div className="bg-teal-50 p-6 rounded-2xl border border-teal-200 grid gap-4 md:grid-cols-3 items-end">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Brand Name</label>
                <input type="text" className="w-full border px-3 py-2 rounded mt-1" value={medData.name} onChange={e => setMedData({...medData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Generic / Composition</label>
                <input type="text" className="w-full border px-3 py-2 rounded mt-1" value={medData.generic_name} onChange={e => setMedData({...medData, generic_name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Reorder Alert Level</label>
                <input type="number" className="w-full border px-3 py-2 rounded mt-1" value={medData.reorder_level} onChange={e => setMedData({...medData, reorder_level: e.target.value})} />
              </div>
              <button onClick={handleAddMedicine} className="bg-teal-700 text-white font-bold py-2 rounded hover:bg-teal-800">Save Medicine</button>
            </div>
          )}

          {showAddStock && (
            <div className="glass-panel p-8 grid gap-5 md:grid-cols-3 items-end animate-slide-in">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Select Medicine</label>
                <select className="w-full border px-3 py-2 rounded mt-1 bg-white" value={stockData.medicine_id} onChange={e => setStockData({...stockData, medicine_id: e.target.value})}>
                  <option value="">-- Select --</option>
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Batch Number</label>
                <input type="text" className="w-full border px-3 py-2 rounded mt-1" value={stockData.batch_no} onChange={e => setStockData({...stockData, batch_no: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Expiry Date</label>
                <input type="date" className="w-full border px-3 py-2 rounded mt-1" value={stockData.expiry} onChange={e => setStockData({...stockData, expiry: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Quantity</label>
                <input type="number" className="w-full border px-3 py-2 rounded mt-1" value={stockData.qty} onChange={e => setStockData({...stockData, qty: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Rate (Optional)</label>
                <input type="number" className="w-full border px-3 py-2 rounded mt-1" value={stockData.rate} onChange={e => setStockData({...stockData, rate: e.target.value})} />
              </div>
              <button onClick={handleAddStock} className="bg-teal-700 text-white font-bold py-2 rounded hover:bg-teal-800">Save Stock Batch</button>
            </div>
          )}

          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap min-w-[500px]">
                <thead className="bg-slate-100/50 border-b border-slate-200/60">
                  <tr>
                    <th className="p-4 font-bold text-gray-600">Medicine</th>
                    <th className="p-4 font-bold text-gray-600">Generic</th>
                    <th className="p-4 font-bold text-gray-600">Reorder Level</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map(m => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-800">{m.name}</td>
                      <td className="p-4 text-sm text-gray-600">{m.generic_name}</td>
                      <td className="p-4 text-sm text-red-600 font-bold">{m.reorder_level} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPharmacy;
