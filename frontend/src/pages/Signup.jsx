import { useState } from "react";
import api from "../utils/api";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Phone, Lock, UserPlus, ArrowRight, ShieldCheck } from "lucide-react";

function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    otp: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!formData.phone.trim()) return "Phone number is required";
    if (!/^[6-9]\d{9}$/.test(formData.phone)) return "Please enter a valid 10-digit phone number";
    if (formData.password.length < 6) return "Password must be at least 6 characters long";
    return "";
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await api.post("/users/register-otp", { email: formData.email });
      setSuccessMsg("An OTP has been sent to your email address.");
      setStep(2);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!formData.otp || formData.otp.length < 6) {
      setErrorMsg("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await api.post("/users/register", formData);
      
      // Store patient session details
      localStorage.setItem("patientToken", res.data.token);
      localStorage.setItem("patientUser", JSON.stringify(res.data.user));

      // Dispatch storage event to dynamically trigger updates
      window.dispatchEvent(new Event("storage"));

      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      navigate(redirect ? `/${redirect}` : "/dashboard");
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[85vh] items-center justify-center bg-gray-50 px-5 py-16">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg border border-gray-100">
        <h1 className="text-3xl font-black text-gray-905 flex items-center gap-2">
          Register Account <span className="text-teal-600">✦</span>
        </h1>
        <p className="mt-2 text-sm text-gray-550">
          {step === 1 ? "Create a patient account to book appointments instantly and view prescription files." : "Enter the 6-digit OTP sent to your email to verify your account."}
        </p>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
              <div className="relative mt-1">
                <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  required
                  type="text"
                  name="name"
                  placeholder="Rajesh Kumar"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-250 pl-11 pr-4 py-3 outline-none focus:border-teal-700 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="patient@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-250 pl-11 pr-4 py-3 outline-none focus:border-teal-700 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Mobile Number</label>
              <div className="relative mt-1">
                <Phone className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  required
                  type="text"
                  name="phone"
                  placeholder="9988776655"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength="10"
                  className="w-full rounded-xl border border-gray-250 pl-11 pr-4 py-3 outline-none focus:border-teal-700 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  required
                  type="password"
                  name="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-250 pl-11 pr-4 py-3 outline-none focus:border-teal-700 text-sm"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-red-650 text-sm font-semibold">
                {errorMsg}
              </p>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-full bg-teal-700 hover:bg-teal-800 px-5 py-3 font-bold text-white transition disabled:bg-gray-400 shadow-md"
            >
              {loading ? "Sending OTP..." : "Send OTP"} <ArrowRight size={18} />
            </button>
            <p className="mt-5 text-center text-sm font-medium text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="text-teal-700 hover:underline">
                Login here
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Email OTP</label>
              <div className="relative mt-1">
                <ShieldCheck className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  required
                  type="text"
                  name="otp"
                  placeholder="6-digit code"
                  value={formData.otp}
                  onChange={handleChange}
                  maxLength="6"
                  className="w-full rounded-xl border border-gray-250 pl-11 pr-4 py-3 outline-none focus:border-teal-700 text-sm text-center tracking-widest font-bold"
                />
              </div>
            </div>

            {successMsg && (
              <p className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-emerald-700 text-sm font-semibold">
                {successMsg}
              </p>
            )}

            {errorMsg && (
              <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-red-650 text-sm font-semibold">
                {errorMsg}
              </p>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-full bg-teal-700 hover:bg-teal-800 px-5 py-3 font-bold text-white transition disabled:bg-gray-400 shadow-md"
            >
              {loading ? "Verifying..." : "Verify & Register"} <UserPlus size={18} />
            </button>
            <p className="mt-5 text-center text-sm font-medium text-gray-500">
              <button type="button" onClick={() => setStep(1)} className="text-teal-700 hover:underline">
                Go back to edit details
              </button>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}

export default Signup;
