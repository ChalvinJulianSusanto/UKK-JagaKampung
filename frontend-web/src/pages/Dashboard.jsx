import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronDown, TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';
// Asset icons
import iconChart from '../assets/chart.png';
import iconGroup from '../assets/group.png';
import iconCheck from '../assets/check.png';
import iconWarga from '../assets/group.png';
import iconKehadiran from '../assets/kehadiran.png';
import iconPending from '../assets/pending.png';
import iconAnalisis from '../assets/analisis.png';
import iconRefresh from '../assets/refresh.png';
import iconRefresh3 from '../assets/refresh3.png';
import iconFilter from '../assets/filter.png';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardAPI } from '../api/dashboard';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import toast from 'react-hot-toast';

// Helper component: render PNG icon as a mask
const MaskedIcon = ({ src, color = '#1976D2', size = 24, alt = '' }) => {
  const style = {
    width: size,
    height: size,
    backgroundColor: color,
    WebkitMaskImage: `url(${src})`,
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskSize: 'contain',
    WebkitMaskPosition: 'center',
    maskImage: `url(${src})`,
    maskRepeat: 'no-repeat',
    maskSize: 'contain',
    maskPosition: 'center',
    display: 'inline-block',
    flex: '0 0 auto',
  };

  return <span role="img" aria-label={alt} style={style} />;
};

