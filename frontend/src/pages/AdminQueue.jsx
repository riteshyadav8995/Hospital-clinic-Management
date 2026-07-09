import { useEffect, useState } from "react";
import api from "../utils/api";
import { Users, Clock, CheckCircle } from "lucide-react";

function AdminQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const res = await api.get("/appointments/queue");
      setQueue(res.data.queue || []);
    } catch (err) {
      console.error("Failed to fetch queue", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: newStatus });
      fetchQueue();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Waiting": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "In-Consultation": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Completed": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) return <div className="p-8 text-center">Loading queue...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-teal-600" /> Today's Live Queue
          </h1>
          <p className="text-gray-500">Manage patient walk-ins and active consultations</p>
        </div>
      </div>

      <div className="grid gap-4">
        {queue.length === 0 ? (
          <div className="p-16 text-center glass-panel">
            <p className="text-slate-500 text-lg font-medium">No patients in the queue for today.</p>
          </div>
        ) : (
          queue.map((appt, i) => (
            <div key={appt.id} className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:-translate-y-0.5 transition-all hover:shadow-lg animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                <div className="bg-slate-900 text-white text-2xl font-mono font-bold px-5 py-3 rounded-xl shadow-sm border border-slate-700">
                  {appt.token_no}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{appt.patient_name} <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md ml-2 border border-slate-200">ID: {appt.patient_code}</span></h3>
                  <p className="text-sm text-slate-600 font-medium flex items-center gap-2 mt-1.5">
                    Dr. {appt.doctor_name} <span className="text-slate-400">({appt.department_name})</span>
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-slate-100 md:border-0">
                <span className={`px-3 py-1 rounded-full text-sm font-bold border w-max ${getStatusColor(appt.status)}`}>
                  {appt.status}
                </span>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {appt.status !== "In-Consultation" && appt.status !== "Completed" && (
                    <button onClick={() => updateStatus(appt.id, "Waiting")} className="p-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg border border-yellow-200" title="Set Waiting">
                      <Clock size={18} />
                    </button>
                  )}
                  {appt.status !== "Completed" && (
                    <button onClick={() => updateStatus(appt.id, "In-Consultation")} className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg border border-purple-200 text-sm font-bold" title="Send to Doctor">
                      Call Patient
                    </button>
                  )}
                  {appt.status === "In-Consultation" && (
                    <button onClick={() => updateStatus(appt.id, "Completed")} className="p-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg border border-green-200" title="Mark Completed">
                      <CheckCircle size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminQueue;
