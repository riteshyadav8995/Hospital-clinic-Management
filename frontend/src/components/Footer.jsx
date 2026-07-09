import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-teal-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-4">
        <div>
          <h2 className="text-2xl font-bold">
            <Link to="/" onClick={() => window.scrollTo(0, 0)} className="hover:text-teal-200 transition">
              Ayurda Hospital and Clinics
            </Link>
          </h2>
          <p className="mt-3 text-teal-100">
            Patient-focused care for Dental, Dermatology, IVF and Eye Care.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold">Departments</h3>
          <ul className="mt-3 space-y-2 text-teal-100">
            <li>Dental Care</li>
            <li>Dermatology</li>
            <li>IVF & Fertility</li>
            <li>Eye Care</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold">Quick Links</h3>
          <ul className="mt-3 space-y-2 text-teal-100 flex flex-col">
            <li><Link to="/services" className="hover:text-white transition">Services</Link></li>
            <li><Link to="/testimonials" className="hover:text-white transition">Testimonials</Link></li>
            <li><Link to="/faq" className="hover:text-white transition">FAQ</Link></li>
            <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold">Contact</h3>
          <p className="mt-3 text-teal-100">Phone: 7799889398</p>
          <p className="text-teal-100">WhatsApp: 7799889398</p>
          <p className="text-teal-100">Timing: Mon - Sat, 9 AM - 7 PM</p>
        </div>
      </div>

      <div className="border-t border-teal-800 py-4 text-center text-sm text-teal-100">
        © 2026 Ayurda Hospital and Clinics. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;