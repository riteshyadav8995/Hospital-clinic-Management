import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";

function UserLayout() {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-gray-800 overflow-x-hidden w-full max-w-[100vw]">
      <Navbar />
      <div className="flex-grow">
        <Outlet />
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default UserLayout;
