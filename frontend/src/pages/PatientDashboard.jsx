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
  FlaskConical,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  History
} from "lucide-react";

function PatientDashboard() {
  const navigate = useNavigate();

  // Authentication session
  const token = localStorage.getItem("patientToken");
  const localUser = localStorage.getItem("patientUser") ? JSON.parse(localStorage.getItem("patientUser")) : null;

  // Active navigation tab
  const [activeTab, setActiveTab] = useState("appointments");
  const [bookingFilter, setBookingFilter] = useState("upcoming");
  const [isBookingsExpanded, setIsBookingsExpanded] = useState(true);

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

  // Helper to parse exact date and time
  const parseAppointmentDateTime = (dateStr, timeStr) => {
    if (!dateStr) return new Date(0);
    const dateObj = new Date(dateStr);
    
    if (timeStr) {
      // Extract start time e.g., "04:00 PM - 04:30 PM" -> "04:00 PM"
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const mins = parseInt(timeMatch[2], 10);
        const modifier = timeMatch[3].toUpperCase();

        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        dateObj.setHours(hours, mins, 0, 0);
      }
    }
    return dateObj;
  };

  const now = new Date();

  const getApptDate = (appt) => appt.date || appt.preferred_date;
  const getApptTime = (appt) => appt.time || appt.preferred_time;

  const upcomingAppts = appointments.filter((appt) => {
    const d = getApptDate(appt);
    if (!d) return false;
    const apptDateTime = parseAppointmentDateTime(d, getApptTime(appt));
    return apptDateTime >= now;
  }).sort((a, b) => parseAppointmentDateTime(getApptDate(a), getApptTime(a)) - parseAppointmentDateTime(getApptDate(b), getApptTime(b)));

  const pastAppts = appointments.filter((appt) => {
    const d = getApptDate(appt);
    if (!d) return true;
    const apptDateTime = parseAppointmentDateTime(d, getApptTime(appt));
    return apptDateTime < now;
  }).sort((a, b) => parseAppointmentDateTime(getApptDate(b), getApptTime(b)) - parseAppointmentDateTime(getApptDate(a), getApptTime(a)));

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
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left w-full md:w-auto">
            <div className="shrink-0 h-20 w-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center text-3xl font-black shadow-md border-4 border-white">
              {userData?.name.charAt(0)}
            </div>
            <div className="flex flex-col items-center md:items-start w-full">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight break-words">Welcome, {userData?.name}</h1>
              <p className="text-sm text-slate-500 mt-3 flex flex-col md:flex-row items-center gap-2 md:gap-3 font-medium">
                <span className="inline-flex items-center justify-center font-mono bg-slate-100 px-3 py-1 rounded-md text-slate-600 font-bold border border-slate-200">{userData?.patient_code || "PAT-XXXX"}</span>
                <span className="flex items-center gap-1.5"><Mail size={16} /> <span className="truncate">{userData?.email}</span></span>
                <span className="flex items-center gap-1.5"><Smartphone size={16} /> {userData?.phone}</span>
              </p>
            </div>
          </div>
        </div>

        {/* MAIN BODY NAVIGATION PANEL */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 mt-8">
          
          {/* STICKY SIDEBAR NAVIGATION */}
          <div className="w-full md:w-72 shrink-0 space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="md:sticky md:top-10 space-y-4">
              
              {/* BOOKINGS HISTORY PARENT */}
              <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all">
                <button
                  onClick={() => {
                    setActiveTab("appointments");
                    setIsBookingsExpanded(!isBookingsExpanded);
                  }}
                  className={`w-full flex items-center justify-between px-5 py-4 font-bold transition-all text-sm ${
                    activeTab === "appointments" ? "text-teal-700 bg-teal-50/50" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar size={18} /> Bookings History
                  </div>
                  {isBookingsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {/* SUB NAVIGATION (Collapsible) */}
                {isBookingsExpanded && (
                  <div className="bg-slate-50/50 border-t border-slate-100 flex flex-col p-3 space-y-1.5">
                    <button
                      onClick={() => { setActiveTab("appointments"); setBookingFilter("upcoming"); }}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                        activeTab === "appointments" && bookingFilter === "upcoming" 
                          ? "bg-white shadow-sm border border-slate-200 text-teal-700" 
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                      }`}
                    >
                      <span className="flex items-center gap-2"><Clock size={16} className={activeTab === "appointments" && bookingFilter === "upcoming" ? "text-teal-600" : "text-slate-400 group-hover:text-slate-500"}/> Upcoming Consults</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold shadow-sm ${activeTab === "appointments" && bookingFilter === "upcoming" ? "bg-teal-100 text-teal-800" : "bg-slate-200 text-slate-600"}`}>
                        {upcomingAppts.length}
                      </span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("appointments"); setBookingFilter("past"); }}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                        activeTab === "appointments" && bookingFilter === "past" 
                          ? "bg-white shadow-sm border border-slate-200 text-teal-700" 
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                      }`}
                    >
                      <span className="flex items-center gap-2"><CheckCircle size={16} className={activeTab === "appointments" && bookingFilter === "past" ? "text-teal-600" : "text-slate-400 group-hover:text-slate-500"}/> Past Consults</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold shadow-sm ${activeTab === "appointments" && bookingFilter === "past" ? "bg-teal-100 text-teal-800" : "bg-slate-200 text-slate-600"}`}>
                        {pastAppts.length}
                      </span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("appointments"); setBookingFilter("total"); }}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                        activeTab === "appointments" && bookingFilter === "total" 
                          ? "bg-white shadow-sm border border-slate-200 text-teal-700" 
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                      }`}
                    >
                      <span className="flex items-center gap-2"><History size={16} className={activeTab === "appointments" && bookingFilter === "total" ? "text-teal-600" : "text-slate-400 group-hover:text-slate-500"}/> Total Consults</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold shadow-sm ${activeTab === "appointments" && bookingFilter === "total" ? "bg-teal-100 text-teal-800" : "bg-slate-200 text-slate-600"}`}>
                        {appointments.length}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* LAB REPORTS BUTTON */}
              <button
                onClick={() => { setActiveTab("labs"); setIsBookingsExpanded(false); }}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-sm shadow-sm border ${
                  activeTab === "labs"
                    ? "bg-white border-teal-200 text-teal-700 shadow-teal-100/50"
                    : "bg-white/80 backdrop-blur-md text-slate-600 border-slate-200 hover:bg-white hover:text-teal-700 hover:shadow-md"
                }`}
              >
                <FlaskConical size={18} /> Lab Reports
              </button>

            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            
            {/* TAB 1: APPOINTMENTS HISTORY */}
            {activeTab === "appointments" && (
              <div className="glass-panel p-6 md:p-8 h-full border border-slate-200">
                
                {/* DYNAMIC HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-5 border-b border-slate-200/60">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm ${
                      bookingFilter === "upcoming" ? "bg-gradient-to-br from-teal-400 to-teal-600 text-white" : 
                      bookingFilter === "past" ? "bg-gradient-to-br from-slate-400 to-slate-600 text-white" : 
                      "bg-gradient-to-br from-indigo-400 to-indigo-600 text-white"
                    }`}>
                      {bookingFilter === "upcoming" ? <Clock size={24} /> : bookingFilter === "past" ? <CheckCircle size={24} /> : <History size={24} />}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {bookingFilter === "upcoming" ? "Upcoming Consultations" : bookingFilter === "past" ? "Past Consultations" : "Total Consultations"}
                      </h2>
                      <p className="text-sm text-slate-500 font-medium mt-1">
                        {bookingFilter === "upcoming" ? "Consultations you have booked for the future." : bookingFilter === "past" ? "Your previous consultation history." : "A complete history of all your bookings."}
                      </p>
                    </div>
                  </div>
                </div>
                
                {loading ? (
                  <div className="py-16 flex justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div></div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const displayAppts = bookingFilter === "upcoming" ? upcomingAppts : bookingFilter === "past" ? pastAppts : appointments.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
                      
                      if (displayAppts.length === 0) {
                        return (
                          <div className="text-center py-16 px-6 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                            <CalendarDays size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-600 font-bold text-lg">No appointments found in this category.</p>
                            <p className="text-slate-400 text-sm mt-1">When you book consultations, they will appear here.</p>
                          </div>
                        );
                      }

                      return displayAppts.map((appt) => (
                        <div key={appt.id} className="p-5 md:p-6 bg-white rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 hover:shadow-lg transition-all group overflow-hidden relative">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-teal-400 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="w-full md:pl-2">
                            <div className="flex flex-wrap gap-2 items-center mb-3">
                              <h4 className="font-black text-slate-900 text-lg tracking-tight group-hover:text-teal-700 transition-colors">{appt.department}</h4>
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-sm border ${getStatusClass(appt.status)}`}>
                                {appt.status}
                              </span>
                              {appt.token_no && (
                                <span className="bg-slate-900 text-white text-xs font-mono font-bold px-3 py-1 rounded-md shadow-sm border border-slate-700">
                                  {appt.token_no}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 font-semibold flex flex-wrap items-center gap-2">
                              <span className="bg-slate-50 border border-slate-150 px-2.5 py-1.5 rounded-lg flex items-center gap-2"><User size={14} className="text-teal-600"/> Dr. {appt.doctor_name}</span> 
                              <span className="text-slate-300 hidden md:inline">•</span>
                              <span className="text-slate-600 flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-2.5 py-1.5 rounded-lg"><Calendar size={14} className="text-teal-600"/> {new Date(appt.date || appt.preferred_date).toLocaleDateString()}</span>
                              <span className="text-slate-300 hidden md:inline">•</span>
                              <span className="text-slate-600 flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-2.5 py-1.5 rounded-lg"><Clock size={14} className="text-teal-600"/> {appt.time || appt.preferred_time || "Not selected"}</span>
                            </p>
                            {appt.message && <p className="text-sm text-slate-600 mt-4 bg-amber-50/50 px-4 py-3 rounded-xl border border-amber-100 italic">“{appt.message}”</p>}
                          </div>

                          <div className="flex flex-col md:items-end gap-3 shrink-0 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 relative z-10">
                            <div className="flex items-center justify-between w-full md:justify-end gap-3">
                              <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm ${
                                appt.payment_status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}>
                                {appt.payment_status || "Unpaid"}
                              </span>
                              {appt.consultation_fee > 0 && <span className="text-xl font-black text-slate-800">₹{appt.consultation_fee}</span>}
                            </div>
                            
                            {appt.payment_status !== "Paid" && bookingFilter === "upcoming" && (
                              <button
                                onClick={() => handlePayAppointment(appt)}
                                className="premium-btn px-6 py-2.5 flex items-center justify-center gap-2 w-full shadow-md hover:shadow-lg mt-1"
                              >
                                <CreditCard size={16} /> Pay Fee Now
                              </button>
                            )}
                            
                            {appt.payment_status === "Paid" && appt.razorpay_payment_id && (
                              <span className="text-xs text-slate-400 font-mono text-left md:text-right w-full block bg-slate-50 px-2 py-1 rounded border border-slate-100">Txn: {appt.razorpay_payment_id.slice(-8)}</span>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* ================= LABS TAB ================= */}
            {activeTab === "labs" && (
              <div className="glass-panel p-6 md:p-8 animate-slide-up h-full border border-slate-200">
                <div className="flex items-center gap-4 mb-8 pb-5 border-b border-slate-200/60">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 text-white flex items-center justify-center shadow-sm">
                    <FlaskConical size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Lab Reports</h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">View tests ordered during consultations</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {labs.length === 0 ? (
                    <div className="text-center py-16 px-6 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                      <FlaskConical size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-600 font-bold text-lg">No lab tests ordered yet.</p>
                      <p className="text-slate-400 text-sm mt-1">Your reports will appear here once processed.</p>
                    </div>
                  ) : (
                    labs.map(lab => (
                      <div key={lab.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4 transition-all hover:shadow-lg group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-400 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex-1 md:pl-2">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-700 transition-colors">{lab.test_name}</h3>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold border shadow-sm ${lab.status === "Report Ready" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                              {lab.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                            <span className="bg-slate-50 border border-slate-150 px-2.5 py-1.5 rounded-lg flex items-center gap-2"><User size={14} className="text-indigo-600"/> Dr. {lab.doctor_name}</span>
                            <span className="text-slate-300 hidden md:inline">•</span>
                            <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-2.5 py-1.5 rounded-lg"><Calendar size={14} className="text-indigo-600"/>{new Date(lab.created_at).toLocaleDateString()}</span>
                          </p>
                        </div>
                        
                        {lab.status === "Report Ready" ? (
                          <div className="bg-slate-50 px-5 py-4 rounded-xl border border-slate-200 text-right shrink-0 min-w-[200px] w-full md:w-auto relative z-10">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Result Value</span>
                            <span className="text-2xl font-black text-slate-800">{lab.result_value}</span>
                            <span className="text-xs text-slate-500 block mt-1 mb-3 bg-white border border-slate-200 py-1 rounded-md">Normal: {lab.normal_range}</span>
                            
                            <button onClick={() => navigate("/lab-report-print", { state: { lab } })} className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg w-full flex justify-center items-center gap-2 hover:from-indigo-700 hover:to-purple-800 hover:shadow-lg transition-all">
                              View PDF Report
                            </button>
                          </div>
                        ) : (
                          <div className="text-sm font-bold text-amber-600 italic bg-amber-50 px-5 py-3 rounded-xl border border-amber-100 w-full md:w-auto text-center md:text-right">Processing...</div>
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
