import { useLocation, useNavigate } from "react-router-dom";
import { Printer, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

function LabReportPrint() {
  const location = useLocation();
  const navigate = useNavigate();
  const lab = location.state?.lab;

  useEffect(() => {
    if (!lab) {
      navigate("/");
    }
  }, [lab, navigate]);

  if (!lab) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center font-sans">
      
      {/* Floating Action Bar (Hidden when printing) */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg border border-teal-100 flex items-center gap-4 z-50 print:hidden">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800 flex items-center gap-2 font-bold text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="w-px h-6 bg-gray-200"></div>
        <button onClick={handlePrint} className="bg-teal-700 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-teal-800 transition flex items-center gap-2">
          <Printer size={16} /> Print / Save PDF
        </button>
      </div>

      {/* A4 Document Area */}
      <div className="w-full max-w-[210mm] bg-white shadow-xl min-h-[297mm] p-[20mm] relative">
        
        {/* Header */}
        <div className="border-b-4 border-teal-800 pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-teal-900 tracking-tight">Ayurda Hospital and Clinics</h1>
            <p className="text-gray-500 mt-1">Multi-Specialty Care Center</p>
            <p className="text-sm text-gray-400 mt-1">Phone: +91 7799889398 | www.ayurda.com</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-widest">Lab Report</h2>
            <p className="text-sm font-bold text-gray-500 mt-2">Report ID: LR-{String(lab.id).padStart(5, '0')}</p>
            <p className="text-sm font-bold text-gray-500">Date: {new Date(lab.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Patient Details</h3>
            <p className="font-bold text-gray-900 text-lg">{lab.patient_name || lab.name}</p>
            <p className="text-gray-600 mt-1">Patient ID: <span className="font-mono font-bold text-gray-800">{lab.patient_code}</span></p>
          </div>
          
          <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
            <h3 className="text-xs font-bold text-teal-600/70 uppercase tracking-wider mb-3">Referred By</h3>
            <p className="font-bold text-teal-900 text-lg">Dr. {lab.doctor_name}</p>
            <p className="text-teal-700 mt-1">Department: <span className="font-bold">{lab.department || "General"}</span></p>
          </div>
        </div>

        {/* Test Results Table */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-4">Investigation Results</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
                <th className="py-3 px-4 rounded-l-lg font-bold">Test Description</th>
                <th className="py-3 px-4 font-bold text-right">Observed Value</th>
                <th className="py-3 px-4 rounded-r-lg font-bold text-right">Reference Range</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-5 px-4">
                  <p className="font-bold text-gray-900 text-lg">{lab.test_name}</p>
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold mt-2 border border-green-200">
                    <CheckCircle2 size={12} /> Final Report
                  </span>
                </td>
                <td className="py-5 px-4 text-right">
                  <span className="text-xl font-black text-gray-900">{lab.result_value}</span>
                </td>
                <td className="py-5 px-4 text-right text-gray-500">
                  {lab.normal_range}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Signatures */}
        <div className="absolute bottom-[20mm] left-[20mm] right-[20mm]">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-400 font-medium">*** End of Report ***</p>
              <p className="text-xs text-gray-400 font-medium mt-1">Printed on: {new Date().toLocaleString()}</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-b border-gray-400 mb-2 border-dashed"></div>
              <p className="text-sm font-bold text-gray-800">Verified By</p>
              <p className="text-xs text-gray-500">Laboratory Technologist</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LabReportPrint;
