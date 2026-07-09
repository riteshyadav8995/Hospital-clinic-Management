import { useEffect, useState } from "react";
import api from "../utils/api";
import { Plus, X } from "lucide-react";

function AdminWards() {
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showWardModal, setShowWardModal] = useState(false);
  const [showBedModal, setShowBedModal] = useState(false);

  // Forms
  const [wardForm, setWardForm] = useState({ name: "", type: "", capacity: "" });
  const [bedForm, setBedForm] = useState({ ward_id: "", bed_number: "", status: "Available" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const resWards = await api.get("/wards");
      setWards(resWards.data);
      const resBeds = await api.get("/beds");
      setBeds(resBeds.data);
    } catch (error) {
      console.error("Failed to fetch wards/beds", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddWard = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/wards", wardForm);
      setShowWardModal(false);
      setWardForm({ name: "", type: "", capacity: "" });
      fetchData();
    } catch (err) {
      alert("Failed to add ward");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBed = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/beds", bedForm);
      setShowBedModal(false);
      setBedForm({ ward_id: "", bed_number: "", status: "Available" });
      fetchData();
    } catch (err) {
      alert("Failed to add bed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col min-w-0 bg-gray-50 p-4 md:p-8">
      <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 capitalize">Wards & Beds</h1>
          <p className="text-sm text-gray-500 mt-1">Manage hospital wards and bed statuses.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowWardModal(true)} className="bg-slate-800 text-white font-bold px-4 py-2 rounded-xl hover:bg-slate-900 transition flex items-center gap-2 shadow-sm">
            <Plus size={18} /> Add Ward
          </button>
          <button onClick={() => setShowBedModal(true)} className="bg-teal-700 text-white font-bold px-4 py-2 rounded-xl hover:bg-teal-800 transition flex items-center gap-2 shadow-sm">
            <Plus size={18} /> Add Bed
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-10 w-10 border-4 border-teal-650 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white border rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Wards</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {wards.map((ward) => (
                <div key={ward.id} className="border p-4 rounded-xl">
                  <h3 className="font-bold text-lg">{ward.name}</h3>
                  <p className="text-gray-600">{ward.type}</p>
                  <p className="text-sm font-semibold mt-2">Capacity: {ward.capacity}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Beds</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 font-bold border-b">
                  <tr>
                    <th className="px-6 py-4">Bed Number</th>
                    <th className="px-6 py-4">Ward</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {beds.map((bed) => (
                    <tr key={bed.id}>
                      <td className="px-6 py-4 font-bold">{bed.bed_number}</td>
                      <td className="px-6 py-4">{bed.ward_name} ({bed.ward_type})</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          bed.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {bed.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Ward Modal */}
      {showWardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-[95vw] md:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg">Add New Ward</h2>
              <button onClick={() => setShowWardModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddWard} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ward Name</label>
                <input required type="text" value={wardForm.name} onChange={e => setWardForm({...wardForm, name: e.target.value})} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20" placeholder="e.g. General Ward A" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ward Type</label>
                <select required value={wardForm.type} onChange={e => setWardForm({...wardForm, type: e.target.value})} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20">
                  <option value="">Select Type</option>
                  <option value="General">General</option>
                  <option value="ICU">ICU</option>
                  <option value="Maternity">Maternity</option>
                  <option value="Pediatric">Pediatric</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Capacity</label>
                <input required type="number" value={wardForm.capacity} onChange={e => setWardForm({...wardForm, capacity: e.target.value})} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20" placeholder="e.g. 20" />
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-teal-700 text-white font-bold py-3 rounded-xl hover:bg-teal-800 transition">Add Ward</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Bed Modal */}
      {showBedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-[95vw] md:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg">Add New Bed</h2>
              <button onClick={() => setShowBedModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddBed} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Select Ward</label>
                <select required value={bedForm.ward_id} onChange={e => setBedForm({...bedForm, ward_id: e.target.value})} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20">
                  <option value="">Select Ward</option>
                  {wards.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Bed Number</label>
                <input required type="text" value={bedForm.bed_number} onChange={e => setBedForm({...bedForm, bed_number: e.target.value})} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20" placeholder="e.g. 101-A" />
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-teal-700 text-white font-bold py-3 rounded-xl hover:bg-teal-800 transition">Add Bed</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminWards;
