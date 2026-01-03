import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Info,
  ChevronDown
} from 'lucide-react';
import { dashboardAPI } from '../api/dashboard';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import excelIcon from '../assets/excel.png';
import pdfIcon from '../assets/pdf.png';
import profitIcon from '../assets/profit.png';
import jadwalIcon from '../assets/calendar.png';
import barChartIcon from '../assets/bar-chart.png';
import highIcon from '../assets/medal.png';
import AttendanceRecapManager from '../components/AttendanceRecapManager';

const RT_OPTIONS = ['01', '02', '03', '04', '05', '06'];

// MODIFIKASI: Opsi filter dibuat array agar bisa di-looping untuk animasi
const FILTER_OPTIONS = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'week', label: '7 Hari Terakhir' },
  { id: 'month', label: 'Bulan Ini' },
];

const Reports = () => {
  const [activeQuickFilter, setActiveQuickFilter] = useState('today'); // New state for active quick filter

  const [filters, setFilters] = useState(() => {
    const today = new Date();
    return {
      rt: '',
      startDate: today.toISOString().split('T')[0], // Default to 'today'
      endDate: today.toISOString().split('T')[0],   // Default to 'today'
    };
  });
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Custom Dropdown States
  const [isRTOpen, setIsRTOpen] = useState(false);

  // Refs
  const rtRef = useRef(null);

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rtRef.current && !rtRef.current.contains(event.target)) setIsRTOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper untuk set tanggal otomatis
  const setQuickDate = (type) => {
    setActiveQuickFilter(type); // Set active filter
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'today') {
      // Sama
    } else if (type === 'week') {
      start.setDate(today.getDate() - 7);
    } else if (type === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    setFilters(prev => ({
      ...prev,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }));
  };

  // MODIFIKASI: Reset activeFilter jika user mengubah tanggal manual lewat input date
  const handleManualDateChange = (field, value) => {
    setActiveQuickFilter(''); // Hilangkan highlight tombol jika user custom tanggal
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = async (type) => {
    if (!filters.startDate || !filters.endDate) {
      toast.error('Silakan pilih rentang tanggal terlebih dahulu');
      return;
    }

    const isExcel = type === 'excel';
    const setLoading = isExcel ? setExportingExcel : setExportingPDF;
    const apiCall = isExcel ? dashboardAPI.exportToExcel : dashboardAPI.exportToPDF;
    const ext = isExcel ? 'xlsx' : 'pdf';

    setLoading(true);
    try {
      const blob = await apiCall(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rekap_Absensi${filters.rt ? `_RT${filters.rt}` : ''}_${filters.startDate}_sd_${filters.endDate}.${ext} `;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Laporan ${isExcel ? 'Excel' : 'PDF'} berhasil diunduh!`);
    } catch (error) {
      toast.error('Gagal mengekspor laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchPreview = async () => {
      if (!filters.startDate || !filters.endDate) {
        setPreview(null);
        return;
      }
      setLoadingPreview(true);
      try {
        const params = {};
        if (filters.rt) params.rt = filters.rt;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        const response = await dashboardAPI.getReportPreview(params);
        if (response.success) {
          setPreview(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch preview:', error);
        setPreview(null);
      } finally {
        setLoadingPreview(false);
      }
    };

    const timeoutId = setTimeout(fetchPreview, 500);
    return () => clearTimeout(timeoutId);
  }, [filters]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Pusat Laporan</h1>
          <p className="text-gray-500 mt-1 text-sm">Kelola dan unduh rekap data kehadiran warga.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col space-y-6">

          {/* MODIFIKASI: Top Row: Quick Filters dengan Animasi Slide */}
          <div className="flex flex-wrap gap-4 items-center pb-4 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2">
              Filter Cepat:
            </span>

            {/* Container Slide */}
            <div className="flex bg-gray-100/80 p-1 rounded-lg relative">
              {FILTER_OPTIONS.map((item) => {
                const isActive = activeQuickFilter === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setQuickDate(item.id)}
                    className={`
                      relative px-4 py-1.5 text-sm font-medium rounded-md transition-colors z-10 outline-none focus-visible:ring-2
                      ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-700'}
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activePill"
                        className="absolute inset-0 bg-blue-600 rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-blue-600"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        style={{ zIndex: -1 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Middle Row: Inputs & Actions */}
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-end">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full lg:w-3/4">

              {/* Filter RT */}
              <div className="space-y-1.5" ref={rtRef}>
                <label className="text-xs font-semibold text-gray-500">Wilayah RT</label>
                <div className="relative">
                  <button
                    onClick={() => setIsRTOpen(!isRTOpen)}
                    className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between text-left transition-all hover:bg-gray-100"
                  >
                    <span>{filters.rt ? `RT ${filters.rt}` : 'Semua RT'}</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isRTOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isRTOpen && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                        <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                          <div onClick={() => { setFilters({ ...filters, rt: '' }); setIsRTOpen(false); }} className="px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 text-gray-600">Semua RT</div>
                          {RT_OPTIONS.map(rt => (
                            <div key={rt} onClick={() => { setFilters({ ...filters, rt: rt }); setIsRTOpen(false); }} className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 ${filters.rt === rt ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'}`}>RT {rt}</div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Date Start - MODIFIKASI: handleManualDateChange */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Dari Tanggal</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleManualDateChange('startDate', e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:bg-gray-100 focus:bg-white"
                />
              </div>

              {/* Date End - MODIFIKASI: handleManualDateChange */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Sampai Tanggal</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleManualDateChange('endDate', e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:bg-gray-100 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex gap-3 w-full lg:w-auto">
              <Button
                onClick={() => handleExport('excel')}
                disabled={exportingExcel || exportingPDF || !filters.startDate}
                className="flex-1 lg:flex-none justify-center !bg-green-600 hover:!bg-green-700 text-white border-none shadow-sm hover:shadow active:scale-95 transition-all"
              >
                {exportingExcel ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Loading</span>
                ) : (
                  <span className="flex items-center gap-2"><img src={excelIcon} alt="Excel" className="w-5 h-5 brightness-0 invert" /> Excel</span>
                )}
              </Button>
              <Button
                onClick={() => handleExport('pdf')}
                disabled={exportingExcel || exportingPDF || !filters.startDate}
                className="flex-1 lg:flex-none justify-center !bg-red-600 hover:!bg-red-700 text-white border-none shadow-sm hover:shadow active:scale-95 transition-all"
              >
                {exportingPDF ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Loading</span>
                ) : (
                  <span className="flex items-center gap-2"><img src={pdfIcon} alt="PDF" className="w-5 h-5 brightness-0 invert" /> PDF</span>
                )}
              </Button>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex items-start gap-3">
            <Info className="text-blue-500 mt-0.5 flex-shrink-0" size={18} />
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Info Ekspor:</strong> Format Excel (.xlsx) disarankan untuk pengolahan data lanjutan, sedangkan PDF (.pdf) disarankan untuk dokumen siap cetak.
            </p>
          </div>
        </div>
      </div>

      <div className="animate-fade-in-up">
        {!filters.startDate || !filters.endDate ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-gray-50/50">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <Calendar className="text-gray-300" size={40} />
            </div>
            <h3 className="text-lg font-medium text-gray-700">Belum Ada Data Dipilih</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-md">
              Silakan pilih rentang tanggal pada panel di atas untuk melihat pratinjau statistik sebelum melakukan ekspor.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <img src={profitIcon} alt="Pratinjau" className="w-5 h-5" style={{ filter: 'invert(64%) sepia(67%) saturate(381%) hue-rotate(359deg) brightness(99%) contrast(92%)' }} />
              <h2 className="text-lg font-bold text-gray-800">Pratinjau Statistik</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stat 1 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                <div className="relative z-10">
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Data</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-gray-800">
                      {loadingPreview ? '...' : (preview?.totalRecords || 0)}
                    </h3>
                    <span className="text-xs text-gray-400">entri</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded">
                    <img src={jadwalIcon} alt="Calendar" className="w-3 h-3" style={{ filter: 'invert(41%) sepia(88%) saturate(1747%) hue-rotate(199deg) brightness(98%) contrast(101%)' }} />
                    <span>
                      {Math.ceil((new Date(filters.endDate) - new Date(filters.startDate)) / (1000 * 60 * 60 * 24)) + 1} Hari Rentang
                    </span>
                  </div>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tingkat Kehadiran</p>
                    <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                      {loadingPreview ? '...' : `${preview?.attendanceSummary?.rate || 0}% `}
                    </h3>
                  </div>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <img src={barChartIcon} alt="Chart" className="w-5 h-5" style={{ filter: 'invert(56%) sepia(80%) saturate(409%) hue-rotate(99deg) brightness(95%) contrast(91%)' }} />
                  </div>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${preview?.attendanceSummary?.rate || 0}% ` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Hadir: <strong>{preview?.attendanceSummary?.hadir || 0}</strong></span>
                  <span>Tidak hadir <strong>{preview?.attendanceSummary?.tidakHadir || 0}</strong></span>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <img src={highIcon} alt="Award" className="w-5 h-5" style={{ filter: 'invert(64%) sepia(67%) saturate(381%) hue-rotate(359deg) brightness(99%) contrast(92%)' }} />
                  <p className="text-sm font-medium text-gray-500">RT Teraktif</p>
                </div>

                <div className="space-y-3">
                  {loadingPreview ? (
                    <p className="text-sm text-gray-400">Memuat data...</p>
                  ) : preview?.topRT && preview.topRT.length > 0 ? (
                    preview.topRT.slice(0, 3).map((rt, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                            #{i + 1}
                          </span>
                          <span className="text-gray-700 font-medium">RT {rt.rt}</span>
                        </div>
                        <span className="font-bold text-gray-800">{rt.rate}%</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">Pilih "Semua RT" untuk melihat peringkat.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <AttendanceRecapManager />
      </div>
    </div>
  );
};

export default Reports;