import { useEffect, useState } from "react";
import api from "../utils/api";
import { Users, Stethoscope, Save, Plus, X, FlaskConical } from "lucide-react";

function DoctorQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [activeTab, setActiveTab] = useState("today");
  const [viewingLabsFor, setViewingLabsFor] = useState(null);
  const [patientLabs, setPatientLabs] = useState([]);

  // Consultation Form State
  const [vitals, setVitals] = useState({ BP: "", pulse: "", temp: "", weight: "" });
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [followUp, setFollowUp] = useState("");
  
  const [prescriptions, setPrescriptions] = useState([{ medicine_name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  const [labOrders, setLabOrders] = useState([]);

  // Mock Lab Tests (In a real app, this would come from a /master/labs API)
  const availableLabTests = [
    "Complete Blood Count (CBC)",
    "Lipid Profile",
    "Thyroid Panel (T3, T4, TSH)",
    "Blood Sugar (Fasting)",
    "Urine Routine",
    "X-Ray Chest"
  ];

  const fetchQueue = async () => {
    try {
      const res = await api.get("/appointments/doctor-queue");
      setQueue(res.data.queue || []);
    } catch (err) {
      console.error("Failed to fetch doctor queue", err);
    } finally {
      setLoading(false);
    }
  };

  const openLabsModal = async (appt) => {
    setViewingLabsFor(appt);
    try {
      const res = await api.get(`/clinical/patients/${appt.patient_id}/labs`);
      setPatientLabs(res.data.labs || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load lab reports.");
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const handlePrescriptionChange = (index, field, value) => {
    const newPrescriptions = [...prescriptions];
    newPrescriptions[index][field] = value;
    setPrescriptions(newPrescriptions);
  };

  const addPrescriptionRow = () => {
    setPrescriptions([...prescriptions, { medicine_name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  };

  const removePrescriptionRow = (index) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const toggleLabTest = (test) => {
    if (labOrders.includes(test)) {
      setLabOrders(labOrders.filter(t => t !== test));
    } else {
      setLabOrders([...labOrders, test]);
    }
  };

  const submitConsultation = async () => {
    if (!diagnosis) {
      alert("Diagnosis is required.");
      return;
    }

    try {
      // Filter out empty prescription rows
      const validPrescriptions = prescriptions.filter(p => p.medicine_name && p.dosage);

      const payload = {
        appointment_id: activeConsultation.id,
        vitals,
        symptoms,
        diagnosis,
        notes,
        follow_up: followUp,
        prescriptions: validPrescriptions,
        lab_orders: labOrders
      };

      await api.post("/clinical/consultations", payload);
      alert("Consultation submitted successfully!");
      setActiveConsultation(null);
      fetchQueue(); // refresh queue
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to submit consultation.");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading your queue...</div>;

  // Render Consultation Workspace
  if (activeConsultation) {
    return (
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center glass-panel p-6 animate-slide-in">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <Stethoscope className="text-teal-600" /> Clinical Workspace
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Consulting Patient: <strong className="text-slate-800">{activeConsultation.patient_name}</strong> <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs ml-1 border border-slate-200">ID: {activeConsultation.patient_code}</span></p>
          </div>
          <button onClick={() => setActiveConsultation(null)} className="px-5 py-2.5 bg-slate-100/80 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm shadow-sm hover:shadow">
            Cancel & Return
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* LEFT COLUMN: Vitals & Notes */}
          <div className="space-y-6">
            <div className="glass-panel p-6">
              <h3 className="font-bold text-slate-800 border-b border-slate-200/60 pb-3 mb-5">Clinical Details</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Blood Pressure</label>
                  <input type="text" className="w-full mt-1 border px-3 py-2 rounded-lg text-sm" placeholder="120/80" value={vitals.BP} onChange={e => setVitals({...vitals, BP: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Pulse</label>
                  <input type="text" className="w-full mt-1 border px-3 py-2 rounded-lg text-sm" placeholder="72 bpm" value={vitals.pulse} onChange={e => setVitals({...vitals, pulse: e.target.value})} />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase">Symptoms</label>
                <textarea className="w-full mt-1 border px-3 py-2 rounded-lg text-sm" rows="2" placeholder="Patient complaints..." value={symptoms} onChange={e => setSymptoms(e.target.value)}></textarea>
              </div>
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase">Diagnosis (Required)</label>
                <input type="text" className="w-full mt-1 border px-3 py-2 rounded-lg text-sm font-bold" placeholder="Primary Diagnosis" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
              </div>
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase">Clinical Notes</label>
                <textarea className="w-full mt-1 border px-3 py-2 rounded-lg text-sm" rows="3" placeholder="Additional observations..." value={notes} onChange={e => setNotes(e.target.value)}></textarea>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Follow Up Date</label>
                <input type="date" className="w-full mt-1 border px-3 py-2 rounded-lg text-sm" value={followUp} onChange={e => setFollowUp(e.target.value)} />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Rx & Labs */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h3 className="font-bold text-gray-800">Prescriptions (Rx)</h3>
                <button onClick={addPrescriptionRow} className="text-teal-700 hover:text-teal-900 flex items-center gap-1 text-xs font-bold bg-teal-50 px-2 py-1 rounded">
                  <Plus size={14} /> Add Medicine
                </button>
              </div>
              
              <div className="space-y-3">
                {prescriptions.map((p, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-xl border relative">
                    {prescriptions.length > 1 && (
                      <button onClick={() => removePrescriptionRow(idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                        <X size={16} />
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-2 mb-2 pr-6">
                      <input type="text" placeholder="Medicine Name" className="w-full border px-2 py-1.5 rounded text-sm font-bold" value={p.medicine_name} onChange={e => handlePrescriptionChange(idx, 'medicine_name', e.target.value)} />
                      <input type="text" placeholder="Dosage (e.g. 500mg)" className="w-full border px-2 py-1.5 rounded text-sm" value={p.dosage} onChange={e => handlePrescriptionChange(idx, 'dosage', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input type="text" placeholder="Frequency (e.g. 1-0-1)" className="w-full border px-2 py-1.5 rounded text-sm" value={p.frequency} onChange={e => handlePrescriptionChange(idx, 'frequency', e.target.value)} />
                      <input type="text" placeholder="Duration (e.g. 5 days)" className="w-full border px-2 py-1.5 rounded text-sm" value={p.duration} onChange={e => handlePrescriptionChange(idx, 'duration', e.target.value)} />
                    </div>
                    <input type="text" placeholder="Specific Instructions (e.g. After Meals)" className="w-full border px-2 py-1.5 rounded text-sm bg-yellow-50" value={p.instructions} onChange={e => handlePrescriptionChange(idx, 'instructions', e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">Order Lab Tests</h3>
              <div className="grid grid-cols-2 gap-2">
                {availableLabTests.map(test => (
                  <label key={test} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg border cursor-pointer hover:bg-gray-100 transition">
                    <input type="checkbox" checked={labOrders.includes(test)} onChange={() => toggleLabTest(test)} className="rounded text-teal-600 focus:ring-teal-500" />
                    {test}
                  </label>
                ))}
              </div>
            </div>

            <button onClick={submitConsultation} className="w-full bg-teal-700 text-white font-bold py-3 rounded-full hover:bg-teal-800 transition shadow-md flex justify-center items-center gap-2">
              <Save size={18} /> Finalize Consultation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter logic
  const todayStr = new Date().toLocaleDateString("en-CA");
  const todayAppts = queue.filter(a => {
    if (!a.date) return false;
    return new Date(a.date).toLocaleDateString("en-CA") === todayStr;
  });
  const upcomingAppts = queue.filter(a => {
    if (!a.date) return false;
    return new Date(a.date).toLocaleDateString("en-CA") > todayStr;
  });
  const historyAppts = queue.filter(a => {
    if (!a.date) return false;
    return new Date(a.date).toLocaleDateString("en-CA") < todayStr;
  });

  const currentViewAppts = activeTab === "today" ? todayAppts : activeTab === "upcoming" ? upcomingAppts : historyAppts;

  // Render Queue List
  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-teal-600" /> My Assigned Patients
          </h1>
          <p className="text-gray-500">View and consult with your queue</p>
        </div>
      </div>

      <div className="flex gap-6 mb-6 border-b">
        <button onClick={() => setActiveTab("today")} className={`pb-2 font-bold transition-colors ${activeTab === "today" ? "text-teal-700 border-b-2 border-teal-700" : "text-gray-500 hover:text-gray-800"}`}>
          Today ({todayAppts.length})
        </button>
        <button onClick={() => setActiveTab("upcoming")} className={`pb-2 font-bold transition-colors ${activeTab === "upcoming" ? "text-teal-700 border-b-2 border-teal-700" : "text-gray-500 hover:text-gray-800"}`}>
          Upcoming ({upcomingAppts.length})
        </button>
        <button onClick={() => setActiveTab("history")} className={`pb-2 font-bold transition-colors ${activeTab === "history" ? "text-teal-700 border-b-2 border-teal-700" : "text-gray-500 hover:text-gray-800"}`}>
          History ({historyAppts.length})
        </button>
      </div>

      <div className="grid gap-4">
        {currentViewAppts.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed">
            <p className="text-gray-500 italic">No patients in this view right now.</p>
          </div>
        ) : (
          currentViewAppts.map(appt => (
            <div key={appt.id} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border shadow-sm">
              <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                <div className="bg-black text-white text-xl font-mono font-bold px-4 py-2 rounded-xl">
                  {appt.token_no}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{appt.patient_name} <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 rounded">ID: {appt.patient_code}</span></h3>
                  <p className="text-sm text-gray-600 flex items-center gap-3 mt-1">
                    <span className="font-semibold text-teal-700">{new Date(appt.date).toLocaleDateString()} at {appt.time}</span>
                    <span>|</span>
                    <span>{appt.gender || 'N/A'} | {appt.blood_group || 'N/A'}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-slate-100 md:border-0">
                <span className={`px-3 py-1 rounded-full text-sm font-bold border w-max ${appt.status === "In-Consultation" ? "bg-purple-100 text-purple-800 border-purple-200" : appt.status === "Waiting" ? "bg-yellow-100 text-yellow-800 border-yellow-200" : "bg-gray-100"}`}>
                  {appt.status}
                </span>

                <button onClick={() => openLabsModal(appt)} className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition">
                  <FlaskConical size={16} /> Labs
                </button>

                {appt.status !== "Completed" && (
                  <button onClick={() => setActiveConsultation(appt)} className="px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition">
                    <Stethoscope size={16} /> Consult
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* LABS MODAL */}
      {viewingLabsFor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-[95vw] md:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-2"><FlaskConical size={20} className="text-teal-400" /> Lab Reports - {viewingLabsFor.patient_name}</h2>
              <button onClick={() => setViewingLabsFor(null)} className="text-gray-400 hover:text-white transition"><X size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 bg-slate-50 flex-1">
              {patientLabs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No lab reports found for this patient.</div>
              ) : (
                patientLabs.map(lab => (
                  <div key={lab.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between md:items-center">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{lab.test_name}</h3>
                      <p className="text-sm text-gray-500">Ordered: {new Date(lab.created_at).toLocaleDateString()}</p>
                    </div>
                    {lab.status === "Report Ready" ? (
                      <div className="bg-teal-50 px-4 py-2 rounded-xl text-right border border-teal-100 min-w-[150px]">
                        <span className="text-xs font-bold text-teal-700 uppercase block mb-1">Result</span>
                        <span className="text-lg font-black text-gray-900">{lab.result_value}</span>
                        <span className="text-xs text-gray-500 block mt-1">Normal: {lab.normal_range}</span>
                      </div>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 shrink-0">
                        {lab.status}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorQueue;
