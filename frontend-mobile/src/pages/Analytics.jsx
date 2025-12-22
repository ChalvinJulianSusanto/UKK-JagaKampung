import { useState, useEffect, memo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown, Filter, Calendar } from 'lucide-react';
import { dashboardAPI, attendancesAPI } from '../api';
import { Loading, Badge } from '../components/common';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';
import iconLoading from '../assets/loading.png';
import historyIcon from '../assets/folder.png';

// --- Hook Scroll ---
const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  useEffect(() => {
    const updatePosition = () => setScrollPosition(window.pageYOffset);
    window.addEventListener("scroll", updatePosition, { passive: true });
    return () => window.removeEventListener("scroll", updatePosition);
  }, []);
  return scrollPosition;
};

// --- Header Clean & Glass ---
const AnalyticsHeader = memo(({ isScrolled, month, year, t }) => {
  let title = t ? t('analytics.allPeriod') : "All Period";
  const yearNum = year !== 'semua' ? year : null;
  const monthNum = month !== 'semua' ? month : null;

  if (yearNum && monthNum !== null) {
    title = format(new Date(yearNum, monthNum), 'MMMM yyyy', { locale: id });
  } else if (yearNum) {
    title = `${t ? t('analytics.year') : 'Year'} ${yearNum}`;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ease-in-out px-4 py-5
        ${isScrolled
          ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50'
          : 'bg-gray-50 border-b border-transparent'
        }`}
    >
      <div className="relative flex flex-col justify-center">
        <h1 className="text-xl font-bold tracking-tight mb-1 text-gray-900 transition-colors">
          {t ? t('analytics.analysisTitle') : 'Attendance Analysis'}
        </h1>
        <p className="text-sm font-medium text-gray-500 transition-colors">
          {t ? t('analytics.statisticsFor') : 'Statistics for'} {title}
        </p>
      </div>
    </div>
  );
});

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100 text-xs">
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.payload.fill }} className="font-semibold">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- Komponen Utama ---
const Analytics = () => {
  // State
  const { t } = useLanguage();
  const [stats, setStats] = useState({ totalPresent: 0, totalIzin: 0, attendanceRate: 0 });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [selectedYear, setSelectedYear] = useState('semua');
  const [selectedMonth, setSelectedMonth] = useState('semua');
  const [historySort, setHistorySort] = useState('latest');

  // Loading & UI States
  const [statsLoading, setStatsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);

  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const isScrolled = useScrollPosition() > 10;

  const years = ['semua', 2027, 2026, 2025];
  const months = [{ value: 'semua', label: 'Semua Bulan' }, ...Array.from({ length: 12 }, (_, i) => ({ value: i, label: format(new Date(0, i), 'MMMM', { locale: id }) }))];

  const pieData = [
    { name: t('analytics.present'), value: stats.totalPresent, color: '#10B981' },
    { name: t('analytics.leave'), value: stats.totalIzin, color: '#EC4899' },
  ];

  // Click Outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearRef.current && !yearRef.current.contains(event.target)) setIsYearOpen(false);
      if (monthRef.current && !monthRef.current.contains(event.target)) setIsMonthOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Data
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const params = {};
      // Jika bulan dipilih tapi tahun tidak, gunakan tahun saat ini
      if (selectedMonth !== 'semua') {
        params.month = selectedMonth + 1;
        params.year = selectedYear !== 'semua' ? selectedYear : new Date().getFullYear();
      } else if (selectedYear !== 'semua') {
        params.year = selectedYear;
      }

      const response = await dashboardAPI.getUserMonthlyStats(params);
      if (response.success && response.data.length > 0) {
        const data = response.data[0];
        const totalPresent = data.hadir || 0;
        const totalIzin = data.izin || 0;
        const totalDaysRecorded = totalPresent + totalIzin;
        const rate = totalDaysRecorded > 0 ? Math.round((totalPresent / totalDaysRecorded) * 100) : 0;
        setStats({ totalPresent, totalIzin, attendanceRate: rate });
      } else {
        setStats({ totalPresent: 0, totalIzin: 0, attendanceRate: 0 });
      }
    } catch (error) {
      setStats({ totalPresent: 0, totalIzin: 0, attendanceRate: 0 });
    } finally {
      setStatsLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = {};
      // Jika bulan dipilih tapi tahun tidak, gunakan tahun saat ini
      if (selectedMonth !== 'semua') {
        params.month = selectedMonth + 1;
        params.year = selectedYear !== 'semua' ? selectedYear : new Date().getFullYear();
      } else if (selectedYear !== 'semua') {
        params.year = selectedYear;
      }

      const response = await attendancesAPI.getMyAttendanceHistory(params);
      if (response.success && response.data) {
        const processed = response.data.map(item => {
          const { date } = item;
          const dateObject = parseISO(date);
          return {
            ...item,
            date: dateObject,
            time: format(dateObject, 'HH:mm'),
          };
        });

        const groupedByDay = processed.reduce((acc, curr) => {
          const dayKey = format(curr.date, 'yyyy-MM-dd');
          if (!acc[dayKey]) acc[dayKey] = { date: curr.date, masuk: null, pulang: null, izin: null };

          if (curr.type === 'masuk' || curr.type === 'hadir') acc[dayKey].masuk = curr.time;
          if (curr.type === 'pulang') acc[dayKey].pulang = curr.time;
          if (curr.type === 'izin') {
            acc[dayKey].izin = true;
            acc[dayKey].status = 'Izin';
          }
          return acc;
        }, {});

        setAttendanceHistory(Object.values(groupedByDay));
      } else {
        setAttendanceHistory([]);
      }
    } catch (error) {
      toast.error(t('analytics.noData'));
      setAttendanceHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchStats();
    fetchHistory();
  }, [fetchStats, fetchHistory]);

  const sortedHistory = [...attendanceHistory].sort((a, b) => {
    return historySort === 'latest' ? b.date - a.date : a.date - b.date;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AnalyticsHeader isScrolled={isScrolled} month={selectedMonth} year={selectedYear} t={t} />

      <div className="pt-28 px-4">

        {/* STATISTIK */}
        {statsLoading ? (
          <div className="space-y-5 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-200 h-24 rounded-2xl animate-pulse"></div>
              <div className="bg-gray-200 h-24 rounded-2xl animate-pulse"></div>
            </div>
            <div className="bg-gray-200 h-64 rounded-2xl animate-pulse"></div>
          </div>
        ) : (
          <div className="space-y-5 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-50 rounded-full opacity-50"></div>
                <span className="text-3xl font-bold text-emerald-600 relative z-10">{stats.totalPresent}</span>
                <span className="text-xs font-medium text-gray-500 mt-1 relative z-10">{t('analytics.present')}</span>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-pink-100 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-pink-50 rounded-full opacity-50"></div>
                <span className="text-3xl font-bold text-pink-500 relative z-10">{stats.totalIzin}</span>
                <span className="text-xs font-medium text-gray-500 mt-1 relative z-10">{t('analytics.leave')}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">{t('analytics.attendanceRatio')}</h3>
                <Badge variant={stats.attendanceRate >= 75 ? 'success' : 'warning'}>{stats.attendanceRate}%</Badge>
              </div>
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="block text-xs text-gray-400">{t('analytics.total')}</span>
                    <span className="block text-xl font-bold text-gray-800">{stats.totalPresent + stats.totalIzin}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs text-gray-600">{t('analytics.present')}</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pink-500"></div><span className="text-xs text-gray-600">{t('analytics.leave')}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* FILTER & HEADER TABEL */}
        <div className="flex flex-col gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-700" />
            <h3 className="text-sm font-bold text-gray-700">{t('analytics.filterPeriod')}</h3>
          </div>

          <div className="flex gap-2">
            {/* Filter Bulan */}
            <div className="relative flex-1" ref={monthRef}>
              <button
                onClick={() => { setIsMonthOpen(!isMonthOpen); setIsYearOpen(false); }}
                className="w-full bg-white border border-gray-200 text-gray-700 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm flex items-center justify-between"
              >
                <span>{months.find(m => m.value === selectedMonth)?.label || t('analytics.month')}</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isMonthOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isMonthOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden"
                  >
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                      {months.map((m) => (
                        <div
                          key={m.value}
                          onClick={() => { setSelectedMonth(m.value); setIsMonthOpen(false); }}
                          className={`px-4 py-2.5 text-xs cursor-pointer hover:bg-blue-50 transition-colors ${selectedMonth === m.value ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}
                        >
                          {m.label}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Filter Tahun */}
            <div className="relative flex-1" ref={yearRef}>
              <button
                onClick={() => { setIsYearOpen(!isYearOpen); setIsMonthOpen(false); }}
                className="w-full bg-white border border-gray-200 text-gray-700 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm flex items-center justify-between"
              >
                <span>{selectedYear === 'semua' ? t('analytics.allYears') : selectedYear}</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isYearOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden"
                  >
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                      {years.map((y) => (
                        <div
                          key={y}
                          onClick={() => { setSelectedYear(y); setIsYearOpen(false); }}
                          className={`px-4 py-2.5 text-xs cursor-pointer hover:bg-blue-50 transition-colors ${selectedYear === y ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}
                        >
                          {y === 'semua' ? t('analytics.allYears') : y}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* TABEL DATA ABSENSI */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <img src={historyIcon} className="w-5 h-5 opacity-60" alt="" />
              <span className="text-gray-800 text-sm font-semibold">{t('analytics.attendanceData')}</span>
            </div>

            {/* Filter Terbaru/Terlama: Update Warna Biru */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setHistorySort('latest')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${historySort === 'latest'
                  ? 'bg-blue-600 text-white shadow-md'  // Active: Blue
                  : 'text-gray-500 hover:bg-gray-200/50'
                  }`}
              >
                {t('analytics.newest')}
              </button>
              <button
                onClick={() => setHistorySort('oldest')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${historySort === 'oldest'
                  ? 'bg-blue-600 text-white shadow-md' // Active: Blue
                  : 'text-gray-500 hover:bg-gray-300/50'
                  }`}
              >
                {t('analytics.oldest')}
              </button>
            </div>
          </div>

          {/* Table Header: Menambahkan Kolom Izin */}
          <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 text-center">
            <div className="col-span-1">No</div>
            <div className="col-span-4 text-left pl-2">{t('analytics.date')}</div>
            <div className="col-span-2">{t('analytics.checkIn')}</div>
            <div className="col-span-2">{t('analytics.checkOut')}</div>
            <div className="col-span-3">{t('analytics.leaveStatus')}</div> {/* Kolom Baru */}
          </div>

          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {historyLoading ? (
              <div className="py-8 text-center text-xs text-gray-400">Memuat data...</div>
            ) : sortedHistory.length > 0 ? (
              sortedHistory.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="grid grid-cols-12 gap-2 p-3 border-b border-gray-50 items-center hover:bg-gray-50/50 transition-colors text-center"
                >
                  {/* No */}
                  <div className="col-span-1 text-xs text-gray-500 font-medium">{index + 1}</div>

                  {/* Tanggal */}
                  <div className="col-span-4 text-left pl-2">
                    <p className="text-xs font-bold text-gray-800">{format(item.date, 'dd MMM yyyy', { locale: id })}</p>
                    <p className="text-[10px] text-gray-400">{format(item.date, 'EEEE', { locale: id })}</p>
                  </div>

                  {/* Jam Masuk */}
                  <div className="col-span-2 flex justify-center items-center">
                    {item.izin ? (
                      <span className="text-[10px] text-gray-300">-</span>
                    ) : item.masuk ? (
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">{item.masuk}</span>
                    ) : (
                      <span className="text-[10px] text-gray-300">--:--</span>
                    )}
                  </div>

                  {/* Jam Pulang */}
                  <div className="col-span-2 flex justify-center items-center">
                    {item.izin ? (
                      <span className="text-[10px] text-gray-300">-</span>
                    ) : item.pulang ? (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">{item.pulang}</span>
                    ) : (
                      <span className="text-[10px] text-gray-300">--:--</span>
                    )}
                  </div>

                  {/* Kolom Khusus Izin */}
                  <div className="col-span-3 flex justify-center items-center">
                    {item.izin ? (
                      <span className="bg-pink-100 text-pink-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-200">
                        IZIN / SAKIT
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-300">-</span>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-10 flex flex-col items-center justify-center text-gray-400">
                <img src={iconLoading} className="w-8 h-8 opacity-20 mb-2 grayscale" alt="" />
                <span className="text-xs">{t('analytics.noHistoryYet')}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;