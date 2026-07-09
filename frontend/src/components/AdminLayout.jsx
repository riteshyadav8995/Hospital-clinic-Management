import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Layers,
  Star,
  MessageSquare,
  LogOut,
  LayoutDashboard,
  Activity,
  BedDouble,
  Pill,
  FlaskConical,
  IndianRupee,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

function AdminLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    navigate("/admin/login");
  };

  const adminRole = localStorage.getItem("adminRole") || "Super Admin";

  const allMenuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard, roles: ["Super Admin", "Receptionist", "Branch Admin", "Doctor", "Owner", "Accountant", "Nurse", "Pharmacist", "Lab Technician"] },
    { name: "My Queue", path: "/admin/doctor-queue", icon: Users, roles: ["Doctor", "Nurse"] },
    { name: "Today's Queue", path: "/admin/queue", icon: Users, roles: ["Super Admin", "Receptionist", "Branch Admin", "Nurse"] },
    { name: "Pharmacy", path: "/admin/pharmacy", icon: Pill, roles: ["Super Admin", "Pharmacist", "Branch Admin"] },
    { name: "Laboratory", path: "/admin/labs", icon: FlaskConical, roles: ["Super Admin", "Lab Technician", "Branch Admin"] },
    { name: "Billing", path: "/admin/billing", icon: IndianRupee, roles: ["Super Admin", "Accountant", "Branch Admin", "Receptionist"] },
    { name: "Appointments", path: "/admin/appointments", icon: Calendar, roles: ["Super Admin", "Receptionist", "Branch Admin"] },
    { name: "Doctors", path: "/admin/doctors", icon: Users, roles: ["Super Admin", "Branch Admin", "Owner"] },
    { name: "Services", path: "/admin/services", icon: Layers, roles: ["Super Admin", "Owner"] },
    { name: "Testimonials", path: "/admin/testimonials", icon: Star, roles: ["Super Admin"] },
    { name: "FAQs", path: "/admin/faqs", icon: MessageSquare, roles: ["Super Admin"] },
    { name: "Patients", path: "/admin/users", icon: Users, roles: ["Super Admin", "Receptionist", "Branch Admin", "Doctor", "Nurse"] },
    { name: "Wards", path: "/admin/wards", icon: BedDouble, roles: ["Super Admin", "Branch Admin", "Nurse"] },
    { name: "Admissions", path: "/admin/admissions", icon: Activity, roles: ["Super Admin", "Receptionist", "Branch Admin", "Nurse"] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(adminRole));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans selection:bg-teal-500/30">
      
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`w-64 bg-slate-950 text-slate-300 shrink-0 shadow-2xl flex flex-col justify-between border-r border-slate-800 fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="absolute inset-0 bg-gradient-to-b from-teal-900/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col h-full">
          <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-white">
                <span className="text-teal-500 animate-pulse">✦</span> Ayurda
              </h2>
              <p className="text-xs text-slate-500 font-medium tracking-widest uppercase mt-1">Control Panel</p>
            </div>
            <button 
              className="md:hidden text-slate-400 hover:text-white transition"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto scrollbar-hide">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-teal-500/10 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-teal-500 rounded-r-md shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                      )}
                      <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                      {item.name}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800/60 bg-slate-950">
            <div className="flex items-center gap-3 px-2 py-2 mb-3 bg-slate-900/50 rounded-xl border border-slate-800">
              <div className="relative flex h-3 w-3 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-300 truncate">{localStorage.getItem("adminEmail") || "admin@ayurda.com"}</p>
                <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider">{adminRole}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 border border-transparent hover:border-red-500/20"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative bg-[#f8fafc]">
        {/* MOBILE HEADER (ONLY VISIBLE ON SMALL SCREENS) */}
        <div className="md:hidden flex items-center justify-between bg-white px-5 py-4 border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-teal-600">✦</span> Ayurda
          </h2>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl pointer-events-none hidden md:block"></div>
        <div className="relative z-10 flex-1 flex flex-col min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
