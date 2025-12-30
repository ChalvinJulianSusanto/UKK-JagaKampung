import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { dashboardAPI } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading';
import { TrendingUp, Users, Calendar, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, setISOWeek, setYear, startOfISOWeek, endOfISOWeek } from 'date-fns';
import { id } from 'date-fns/locale';
import AttendanceRecapManager from '../components/AttendanceRecapManager';

// --- HELPER: FORMAT TANGGAL (RENTANG PENUH) ---
// Output: "17 - 23 Nov"
const getWeekRangeLabel = (weekNum, year) => {
  if (!weekNum) return '';
  const currentYear = year || new Date().getFullYear();

  const dateInWeek = setISOWeek(setYear(new Date(), currentYear), weekNum);
  const start = startOfISOWeek(dateInWeek);
  const end = endOfISOWeek(dateInWeek);

  const startStr = format(start, 'dd', { locale: id });
  const endStr = format(end, 'dd MMM', { locale: id });

  // Jika bulan sama: "17 - 23 Nov"
  if (format(start, 'MMM') === format(end, 'MMM')) {
    return `${startStr} - ${endStr}`;
  }
  // Jika beda bulan: "29 Sep - 05 Okt"
  return `${format(start, 'dd MMM')} - ${endStr}`;
};

// --- HELPER: CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl text-sm z-50">
        <p className="font-bold text-gray-800 mb-3 pb-2 border-b border-gray-50">
          {label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-gray-500 text-xs capitalize">{entry.name}</span>
            </div>
            <span className="font-bold text-gray-900">
              {entry.value} <span className="text-[10px] font-normal text-gray-400">kali</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- HELPER: KPI CARD ---
const KPICard = ({ title, value, subtitle, icon: Icon, colorBg, colorText }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${colorBg}`}>
        <Icon size={22} className={colorText} />
      </div>
      {subtitle && (
        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
          <TrendingUp size={12} />
          {subtitle}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm font-medium text-gray-500">{title}</p>
    </div>
  </div>
);

const Analytics = () => {
  const { isAdmin } = useAuth();
  const [rawWeeklyData, setRawWeeklyData] = useState([]);
  const [rawMonthlyData, setRawMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchAnalytics();

    // Polling data setiap 5 detik untuk efek realtime
    const intervalId = setInterval(() => {
      fetchAnalytics(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isAdmin]);

  const fetchAnalytics = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [weekly, monthly] = await Promise.all([
        isAdmin ? dashboardAPI.getWeeklyStats() : dashboardAPI.getUserWeeklyStats(),
        isAdmin ? dashboardAPI.getMonthlyStats() : dashboardAPI.getUserMonthlyStats(),
      ]);

      if (weekly.success) setRawWeeklyData(weekly.data);
      if (monthly.success) setRawMonthlyData(monthly.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Don't show toast on background sync failure to avoid annoyance
      if (!isBackground) toast.error("Gagal memuat data analisis");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // --- 1. DATA MINGGUAN (Perbaikan Label & Duplikasi) ---
  const weeklyChartData = useMemo(() => {
    // Map untuk menggabungkan data jika ada minggu yang sama
    const weeksMap = new Map();

    rawWeeklyData.forEach(item => {
      const weekNum = item._id.week;
      const year = item._id.year || currentYear;
      const key = `${year}-${weekNum}`;

      if (!weeksMap.has(key)) {
        weeksMap.set(key, {
          year,
          weekNum,
          label: getWeekRangeLabel(weekNum, year), // Label: "17 - 23 Nov"
          total: 0,
          hadir: 0,
          absen: 0
        });
      }

      const entry = weeksMap.get(key);
      entry.total += (item.count || item.total || 0);
      entry.hadir += (item.hadir || 0);
      entry.absen += (item.tidak_hadir || 0);
    });

    // Konversi ke array dan urutkan berdasarkan minggu
    return Array.from(weeksMap.values()).sort((a, b) => a.weekNum - b.weekNum);
  }, [rawWeeklyData, currentYear]);

  // --- 2. DATA BULANAN (Perbaikan "November Ganda") ---
  const monthlyChartData = useMemo(() => {
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const aggregatedData = monthNames.map(name => ({ name, total: 0, hadir: 0, absen: 0 }));

    rawMonthlyData.forEach(item => {
      const monthIndex = item._id.month - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        aggregatedData[monthIndex].total += (item.count || item.total || 0);
        aggregatedData[monthIndex].hadir += (item.hadir || 0);
        aggregatedData[monthIndex].absen += (item.tidak_hadir || 0);
      }
    });

    // Filter hanya bulan yang ada datanya
    return aggregatedData.filter(d => d.total > 0);
  }, [rawMonthlyData]);


  // --- 3. KPI VALUES ---
  const totalMonthlyAttendance = rawMonthlyData.reduce((acc, curr) => acc + (curr.count || curr.total || 0), 0);
  const avgWeeklyAttendance = rawWeeklyData.length > 0
    ? Math.round(rawWeeklyData.reduce((acc, curr) => acc + (curr.count || curr.total || 0), 0) / rawWeeklyData.length)
    : 0;

  const peakMonth = monthlyChartData.reduce((prev, current) => (prev.total > current.total) ? prev : current, { name: '-', total: 0 });

  if (loading) return <Loading fullScreen />;

  return (
    <div className="space-y-8 pb-10">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Analisis Data</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAdmin ? 'Statistik lengkap kehadiran seluruh warga.' : 'Statistik kehadiran pribadi Anda.'}
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Total Kehadiran (Semester Ini)"
          value={totalMonthlyAttendance}
          icon={Users} colorBg="bg-blue-50" colorText="text-blue-600"
          subtitle="Akumulasi"
        />
        <KPICard
          title="Rata-rata per Pekan"
          value={avgWeeklyAttendance}
          icon={Activity} colorBg="bg-purple-50" colorText="text-purple-600"
        />
        <KPICard
          title={`Puncak (${peakMonth.name})`}
          value={peakMonth.total}
          icon={TrendingUp} colorBg="bg-orange-50" colorText="text-orange-600"
          subtitle="Tertinggi"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* CHART 1: TREN MINGGUAN */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600"><Activity size={16} /></div>
              <h3 className="text-lg font-bold text-gray-900">Tren Mingguan</h3>
            </div>
            <p className="text-xs text-gray-500 ml-8">Grafik kehadiran per pekan dengan rentang tanggal.</p>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />

                {/* SUMBU X: Label Rentang (17 - 23 Nov) */}
                <XAxis
                  dataKey="label"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  dy={10}
                  padding={{ left: 30, right: 30 }}
                  interval={0}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#CBD5E1', strokeDasharray: '3 3' }} />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 500 }} iconType="circle" />

                {isAdmin ? (
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Warga Hadir"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    dot={{ r: 4, fill: '#3B82F6', stroke: 'white', strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                ) : (
                  <>
                    <Area type="monotone" dataKey="hadir" name="Saya Hadir" stroke="#10B981" fill="url(#colorHadir)" strokeWidth={3} />
                    <Area type="monotone" dataKey="absen" name="Saya Absen" stroke="#EF4444" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* CHART 2: STATISTIK BULANAN */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-orange-100 rounded-lg text-orange-600"><Calendar size={16} /></div>
              <h3 className="text-lg font-bold text-gray-900">Statistik Bulanan</h3>
            </div>
            <p className="text-xs text-gray-500 ml-8">Perbandingan total kehadiran antar bulan.</p>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  dy={10}
                  tickFormatter={(val) => val.substring(0, 3)}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 500 }} iconType="circle" />

                {isAdmin ? (
                  <Bar
                    dataKey="total"
                    name="Total Kehadiran"
                    fill="#F59E0B"
                    radius={[8, 8, 0, 0]}
                  />
                ) : (
                  <>
                    <Bar dataKey="hadir" name="Hadir" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absen" name="Absen" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* REKAP KEHADIRAN MANAGER (ADMIN ONLY) */}
      {isAdmin && <AttendanceRecapManager />}
    </div>
  );
};

export default Analytics;