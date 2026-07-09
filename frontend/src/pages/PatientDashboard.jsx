import { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  User,
  Lock,
  LogOut,
  CreditCard,
  CheckCircle,
  Clock,
  X,
  LockKeyhole,
  Info,
  CalendarDays,
  Smartphone,
  Mail,
  UserCheck,
  CheckCircle2,
  FlaskConical
} from "lucide-react";

function PatientDashboard() {
  const navigate = useNavigate();

  // Authentication session
  const token = localStorage.getItem("patientToken");
  const localUser = localStorage.getItem("patientUser") ? JSON.parse(localStorage.getItem("patientUser")) : null;

  // Active navigation tab
  const [activeTab, setActiveTab] = useState("appointments");

  // Data states
  const [appointments, setAppointments] = useState([]);
  const [userData, setUserData] = useState(localUser);
  const [labs, setLabs] = useState([]);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: localUser?.name || "",
    email: localUser?.email || "",
    phone: localUser?.phone || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // UI state variables
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const getHeaders = () => {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchDashboardData = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      // Fetch profile details
      const profileRes = await api.get("/users/profile");
      setUserData(profileRes.data.user);
      setProfileForm({
        name: profileRes.data.user.name,
        email: profileRes.data.user.email,
        phone: profileRes.data.user.phone,
      });

      // Fetch appointments history
      const apptsRes = await api.get("/users/appointments");
      setAppointments(apptsRes.data.appointments);

      // Fetch lab reports
      const labsRes = await api.get("/users/labs");
      setLabs(labsRes.data.labs || []);

    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        handleLogout();
        alert("Session expired. Please log in again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("patientToken");
    localStorage.removeItem("patientUser");
    window.dispatchEvent(new Event("storage"));
    navigate("/login");
  };

  // ================= PROFILE UPDATES =================
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await api.put("/users/profile", profileForm);
      setUserData(res.data.user);
      localStorage.setItem("patientUser", JSON.stringify(res.data.user));
      window.dispatchEvent(new Event("storage"));
      setSuccessMsg("Profile updated successfully!");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update profile.");
    }
  };

  // ================= PASSWORD UPDATE =================
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    try {
      await api.put("/users/password", {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordSuccess("Password updated successfully!");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Failed to change password.");
    }
  };

  // ================= RE-TRIGGER UNPAID CHECKOUT =================
  const handlePayAppointment = async (appt) => {
    setLoading(true);
    try {
      // 1. Create order
      const orderRes = await api.post("/payments/order", {
        appointmentId: appt.id
      });
      const orderData = orderRes.data;

      // 2. Check Mock Mode
      if (orderData.isMockMode) {
        const confirmPayment = window.confirm(
          `[DEVELOPER MODE]: Razorpay API keys not configured in backend .env.\n\nClick OK to simulate a SUCCESSFUL payment of ₹500.\nClick Cancel to simulate a CANCELLED payment.`
        );

        if (confirmPayment) {
          await api.post("/payments/verify", {
            appointmentId: appt.id,
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: "mock_sig",
            isMockPayment: true,
          });

          alert("Payment verified successfully!");
          fetchDashboardData();
        } else {
          alert("Payment cancelled.");
        }
        setLoading(false);
        return;
      }

      // 3. Real Checkout
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay Checkout failed to load. Please verify connection.");
        setLoading(false);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Ayurda Hospital and Clinics",
        description: `Consultation Fee - ${appt.department}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            setLoading(true);
            await api.post("/payments/verify", {
              appointmentId: appt.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              isMockPayment: false,
            });
            alert("Payment completed successfully!");
            fetchDashboardData();
          } catch (err) {
            console.error(err);
            alert("Signature verification failed.");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: userData.name,
          contact: userData.phone,
          email: userData.email,
        },
        theme: {
          color: "#0f766e",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      alert("Failed to initiate payment gateway order.");
      setLoading(false);
    }
  };

  // Split appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAppts = appointments.filter((appt) => {
    if (!appt.preferred_date) return false;
    const apptDate = new Date(appt.preferred_date);
    return apptDate >= today;
  }).sort((a, b) => new Date(a.preferred_date) - new Date(b.preferred_date));

  const pastAppts = appointments.filter((appt) => {
    if (!appt.preferred_date) return true;
    const apptDate = new Date(appt.preferred_date);
    return apptDate < today;
  }).sort((a, b) => new Date(b.preferred_date) - new Date(a.preferred_date));

  const getStatusClass = (status) => {
    if (status === "Booked") return "bg-blue-50 text-blue-750 border-blue-150";
    if (status === "Confirmed") return "bg-green-50 text-green-755 border-green-200";
    if (status === "Waiting") return "bg-yellow-50 text-yellow-750 border-yellow-200";
    if (status === "In-Consultation") return "bg-purple-50 text-purple-750 border-purple-200";
    if (status === "Completed") return "bg-gray-100 text-gray-700 border-gray-250";
    return "bg-gray-50 text-gray-500 border-gray-150";
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-5">
      <div className="mx-auto max-w-6xl animate-fade-in">
        
        {/* HEADER PROFILE OVERVIEW */}
        <div className="glass-panel p-6 md:p-8 flex flex-col justify-between md:flex-row gap-6 items-center animate-slide-up">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center text-3xl font-black shadow-md border-4 border-white">
              {userData?.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Welcome, {userData?.name}</h1>
              <p className="text-sm text-slate-500 mt-2 flex flex-wrap items-center gap-3 font-medium">
                <span className="flex items-center gap-1 font-mono bg-slate-100 px-2.5 py-1 rounded-md text-slate-600 font-bold border border-slate-200">{userData?.patient_code || "PAT-XXXX"}</span>
                <span className="flex items-center gap-1"><Mail size={16} /> {userData?.email}</span>
                <span className="flex items-center gap-1"><Smartphone size={16} /> {userData?.phone}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/book-appointment")}
              className="flex items-center gap-2 rounded-xl bg-teal-700 text-white shadow-[0_0_15px_rgba(15,118,110,0.6)] hover:bg-teal-800 hover:shadow-[0_0_25px_rgba(15,118,110,0.8)] px-6 py-3 font-bold text-sm transition-all hover:-translate-y-0.5 animate-pulse"
            >
              <CalendarDays size={18} /> Book Appointment
            </button>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mt-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="glass-panel p-6 flex items-center justify-between group hover:-translate-y-1 transition-all hover:shadow-lg border-l-4 border-l-teal-500">
            <div>
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1 block">Upcoming Consults</span>
              <h3 className="text-4xl font-extrabold text-teal-700">{upcomingAppts.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
              <Calendar size={24} />
            </div>
          </div>
          <div className="glass-panel p-6 flex items-center justify-between group hover:-translate-y-1 transition-all hover:shadow-lg border-l-4 border-l-slate-400">
            <div>
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1 block">Total Bookings</span>
              <h3 className="text-4xl font-extrabold text-slate-700">{appointments.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <CalendarDays size={24} />
            </div>
          </div>
          <div className="glass-panel p-6 flex items-center justify-between group hover:-translate-y-1 transition-all hover:shadow-lg border-l-4 border-l-green-500">
            <div>
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1 block">Paid Consultations</span>
              <h3 className="text-4xl font-extrabold text-green-600">
                {appointments.filter(a => a.payment_status === "Paid").length}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <CreditCard size={24} />
            </div>
          </div>
        </div>

        {/* MAIN BODY NAVIGATION PANEL */}
        <div className="grid gap-6 md:grid-cols-4 mt-8">
          
          {/* NAVIGATION */}
          <div className="md:col-span-1 space-y-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={() => setActiveTab("appointments")}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-sm shadow-sm ${
                activeTab === "appointments"
                  ? "bg-gradient-to-r from-teal-600 to-teal-800 text-white translate-x-2"
                  : "bg-white/80 backdrop-blur-md text-slate-600 border border-slate-200 hover:bg-white hover:text-teal-700"
              }`}
            >
              <Calendar size={18} /> Bookings History
            </button>
            <button
              onClick={() => setActiveTab("labs")}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-sm shadow-sm ${
                activeTab === "labs"
                  ? "bg-gradient-to-r from-teal-600 to-teal-800 text-white translate-x-2"
                  : "bg-white/80 backdrop-blur-md text-slate-600 border border-slate-200 hover:bg-white hover:text-teal-700"
              }`}
            >
              <FlaskConical size={18} /> Lab Reports
            </button>
          </div>

          {/* MAIN FORM/TAB CONTENT */}
          <div className="md:col-span-3">
            
            {/* TAB 1: APPOINTMENTS HISTORY */}
            {activeTab === "appointments" && (
              <div className="space-y-6">
                
                {/* SECTION A: UPCOMING */}
                <div className="glass-panel p-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                  <h3 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3 mb-6 pb-4 border-b border-slate-200/60 tracking-tight">
                    <CalendarDays className="text-teal-600" size={24} /> Upcoming Appointments
                  </h3>
                  
                  {loading ? (
                    <div className="py-12 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div></div>
                  ) : upcomingAppts.length === 0 ? (
                    <p className="text-slate-500 font-medium py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No upcoming appointments booked. Need consultation? Submit a request on Contact page.</p>
                  ) : (
                    <div className="space-y-5">
                      {upcomingAppts.map((appt) => (
                        <div key={appt.id} className="p-6 bg-white rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-0.5">
                          <div>
                            <div className="flex gap-3 items-center">
                              <h4 className="font-extrabold text-slate-900 text-lg tracking-tight">{appt.department}</h4>
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm ${getStatusClass(appt.status)}`}>
                                {appt.status}
                              </span>
                              {appt.token_no && (
                                <span className="bg-slate-900 text-white text-xs font-mono font-bold px-3 py-1 rounded-md shadow-sm border border-slate-700">
                                  {appt.token_no}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mt-2 font-semibold flex items-center gap-2">
                              <span className="bg-slate-100 px-2 py-1 rounded-md">Dr. {appt.doctor_name}</span> 
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500">{new Date(appt.date || appt.preferred_date).toLocaleDateString()} at {appt.time || appt.preferred_time || "Not selected"}</span>
                            </p>
                            {appt.message && <p className="text-sm text-slate-600 mt-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 italic">“{appt.message}”</p>}
                          </div>

                          <div className="flex flex-col md:items-end gap-3 shrink-0 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex px-3 py-1 rounded-md text-xs font-bold border shadow-sm ${
                                appt.payment_status === "Paid" ? "bg-green-50 text-green-700 border-green-200" : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}>
                                {appt.payment_status || "Unpaid"}
                              </span>
                              {appt.consultation_fee > 0 && <span className="text-sm font-extrabold text-slate-800">₹{appt.consultation_fee}</span>}
                            </div>
                            
                            {appt.payment_status !== "Paid" && (
                              <button
                                onClick={() => handlePayAppointment(appt)}
                                className="premium-btn px-6 py-2.5 flex items-center justify-center gap-2 w-full mt-1"
                              >
                                <CreditCard size={16} /> Pay Fee Now
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SECTION B: PAST HISTORY */}
                <div className="glass-panel p-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                  <h3 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3 mb-6 pb-4 border-b border-slate-200/60 tracking-tight">
                    <CheckCircle className="text-teal-600" size={24} /> Past Consultations History
                  </h3>
                  
                  {loading ? (
                    <div className="py-12 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div></div>
                  ) : pastAppts.length === 0 ? (
                    <p className="text-slate-500 font-medium py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No past consultations recorded.</p>
                  ) : (
                    <div className="space-y-5">
                      {pastAppts.map((appt) => (
                        <div key={appt.id} className="p-6 bg-white/50 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border border-slate-200 hover:bg-white hover:shadow-sm transition-all">
                          <div>
                            <div className="flex gap-3 items-center">
                              <h4 className="font-extrabold text-slate-800 text-lg tracking-tight">{appt.department}</h4>
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm ${getStatusClass(appt.status)}`}>
                                {appt.status}
                              </span>
                              {appt.token_no && (
                                <span className="bg-slate-900 text-white text-xs font-mono font-bold px-3 py-1 rounded-md shadow-sm border border-slate-700">
                                  {appt.token_no}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-2 font-medium flex items-center gap-2">
                              <span>Dr. {appt.doctor_name}</span> 
                              <span className="text-slate-300">•</span>
                              <span>{new Date(appt.date || appt.preferred_date).toLocaleDateString()} at {appt.time || appt.preferred_time || "Not selected"}</span>
                            </p>
                          </div>

                          <div className="flex flex-col md:items-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                            <span className={`inline-flex px-3 py-1 rounded-md text-xs font-bold border shadow-sm ${
                              appt.payment_status === "Paid" ? "bg-green-50 text-green-700 border-green-200" : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              {appt.payment_status || "Unpaid"}
                            </span>
                            {appt.razorpay_payment_id && (
                              <span className="text-xs text-slate-400 font-mono mt-1">ID: {appt.razorpay_payment_id}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ================= LABS TAB ================= */}
            {activeTab === "labs" && (
              <div className="glass-panel p-6 md:p-8 animate-slide-up h-full border border-slate-200">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200">
                  <div className="h-10 w-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700">
                    <FlaskConical size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Lab Reports</h2>
                    <p className="text-sm text-slate-500 font-medium">View tests ordered during consultations</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {labs.length === 0 ? (
                    <div className="text-center py-12 px-6 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                      <p className="text-slate-500 font-medium">No lab tests ordered yet.</p>
                    </div>
                  ) : (
                    labs.map(lab => (
                      <div key={lab.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4 transition-all hover:shadow-md hover:border-teal-100 group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500"></div>
                        <div className="flex-1 pl-2">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-slate-900">{lab.test_name}</h3>
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${lab.status === "Report Ready" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {lab.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1 font-medium">
                            Ordered by Dr. {lab.doctor_name} | {new Date(lab.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        {lab.status === "Report Ready" ? (
                          <div className="bg-slate-50 px-5 py-3 rounded-xl border border-slate-150 text-right shrink-0 min-w-[200px]">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Result Value</span>
                            <span className="text-lg font-black text-slate-800">{lab.result_value}</span>
                            <span className="text-xs text-slate-500 block mt-1 mb-2">Normal: {lab.normal_range}</span>
                            
                            <button onClick={() => navigate("/lab-report-print", { state: { lab } })} className="bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg w-full flex justify-center items-center gap-1 hover:bg-teal-800 transition">
                              View PDF Report
                            </button>
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-slate-400 italic">Processing...</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;
