import { useState } from "react";
import api from "../utils/api";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, ShieldCheck, CheckCircle } from "lucide-react";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setErrorMsg("Email is required");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await api.post("/users/forgot-password-otp", { email: formData.email });
      setSuccessMsg("A password reset OTP has been sent to your email.");
      setStep(2);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!formData.otp || formData.otp.length < 6) {
      setErrorMsg("Please enter the 6-digit OTP");
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await api.post("/users/forgot-password-reset", formData);
      setSuccessMsg(res.data.message);
      setStep(3); // Success step
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Failed to reset password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[85vh] items-center justify-center bg-gray-50 px-5 py-16">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg border border-gray-100">
        
        {step !== 3 && (
          <>
            <h1 className="text-3xl font-black text-gray-905 flex items-center gap-2">
              Forgot Password <span className="text-teal-600">✦</span>
            </h1>
            <p className="mt-2 text-sm text-gray-550">
              {step === 1 
                ? "Enter your registered email address and we'll send you an OTP to reset your password." 
                : "Enter the 6-digit OTP sent to your email along with your new password."}
            </p>
          </>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Registered Email</label>
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
              {loading ? "Sending OTP..." : "Send Reset OTP"} <ArrowRight size={18} />
            </button>
            
            <p className="mt-5 text-center text-sm font-medium text-gray-500">
              Remembered your password?{" "}
              <Link to="/login" className="text-teal-700 hover:underline">
                Login here
              </Link>
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="mt-8 space-y-4">
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

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">New Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  required
                  type="password"
                  name="newPassword"
                  placeholder="Min 6 characters"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-250 pl-11 pr-4 py-3 outline-none focus:border-teal-700 text-sm"
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
              {loading ? "Resetting..." : "Reset Password"} <Lock size={18} />
            </button>
            <p className="mt-5 text-center text-sm font-medium text-gray-500">
              <button type="button" onClick={() => setStep(1)} className="text-teal-700 hover:underline">
                Change email address
              </button>
            </p>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Password Reset!</h2>
            <p className="text-slate-500 text-sm mb-8">
              Your password has been successfully updated. You can now login with your new password.
            </p>
            <Link 
              to="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-700 hover:bg-teal-800 px-5 py-3 font-bold text-white transition shadow-md"
            >
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default ForgotPassword;
