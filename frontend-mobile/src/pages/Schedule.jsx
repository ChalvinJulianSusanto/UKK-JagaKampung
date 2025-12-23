import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, Search, Phone, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { schedulesAPI, notificationsAPI } from '../api';
import { Container } from '../components/layout';
import { Card, Select, Loading } from '../components/common';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import cardBg from '../assets/1...png';
import backIcon from '../assets/back.png';
import nextIcon from '../assets/next.png';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MaskedIcon = ({ src, color = '#FFFFFF', size = 20, alt = '' }) => {
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

const Schedule = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState(null);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [scrolled, setScrolled] = useState(false);

  const getSavedRT = () => {
    const savedRT = localStorage.getItem('selectedRT');
    return savedRT || user?.rt || '01';
  };

  const [selectedRT, setSelectedRT] = useState(getSavedRT());
  const [searchQuery, setSearchQuery] = useState('');
  const [showDefaultSubtitle, setShowDefaultSubtitle] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [unreadCount, setUnreadCount] = useState(0);
  // Helper to persist filter visibility
  const getSavedFilterState = () => {
    const saved = localStorage.getItem('scheduleShowFilters');
    return saved === null ? true : saved === 'true';
  };

  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
  const [showFilters, setShowFilters] = useState(getSavedFilterState()); // Toggle filter visibility

  // Persist filter visibility
  useEffect(() => {
    localStorage.setItem('scheduleShowFilters', showFilters);
  }, [showFilters]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Dropdown states
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isRTOpen, setIsRTOpen] = useState(false);
  const monthRef = useRef(null);
  const yearRef = useRef(null);
  const rtRef = useRef(null);

  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedRT', selectedRT);
  }, [selectedRT]);

  useEffect(() => {
    fetchSchedule();
    fetchUnreadCount();
  }, [selectedMonth, selectedYear, selectedRT]);

  useEffect(() => {
    filterEntries();
  }, [schedule, searchQuery, sortOrder]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowDefaultSubtitle(prev => !prev);
      setCurrentDate(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthRef.current && !monthRef.current.contains(event.target)) {
        setIsMonthOpen(false);
      }
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setIsYearOpen(false);
      }
      if (rtRef.current && !rtRef.current.contains(event.target)) {
        setIsRTOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const response = await schedulesAPI.getScheduleByMonth(
        selectedRT,
        selectedYear,
        selectedMonth
      );

      if (response.success && response.data) {
        setSchedule(response.data);
      } else {
        setSchedule(null);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const filterEntries = () => {
    if (!schedule?.entries) {
      setFilteredEntries([]);
      return;
    }

    let entries = [...schedule.entries];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(entry =>
        entry.guardName?.toLowerCase().includes(query) ||
        entry.notes?.toLowerCase().includes(query) ||
        entry.day?.toLowerCase().includes(query) ||
        entry.date?.toString().includes(query)
      );
    }

    // Apply sorting
    entries.sort((a, b) => {
      const dateA = a.date || 0;
      const dateB = b.date || 0;
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredEntries(entries);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: MONTHS[i],
  }));

  const yearOptions = Array.from({ length: 3 }, (_, i) => ({
    value: String(new Date().getFullYear() + i),
    label: String(new Date().getFullYear() + i),
  }));

  const rtOptions = Array.from({ length: 6 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: `RT ${String(i + 1).padStart(2, '0')}`,
  }));

  const AnimatedHeader = () => (
    <div
      className={`fixed top-0 left-0 right-0 safe-area-top z-[100] transition-all duration-500 ease-in-out ${scrolled
        ? 'bg-white/70 backdrop-blur-xl shadow-lg border-b border-white/30'
        : 'bg-slate-50 border-b border-transparent'
        }`}
    >
      <div className="px-5 py-5">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate text-slate-900 transition-colors">
              {t('schedule.title')}
            </h1>
            <div className="overflow-hidden" style={{ height: '20px' }}>
              <AnimatePresence mode="wait">
                {showDefaultSubtitle ? (
                  <motion.p
                    key="default"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="text-sm text-slate-500 truncate"
                  >
                    {t('schedule.allRT')}
                  </motion.p>
                ) : (
                  <motion.p
                    key="date"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="text-sm text-slate-500 truncate"
                  >
                    {format(currentDate, 'EEEE, dd MMMM yyyy', { locale: id })}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className={`relative p-2.5 rounded-xl transition-all duration-300 ${scrolled
              ? 'hover:bg-slate-100'
              : 'hover:bg-white/50'
              }`}
            onClick={() => navigate('/notifications')}
          >
            <Bell className="w-5 h-5 text-slate-600 transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-red-500 rounded-full px-1 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-20">
      <AnimatedHeader />

      <Container>
        {/* Filter Toggle Button */}
        <div className="mb-3 flex justify-end">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            {showFilters ? (
              <>
                <EyeOff className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">{t('schedule.filter')}</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">{t('schedule.filter')}</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Filters - Redesigned with clean modern look */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-5 overflow-visible relative"
              style={{ zIndex: 50 }}
            >
              {/* Month & Year Row */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Bulan Dropdown */}
                <div className="relative" ref={monthRef}>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    {t('schedule.month')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMonthOpen(!isMonthOpen);
                      setIsYearOpen(false);
                      setIsRTOpen(false);
                    }}
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left flex items-center justify-between hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-slate-800 font-medium">{MONTHS[selectedMonth - 1]}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isMonthOpen ? 'transform rotate-180' : ''}`}
                    />
                  </button>

                  {isMonthOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute w-full mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg"
                      style={{ zIndex: 150 }}
                    >
                      <div
                        style={{
                          maxHeight: '220px',
                          overflowY: 'auto',
                          overflowX: 'hidden'
                        }}
                        className="py-1"
                      >
                        {monthOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setSelectedMonth(Number(option.value));
                              setIsMonthOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors ${String(selectedMonth) === option.value
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-slate-700'
                              }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Tahun Dropdown */}
                <div className="relative" ref={yearRef}>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    {t('schedule.year')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsYearOpen(!isYearOpen);
                      setIsMonthOpen(false);
                      setIsRTOpen(false);
                    }}
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left flex items-center justify-between hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-slate-800 font-medium">{selectedYear}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isYearOpen ? 'transform rotate-180' : ''}`}
                    />
                  </button>

                  {isYearOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                      style={{ zIndex: 150 }}
                    >
                      <div className="overflow-y-auto py-1" style={{ maxHeight: '220px' }}>
                        {yearOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setSelectedYear(Number(option.value));
                              setIsYearOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors ${String(selectedYear) === option.value
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-slate-700'
                              }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* RT Dropdown - Full Width */}
              <div className="relative" ref={rtRef}>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  {t('schedule.rt')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsRTOpen(!isRTOpen);
                    setIsMonthOpen(false);
                    setIsYearOpen(false);
                  }}
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left flex items-center justify-between hover:bg-slate-100 transition-colors"
                >
                  <span className="text-slate-800 font-medium">RT {selectedRT}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isRTOpen ? 'transform rotate-180' : ''}`}
                  />
                </button>

                {isRTOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                    style={{ zIndex: 150 }}
                  >
                    <div className="overflow-y-auto py-1" style={{ maxHeight: '220px' }}>
                      {rtOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSelectedRT(option.value);
                            setIsRTOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors ${selectedRT === option.value
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-slate-700'
                            }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Search Bar */}
              {schedule?.entries?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('common.search') + ' nama, hari, tanggal...'}
                      className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none placeholder:text-slate-400 hover:bg-slate-100 transition-colors"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Schedule Display */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100"
          >
            <Loading size="lg" text={t('common.loading')} />
          </motion.div>
        ) : !schedule ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">{t('schedule.noSchedule')}</h3>
            <p className="text-sm text-slate-500">
              Jadwal ronda untuk {MONTHS[selectedMonth - 1]} {selectedYear} {t('schedule.scheduleNotAvailable')}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {/* Info Card with Sort Filter - Redesigned */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-2xl shadow-lg shadow-blue-500/20 p-5 text-white"
              style={{
                backgroundImage: `url(${cardBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Overlay untuk readability */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1976D2]/40 to-[#1565C0]/40"></div>

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold mb-1">
                      {t('schedule.scheduleFor')} {schedule.rt}
                    </h3>
                    <p className="text-sm text-white/80">
                      {MONTHS[schedule.month - 1]} {schedule.year}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold">
                      {schedule.entries?.length || 0}
                    </p>
                    <p className="text-xs text-white/80 mt-1">{t('schedule.totalGuards')}</p>
                  </div>
                </div>

                {/* Sort Filter */}
                <div className="flex items-center justify-between pt-3 border-t border-white/20">
                  <span className="text-xs text-white/80 font-medium">{t('schedule.sortBy')}</span>
                  <div className="flex bg-white/20 rounded-lg p-0.5 backdrop-blur-sm">
                    <button
                      onClick={() => setSortOrder('newest')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${sortOrder === 'newest'
                        ? 'bg-white text-primary shadow-md'
                        : 'text-white/80 hover:bg-white/10'
                        }`}
                    >
                      {t('schedule.newest')}
                    </button>
                    <button
                      onClick={() => setSortOrder('oldest')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${sortOrder === 'oldest'
                        ? 'bg-white text-primary shadow-md'
                        : 'text-white/80 hover:bg-white/10'
                        }`}
                    >
                      {t('schedule.oldest')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* DataTable Responsive */}
            {filteredEntries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center"
              >
                <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-sm text-slate-500">
                  {searchQuery ? t('common.noData') : t('schedule.noGuardsData')}
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
              >
                {/* Mobile DataTable */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">No</th>
                        <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t('schedule.name')}</th>
                        <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t('common.date')}</th>
                        <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t('schedule.day')}</th>
                        <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t('schedule.note')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedEntries.map((entry, index) => (
                        <motion.tr
                          key={entry._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-4 text-xs text-slate-500 font-medium">{index + 1}</td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-slate-900 text-sm">{entry.guardName}</div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700 whitespace-nowrap font-medium">
                            {entry.date} {MONTHS[selectedMonth - 1].substring(0, 3)}
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs font-semibold text-slate-900">
                              {entry.day}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {entry.notes ? (
                              <span className="text-xs text-slate-600">{entry.notes}</span>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer with Pagination */}
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-slate-500 font-medium">
                    {t('schedule.showing')} {paginatedEntries.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredEntries.length)} {t('schedule.from')} {filteredEntries.length} {t('schedule.guardsData')}
                  </p>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${currentPage === 1
                          ? 'bg-slate-50 border-slate-100 cursor-not-allowed'
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                          }`}
                      >
                        <MaskedIcon src={backIcon} size={16} color={currentPage === 1 ? '#cbd5e1' : '#64748b'} />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${currentPage === totalPages
                          ? 'bg-slate-50 border-slate-100 cursor-not-allowed'
                          : 'bg-white border-primary/20 hover:bg-blue-50 hover:border-primary/40 shadow-sm shadow-blue-500/10'
                          }`}
                      >
                        <MaskedIcon src={nextIcon} size={16} color={currentPage === totalPages ? '#cbd5e1' : '#0ea5e9'} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}


          </div>
        )}
      </Container>
    </div>
  );
};

export default Schedule;