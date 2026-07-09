import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../utils/api";

function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("patientToken"));
  
  const localUserStr = localStorage.getItem("patientUser");
  const localUser = localUserStr ? JSON.parse(localUserStr) : null;
  const [userData, setUserData] = useState(localUser);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: localUser?.name || "",
    email: localUser?.email || "",
    phone: localUser?.phone || "",
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("patientToken"));
      const updatedUser = localStorage.getItem("patientUser");
      if (updatedUser) {
        setUserData(JSON.parse(updatedUser));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("patientToken");
    localStorage.removeItem("patientUser");
    setIsLoggedIn(false);
    window.dispatchEvent(new Event("storage"));
    setIsLogoutModalOpen(false);
    navigate("/login");
  };

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

  const links = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Doctors", path: "/doctors" },
    { name: "AI Guide", path: "/symptom-guide" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm w-full">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link to="/" className="text-2xl font-bold text-teal-700">
          Ayurda Hospital and Clinics
        </Link>

        {/* Desktop Menu */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                isActive
                  ? "font-semibold text-teal-700"
                  : "font-medium text-gray-700 hover:text-teal-700"
              }
            >
              {link.name}
            </NavLink>
          ))}

          <span className="h-5 w-[1px] bg-gray-200"></span>

          {isLoggedIn ? (
            <div className="flex items-center gap-4 relative">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive
                    ? "font-semibold text-teal-750"
                    : "font-medium text-gray-700 hover:text-teal-700"
                }
              >
                Booked Appointments
              </NavLink>
              
              {/* Profile Avatar */}
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-bold text-lg shadow-md hover:shadow-lg transition-all"
              >
                {userData?.name ? userData.name.charAt(0).toUpperCase() : "U"}
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute top-12 right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                  <button 
                    onClick={() => { setIsEditProfileOpen(true); setIsProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2"
                  >
                    <User size={16} /> Edit your profile
                  </button>
                  <button 
                    onClick={() => { setIsLogoutModalOpen(true); setIsProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink
                to="/register"
                className="rounded-full border border-teal-700 px-4 py-1.5 font-semibold text-teal-700 hover:bg-teal-50 transition"
              >
                Register
              </NavLink>
            </>
          )}

          <Link
            to="/book-appointment"
            className="rounded-full bg-teal-700 px-5 py-2 font-semibold text-white shadow-[0_0_15px_rgba(15,118,110,0.6)] hover:bg-teal-800 hover:shadow-[0_0_25px_rgba(15,118,110,0.8)] transition-all animate-pulse"
          >
            Book Appointment
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="border-t bg-white px-5 py-4 md:hidden space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => setOpen(false)}
              className="block py-2.5 font-medium text-gray-700"
            >
              {link.name}
            </NavLink>
          ))}

          <hr className="my-2" />

          {isLoggedIn ? (
            <>
              <NavLink
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="block py-2.5 font-medium text-teal-700"
              >
                Booked Appointments
              </NavLink>
              <button
                onClick={() => {
                  setOpen(false);
                  setIsEditProfileOpen(true);
                }}
                className="block w-full text-left py-2.5 font-medium text-gray-700"
              >
                Edit your profile
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setIsLogoutModalOpen(true);
                }}
                className="block w-full text-left py-2.5 font-medium text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/register"
                onClick={() => setOpen(false)}
                className="block py-2.5 font-medium text-gray-700 hover:text-teal-700"
              >
                Register
              </NavLink>
            </>
          )}

          <Link
            to="/book-appointment"
            onClick={() => setOpen(false)}
            className="mt-3 block rounded-full bg-teal-700 px-5 py-3 text-center font-semibold text-white shadow-[0_0_15px_rgba(15,118,110,0.6)] animate-pulse"
          >
            Book Appointment
          </Link>
        </div>
      )}

      {/* Modals */}
      
      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setIsEditProfileOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-6">Edit your profile</h3>
            
            {successMsg && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 size={16} /> {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm font-semibold">
                <X size={16} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  readOnly
                  value={profileForm.email}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-teal-600 text-white font-bold rounded-lg py-2.5 hover:bg-teal-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you really want to log out?</p>
            <div className="flex gap-4">
              <button 
                onClick={handleLogout}
                className="flex-1 bg-red-600 text-white font-bold rounded-lg py-2.5 hover:bg-red-700 transition-colors"
              >
                Yes
              </button>
              <button 
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 bg-gray-200 text-gray-800 font-bold rounded-lg py-2.5 hover:bg-gray-300 transition-colors"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;