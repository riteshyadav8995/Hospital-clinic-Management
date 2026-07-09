import { useEffect, useState } from "react";
import api from "../utils/api";
import { Plus, X } from "lucide-react";

function AdminAdmissions() {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [beds, setBeds] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    patient_id: "",
    patient_name: "",
    phone: "",
    doctor_id: "",
    bed_id: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const [admRes, usersRes, docRes, bedsRes] = await Promise.all([
        api.get("/admissions"),
        api.get("/admin/patients").catch((e) => { console.error("Patients fetch error:", e); return { data: [] }; }),
        api.get("/doctors").catch((e) => { console.error("Doctors fetch error:", e); return { data: [] }; }),
        api.get("/beds").catch((e) => { console.error("Beds fetch error:", e); return { data: [] }; })
      ]);
      setAdmissions(admRes.data);
      setPatients(usersRes.data || []);
      setDoctors(docRes.data || []);
      setBeds(bedsRes.data || []);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const handlePatientSelect = (e) => {
    const pId = e.target.value;
    if (pId) {
      const selectedPatient = patients.find(p => p.id.toString() === pId);
      if (selectedPatient) {
        setFormData({ ...formData, patient_id: pId, patient_name: selectedPatient.name, phone: selectedPatient.phone || "N/A" });
        return;
      }
    }
    setFormData({ ...formData, patient_id: "", patient_name: "", phone: "" });
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_name || !formData.phone || !formData.bed_id) {
      alert("Please fill required fields (Name, Phone, Bed).");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/admissions", formData);
      setShowModal(false);
      setFormData({ patient_id: "", patient_name: "", phone: "", doctor_id: "", bed_id: "", notes: "" });
      fetchAdmissions();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to admit patient");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischarge = async (id) => {
    if (!window.confirm("Are you sure you want to discharge this patient?")) return;
    try {
      await api.put(`/admissions/${id}/discharge`);
      fetchAdmissions();
    } catch (error) {
      console.error("Failed to discharge", error);
      alert("Failed to discharge");
    }
  };

  return (
    <div className="flex-grow flex flex-col min-w-0 bg-gray-50 p-4 md:p-8">
      <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 capitalize tracking-tight">Admissions</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage hospital admissions and patient discharges.</p>
        </div>
        <button onClick={() => { fetchAdmissions(); setShowModal(true); }} className="bg-teal-700 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-teal-800 transition flex items-center justify-center gap-2 shadow-sm w-full md:w-auto">
          <Plus size={18} /> Admit New Patient
        </button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-10 w-10 border-4 border-teal-650 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-100/50 font-bold border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Bed</th>
                  <th className="px-6 py-4">Admission Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {admissions.map((adm) => (
                  <tr key={adm.id}>
                    <td className="px-6 py-4 font-bold">{adm.patient_name}</td>
                    <td className="px-6 py-4">{adm.phone}</td>
                    <td className="px-6 py-4">{adm.ward_name} - Bed {adm.bed_number}</td>
                    <td className="px-6 py-4">{new Date(adm.admission_date).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                        adm.status === 'Active' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                        {adm.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {adm.status === 'Active' && (
                        <button
                          onClick={() => handleDischarge(adm.id)}
                          className="premium-btn !from-rose-500 !to-rose-700 px-4 py-1.5 text-xs tracking-wide"
                        >
                          Discharge
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

      {/* Admit Patient Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-800">Admit New Patient</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 transition">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAdmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Link Registered Patient (Optional)</label>
                  <select 
                    className="w-full border-slate-200 border px-4 py-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                    value={formData.patient_id}
                    onChange={handlePatientSelect}
                  >
                    <option value="">-- Manual Entry (Guest) --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.patient_code || p.phone})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Patient Name *</label>
                  <input type="text" required value={formData.patient_name} onChange={e => setFormData({...formData, patient_name: e.target.value})} className="w-full border-slate-200 border px-4 py-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all outline-none" placeholder="Full Name" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Phone Number *</label>
                  <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border-slate-200 border px-4 py-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all outline-none" placeholder="10-digit number" />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Assign Bed *</label>
                  <select required value={formData.bed_id} onChange={e => setFormData({...formData, bed_id: e.target.value})} className="w-full border-slate-200 border px-4 py-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all outline-none">
                    <option value="">Select Available Bed</option>
                    {beds.filter(b => b.status === "Available").map(b => (
                      <option key={b.id} value={b.id}>{b.ward_name} ({b.ward_type}) - Bed {b.bed_number}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Overseeing Doctor</label>
                  <select value={formData.doctor_id} onChange={e => setFormData({...formData, doctor_id: e.target.value})} className="w-full border-slate-200 border px-4 py-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all outline-none">
                    <option value="">No Doctor Assigned</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.name} ({d.department_name || d.department || "General"})</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Clinical Notes / Reason for Admission</label>
                  <textarea rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border-slate-200 border px-4 py-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all outline-none" placeholder="Initial observations or diagnosis..."></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-teal-700 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-teal-800 transition shadow-md disabled:opacity-70">
                  {submitting ? "Admitting..." : "Admit Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAdmissions;