const RT_OPTIONS = ['01', '02', '03', '04', '05', '06'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    rt: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  // Custom Dropdown States
  const [isRTOpen, setIsRTOpen] = useState(false);

  // Refs
  const rtRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rtRef.current && !rtRef.current.contains(event.target)) setIsRTOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  // Auto-refresh every 2 minutes (smooth background update)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats(activeFilters);
    }, 120000); // 2 minutes = 120000ms
    return () => clearInterval(interval);
  }, [activeFilters]);

  const fetchStats = async (filterParams = {}) => {
    try {
      if (!stats) setLoading(true);

      const response = await dashboardAPI.getStats(filterParams);
      if (response.success) {
        setStats(response.data);
      } else {
        toast.error('Gagal memuat data dashboard');
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    const params = {};
    if (filters.rt) params.rt = filters.rt;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    setActiveFilters(params);
    fetchStats(params);
    toast.success('Filter berhasil diterapkan');
  };

  const handleResetFilters = () => {
    setFilters({ rt: '', startDate: '', endDate: '' });
    setActiveFilters({});
    fetchStats();
    toast.success('Filter direset');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats(activeFilters);
    setRefreshing(false);
    toast.success('Data diperbarui');
  };

  const attendanceRate = stats?.totalAttendances && stats?.totalSchedules
    ? ((stats.totalAttendances / (stats.totalSchedules * stats.totalUsers)) * 100).toFixed(1)
    : 0;

  if (loading) return <Loading fullScreen />;

  const statCards = [
    {
      title: 'Total Warga',
      value: stats?.totalUsers || 0,
      icon: iconWarga,
      isImage: true,
      iconColor: '#7C3AED',
      gradient: 'from-blue-500 to-blue-600',
      lightBg: 'bg-blue-50',
      darkBg: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Hadir',
      value: stats?.totalAttendances || 0,
      icon: iconKehadiran,
      isImage: true,
      iconColor: '#10B981',
      gradient: 'from-emerald-500 to-emerald-600',
      lightBg: 'bg-emerald-50',
      darkBg: 'bg-emerald-500',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Menunggu Approval',
      value: stats?.pendingApprovals || 0,
      icon: iconPending,
      isImage: true,
      iconColor: '#F59E0B',
      gradient: 'from-amber-500 to-amber-600',
      lightBg: 'bg-amber-50',
      darkBg: 'bg-amber-500',
      textColor: 'text-amber-600',
    },
    {
      title: 'Rate Kehadiran',
      value: `${attendanceRate}%`,
      icon: iconAnalisis,
      isImage: true,
      iconColor: '#EC4899',
      gradient: 'from-purple-500 to-purple-600',
      lightBg: 'bg-purple-50',
      darkBg: 'bg-purple-500',
      textColor: 'text-purple-600',
    },
  ];

  // Sophisticated color palette for charts
  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6'];

  // Custom label component for Bar Chart
  const CustomBarLabel = (props) => {
    const { x, y, width, value } = props;
    return (
      <text
        x={x + width / 2}
        y={y - 8}
        fill="#1F2937"
        textAnchor="middle"
        fontSize="12"
        fontWeight="600"
      >
        {value}
      </text>
    );
  };

  // Custom tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-xl border border-gray-100">
          <p className="text-sm font-semibold text-gray-900 mb-1">RT {payload[0].payload._id}</p>
          <p className="text-xs text-gray-600">
            <span className="font-medium text-blue-600">{payload[0].value}</span> Warga Terdaftar
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const total = stats?.attendanceByRT?.reduce((sum, item) => sum + item.total, 0) || 0;
      const percentage = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-xl border border-gray-100">
          <p className="text-sm font-semibold text-gray-900 mb-1">RT {payload[0].payload._id}</p>
          <p className="text-xs text-gray-600 mb-0.5">
            Total: <span className="font-medium text-blue-600">{payload[0].value}</span>
          </p>
          <p className="text-xs text-gray-600">
            Persentase: <span className="font-medium text-purple-600">{percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for Pie Chart
  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="12"
        fontWeight="700"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="space-y-6 pb-10">
        {/* Header Section - More Sophisticated */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">

                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Overview data absensi JagaKampung</p>
                </div>
              </div>

              {Object.keys(activeFilters).length > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100">
                  <AlertCircle size={14} />
                  <span>{Object.keys(activeFilters).length} filter aktif</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all disabled:cursor-not-allowed"
                title="Refresh Data"
              >
                <img
                  src={iconRefresh3}
                  alt="Refresh"
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                />
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 h-10 text-sm font-medium rounded-xl transition-all ${showFilters
                  ? 'bg-gray-100 text-gray-900 border border-gray-300'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <img
                  src={iconFilter}
                  alt="Filter"
                  className="w-4 h-4"
                />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 24 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">Filter Data</h3>
                  <button
                    onClick={handleResetFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Reset Filter
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2" ref={rtRef}>
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Wilayah RT</label>
                    <div className="relative">
                      <button
                        onClick={() => setIsRTOpen(!isRTOpen)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm flex items-center justify-between text-left hover:bg-gray-100"
                      >
                        <span className="text-gray-700">{filters.rt ? `RT ${filters.rt}` : 'Semua RT'}</span>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isRTOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {isRTOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
                          >
                            <div className="max-h-60 overflow-y-auto">
                              <div
                                onClick={() => { setFilters({ ...filters, rt: '' }); setIsRTOpen(false); }}
                                className="px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 text-gray-700 transition-colors"
                              >
                                Semua RT
                              </div>
                              {RT_OPTIONS.map(rt => (
                                <div
                                  key={rt}
                                  onClick={() => { setFilters({ ...filters, rt: rt }); setIsRTOpen(false); }}
                                  className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 transition-colors ${filters.rt === rt ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'
                                    }`}
                                >
                                  RT {rt}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Dari Tanggal</label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Sampai Tanggal</label>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                          className="bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors"
                        />
                      </div>
                      <button
                        onClick={handleApplyFilters}
                        className="px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30"
                      >
                        Terapkan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards - Modern Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden"
            >
              {/* Background Gradient Effect */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-full blur-2xl transform translate-x-8 -translate-y-8`}></div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    {stat.isImage ? (
                      <MaskedIcon src={stat.icon} color="#FFFFFF" size={24} />
                    ) : (
                      <stat.icon className="w-6 h-6 text-white" />
                    )}
                  </div>

                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    {stat.title}
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {stat.value}
                  </h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section - Professional Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Warga Terdaftar</h3>
                <p className="text-xs text-gray-500 mt-1">Distribusi per RT</p>
              </div>
              <div>

              </div>
            </div>

            <div className="h-[320px] w-full">
              {stats?.usersByRT && stats.usersByRT.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.usersByRT} margin={{ top: 30, right: 20, left: -10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis
                      dataKey="_id"
                      tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickFormatter={(value) => `RT ${value}`}
                      dy={10}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#6B7280' }}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#F3F4F6' }} />
                    <Bar
                      dataKey="count"
                      fill="url(#barGradient)"
                      radius={[10, 10, 0, 0]}
                      barSize={45}
                      label={<CustomBarLabel />}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <img src={iconChart} alt="No Data" className="w-16 h-16 opacity-20 mb-3 grayscale" />
                  <p className="text-sm">Data tidak tersedia</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Perbandingan Kehadiran</h3>
                <p className="text-xs text-gray-500 mt-1">Kontribusi per RT</p>
              </div>

            </div>

            <div className="h-[320px] w-full">
              {stats?.attendanceByRT && stats.attendanceByRT.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.attendanceByRT}
                      cx="50%"
                      cy="45%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="total"
                      label={<CustomPieLabel />}
                      labelLine={false}
                    >
                      {stats.attendanceByRT.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          strokeWidth={3}
                          stroke="#fff"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={50}
                      iconType="circle"
                      wrapperStyle={{ paddingTop: '10px' }}
                      formatter={(value, entry) => {
                        const total = stats.attendanceByRT.reduce((sum, item) => sum + item.total, 0);
                        const percentage = ((entry.payload.total / total) * 100).toFixed(1);
                        return (
                          <span className="text-xs text-gray-700 font-medium">
                            RT {entry.payload._id} ({percentage}%)
                          </span>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <img src={iconChart} alt="No Data" className="w-16 h-16 opacity-20 mb-3 grayscale" />
                  <p className="text-sm">Data tidak tersedia</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity - Refined Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">

              <div>
                <h3 className="text-lg font-bold text-gray-900">Aktivitas Terbaru</h3>
                <p className="text-xs text-gray-500 mt-0.5">5 kehadiran terakhir</p>
              </div>
            </div>
            {stats?.recentAttendances?.length > 0 && (
              <div className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-semibold border border-green-100">
                {stats.recentAttendances.length} Data
              </div>
            )}
          </div>

          <div className="space-y-3">
            {stats?.recentAttendances && stats.recentAttendances.length > 0 ? (
              stats.recentAttendances.slice(0, 5).map((attendance, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-sm shrink-0">
                      {attendance.user?.photo ? (
                        <img
                          src={attendance.user.photo.startsWith('http') ? attendance.user.photo : `http://localhost:5000${attendance.user.photo}`}
                          alt={attendance.user.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-base ${attendance.user?.photo ? 'hidden' : 'flex'}`}>
                        {attendance.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {attendance.user?.name || 'Unknown User'}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                          RT {attendance.rt}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(attendance.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`px-4 py-1.5 rounded-lg font-semibold text-xs ${attendance.status === 'hadir'
                    ? 'bg-green-50 text-green-700 border border-green-100'
                    : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    {attendance.status === 'hadir' ? 'Hadir' : 'Tidak Hadir'}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-16 text-center">
                <img src={iconCheck} alt="No Activity" className="w-12 h-12 mx-auto opacity-20 mb-3 grayscale" />
                <p className="text-sm text-gray-400">Belum ada aktivitas terbaru</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;