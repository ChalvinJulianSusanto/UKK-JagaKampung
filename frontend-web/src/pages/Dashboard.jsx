import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronDown } from 'lucide-react';
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
      iconColor: '#7C3AED', // Violet
      bgColor: 'bg-violet-50',
    },
    {
      title: 'Total Hadir',
      value: stats?.totalAttendances || 0,
      icon: iconKehadiran,
      isImage: true,
      iconColor: '#10B981', // Emerald
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Menunggu Approval',
      value: stats?.pendingApprovals || 0,
      icon: iconPending,
      isImage: true,
      iconColor: '#F59E0B', // Amber
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Rate Kehadiran',
      value: `${attendanceRate}%`,
      icon: iconAnalisis,
      isImage: true,
      iconColor: '#EC4899', // Pink
      bgColor: 'bg-pink-50',
    },
  ];

  // Elegant color palette for charts
  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6'];

  // Custom label component for Bar Chart
  const CustomBarLabel = (props) => {
    const { x, y, width, value } = props;
    return (
      <text
        x={x + width / 2}
        y={y - 8}
        fill="#374151"
        textAnchor="middle"
        fontSize="13"
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
        <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
          <p className="text-sm font-bold text-neutral-dark mb-1">RT {payload[0].payload._id}</p>
          <p className="text-xs text-neutral">
            <span className="font-semibold text-emerald-600">{payload[0].value}</span> Warga Terdaftar
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
        <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
          <p className="text-sm font-bold text-neutral-dark mb-1">RT {payload[0].payload._id}</p>
          <p className="text-xs text-neutral mb-0.5">
            Total Kehadiran: <span className="font-semibold text-primary">{payload[0].value}</span>
          </p>
          <p className="text-xs text-neutral">
            Persentase: <span className="font-semibold text-purple-600">{percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for Pie Chart (shows percentage on slices)
  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for very small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13"
        fontWeight="700"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Minimalist Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-dark tracking-tight">Dashboard</h1>
          <p className="text-neutral text-sm mt-1">Overview sistem manajemen JagaKampung RW-01</p>

          {Object.keys(activeFilters).length > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              <AlertCircle size={14} />
              <span>{Object.keys(activeFilters).length} filter aktif</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center  justify-center p-2.5 text-sm font-medium rounded-xl transition-all shadow-sm bg-primary text-white hover:bg-primary-dark shadow-primary/25  disabled:cursor-not-allowed"
          >
            <img
              src={iconRefresh3}
              alt="Refresh"
              className={`w-4 h-4 brightness-0 invert ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all shadow-sm ${showFilters
                ? 'bg-gray-200 text-neutral-dark border border-gray-300'
                : 'bg-white border border-gray-200 text-neutral-dark hover:bg-gray-50 hover:border-gray-300'
              }`}
          >
            <img src={iconFilter} alt="Filter" className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-neutral-dark">Filter Data</h3>
            <button
              onClick={handleResetFilters}
              className="text-sm text-primary hover:text-primary-dark font-medium"
            >
              Reset Filter
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5" ref={rtRef}>
              <label className="text-xs font-semibold text-neutral uppercase tracking-wider">Wilayah RT</label>
              <div className="relative">
                <button
                  onClick={() => setIsRTOpen(!isRTOpen)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm flex items-center justify-between text-left"
                >
                  <span className="text-gray-700">{filters.rt ? `RT ${filters.rt}` : 'Semua RT'}</span>
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral uppercase tracking-wider">Dari Tanggal</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="bg-gray-50 border-gray-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral uppercase tracking-wider">Sampai Tanggal</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
                <button
                  onClick={handleApplyFilters}
                  className="px-6 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards - PROGRESS BAR DIHILANGKAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            // Padding tetap p-6 agar ukuran card tidak mengecil drastis
            className="bg-white p-7 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] transition-all duration-300 group flex flex-col justify-center"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral text-xs font-bold uppercase tracking-wider mb-1">
                  {stat.title}
                </p>
                <h3 className="text-3xl font-bold text-neutral-dark tracking-tight">
                  {stat.value}
                </h3>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                {stat.isImage ? (
                  <MaskedIcon src={stat.icon} color={stat.iconColor} size={24} />
                ) : (
                  <stat.icon color={stat.iconColor} size={24} />
                )}
              </div>
            </div>
            {/* Progress Bar Dihapus dari sini */}
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by RT Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
              <MaskedIcon src={iconGroup} color="#6B7280" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-dark">Warga Terdaftar</h3>
              <p className="text-xs text-neutral">Distribusi per RT</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {stats?.usersByRT && stats.usersByRT.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.usersByRT} margin={{ top: 30, right: 20, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#14B8A6" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="_id"
                    tick={{ fontSize: 13, fill: '#6B7280', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickFormatter={(value) => `RT ${value}`}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                    label={{ value: '', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280', fontWeight: 500 } }}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="square"
                    formatter={() => <span className="text-sm text-neutral-dark font-medium">Jumlah Warga Terdaftar</span>}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#barGradient)"
                    radius={[8, 8, 0, 0]}
                    barSize={50}
                    label={<CustomBarLabel />}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-neutral-light">
                <img src={iconChart} alt="No Data" className="w-16 h-16 opacity-20 mb-2 grayscale" />
                <p className="text-sm">Belum ada data</p>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
              <MaskedIcon src={iconChart} color="#6B7280" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-dark">Perbandingan Kehadiran</h3>
              <p className="text-xs text-neutral">Kontribusi per RT</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {stats?.attendanceByRT && stats.attendanceByRT.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.attendanceByRT}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="total"
                    label={<CustomPieLabel />}
                    labelLine={false}
                  >
                    {stats.attendanceByRT.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        strokeWidth={2}
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
                        <span className="text-xs text-neutral-dark font-medium">
                          RT {entry.payload._id} ({percentage}%)
                        </span>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-neutral-light">
                <img src={iconChart} alt="No Data" className="w-16 h-16 opacity-20 mb-2 grayscale" />
                <p className="text-sm">Belum ada data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <MaskedIcon src={iconCheck} color="#10B981" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-dark">Aktivitas Terbaru</h3>
              <p className="text-xs text-neutral">5 kehadiran terakhir</p>
            </div>
          </div>
          {stats?.recentAttendances?.length > 0 && (
            <Badge variant="success" className="px-3">
              {stats.recentAttendances.length} Data
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          {stats?.recentAttendances && stats.recentAttendances.length > 0 ? (
            stats.recentAttendances.slice(0, 5).map((attendance, index) => (
              <div
                key={index}
                className="group flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
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
                    <div className={`w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg ${attendance.user?.photo ? 'hidden' : 'flex'}`}>
                      {attendance.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-neutral-dark group-hover:text-primary transition-colors">
                      {attendance.user?.name || 'Unknown User'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium px-2 py-0.5 bg-white border border-gray-200 rounded text-neutral-dark">
                        RT {attendance.rt}
                      </span>
                      <span className="text-xs text-neutral">
                        {new Date(attendance.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <Badge variant={attendance.status === 'hadir' ? 'success' : 'error'}>
                  {attendance.status === 'hadir' ? 'Hadir' : 'Tidak Hadir'}
                </Badge>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-neutral-light">
              <p>Belum ada aktivitas terbaru</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;