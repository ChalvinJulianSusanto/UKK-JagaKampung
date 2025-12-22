import { useState, useEffect, useRef, useMemo } from 'react';
import {
   CheckCircle, XCircle, Eye, Check, X, Calendar,
   Trash2, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { attendancesAPI } from '../api/attendances';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import Pagination from '../components/common/Pagination';
import toast from 'react-hot-toast';

// --- ASSETS IMPORTS ---
import iconTotal from '../assets/okeee.png';
import iconMasuk from '../assets/login.png';
import iconPulang from '../assets/logout.png';
import iconIzin from '../assets/loading.png';
import filterIcon from '../assets/filter.png';

const MONTHS = [
   { value: '', label: 'Semua Bulan' },
   { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
   { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
   { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
   { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
];

const YEARS = ['', 2024, 2025, 2026, 2027];

// --- HELPER COMPONENTS ---

const MaskedIcon = ({ src, color = '#FFFFFF', size = 24, className = '' }) => {
   return (
      <div
         className={className}
         style={{
            width: size,
            height: size,
            backgroundColor: color,
            maskImage: `url(${src})`,
            WebkitMaskImage: `url(${src})`,
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
         }}
      />
   );
};

const getTypeLabel = (type) => {
   const typeMap = { masuk: 'Masuk', pulang: 'Pulang', izin: 'Izin' };
   if (!type) return 'Hadir';
   return typeMap[type.toLowerCase()] || type;
};

const getTypeColorClass = (type) => {
   const t = type?.toLowerCase();
   switch (t) {
      case 'masuk': return 'bg-green-100 text-green-700 border-green-200';
      case 'pulang': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'izin': return 'bg-pink-100 text-pink-600 border-pink-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
   }
};

const getApprovalInfo = (approved) => {
   if (approved === true) {
      return { label: 'Disetujui', className: 'text-green-600 bg-green-50 border-green-100' };
   } else if (approved === false) {
      return { label: 'Ditolak', className: 'text-red-600 bg-red-50 border-red-100' };
   } else {
      return { label: 'Pending', className: 'text-yellow-600 bg-yellow-50 border-yellow-100' };
   }
};

// --- MAIN COMPONENT ---

const Attendances = () => {
   const [attendances, setAttendances] = useState([]);
   const [apiStats, setApiStats] = useState(null);
   const [loading, setLoading] = useState(true);
   const [tableLoading, setTableLoading] = useState(false);

   // Filter States
   const [filterRT, setFilterRT] = useState('');
   const [filterStatus, setFilterStatus] = useState('');
   const [filterApproval, setFilterApproval] = useState('');
   const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
   const [filterYear, setFilterYear] = useState(new Date().getFullYear());

   // Custom Dropdown Open States
   const [isMonthOpen, setIsMonthOpen] = useState(false);
   const [isYearOpen, setIsYearOpen] = useState(false);
   const [isRTOpen, setIsRTOpen] = useState(false);
   const [isStatusOpen, setIsStatusOpen] = useState(false);
   const [isApprovalOpen, setIsApprovalOpen] = useState(false);

   // Refs
   const monthRef = useRef(null);
   const yearRef = useRef(null);
   const rtRef = useRef(null);
   const statusRef = useRef(null);
   const approvalRef = useRef(null);

   // Selection & Actions
   const [selectedAttendance, setSelectedAttendance] = useState(null);
   const [selectedAttendances, setSelectedAttendances] = useState([]);
   const [showModal, setShowModal] = useState(false);
   const [currentPage, setCurrentPage] = useState(1);
   const [itemsPerPage] = useState(20);

   // Delete States
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [deleteTarget, setDeleteTarget] = useState(null);
   const [deleting, setDeleting] = useState(false);
   const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

   // Click Outside Handler
   useEffect(() => {
      const handleClickOutside = (event) => {
         if (monthRef.current && !monthRef.current.contains(event.target)) setIsMonthOpen(false);
         if (yearRef.current && !yearRef.current.contains(event.target)) setIsYearOpen(false);
         if (rtRef.current && !rtRef.current.contains(event.target)) setIsRTOpen(false);
         if (statusRef.current && !statusRef.current.contains(event.target)) setIsStatusOpen(false);
         if (approvalRef.current && !approvalRef.current.contains(event.target)) setIsApprovalOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   useEffect(() => {
      fetchData();
   }, [filterRT, filterMonth, filterYear]);

   useEffect(() => {
      setSelectedAttendances([]);
   }, [attendances]);

   const fetchData = async () => {
      setLoading(true);
      setTableLoading(true);
      try {
         const params = {};
         if (filterRT) params.rt = filterRT;
         // Only include month if not "Semua"
         if (filterMonth !== '') params.month = filterMonth;
         // Only include year if not "Semua"
         if (filterYear !== '') params.year = filterYear;

         const [statsRes, dataRes] = await Promise.all([
            attendancesAPI.getAll({ ...params }),
            attendancesAPI.getAll(params)
         ]);

         if (statsRes.success) setApiStats(statsRes.stats);
         if (dataRes.success) setAttendances(dataRes.data);

      } catch (error) {
         toast.error('Gagal memuat data');
      } finally {
         setLoading(false);
         setTableLoading(false);
      }
   };

   // --- ACTIONS ---

   const handleApprove = async (id, approved) => {
      try {
         const response = await attendancesAPI.approve(id, approved);
         if (response.success) {
            toast.success(`Kehadiran ${approved ? 'disetujui' : 'ditolak'}`);
            fetchData();
            setShowModal(false);
         }
      } catch (error) {
         toast.error('Gagal memperbarui kehadiran');
      }
   };

   const handleDelete = async () => {
      if (!deleteTarget) return;
      setDeleting(true);
      try {
         const response = await attendancesAPI.delete(deleteTarget._id);
         if (response.success) {
            toast.success('Kehadiran berhasil dihapus');
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
            fetchData();
            setShowModal(false);
         }
      } catch (error) {
         toast.error(error.response?.data?.message || 'Gagal menghapus kehadiran');
      } finally {
         setDeleting(false);
      }
   };

   const handleBulkApprove = async () => {
      if (selectedAttendances.length === 0) return;
      try {
         await Promise.all(selectedAttendances.map(id => attendancesAPI.approve(id, true)));
         toast.success(`${selectedAttendances.length} kehadiran disetujui`);
         setSelectedAttendances([]);
         fetchData();
      } catch (error) {
         toast.error('Gagal menyetujui beberapa kehadiran');
      }
   };

   const handleBulkReject = async () => {
      if (selectedAttendances.length === 0) return;
      try {
         await Promise.all(selectedAttendances.map(id => attendancesAPI.approve(id, false)));
         toast.success(`${selectedAttendances.length} kehadiran ditolak`);
         setSelectedAttendances([]);
         fetchData();
      } catch (error) {
         toast.error('Gagal menolak beberapa kehadiran');
      }
   };

   const handleBulkDelete = async () => {
      if (selectedAttendances.length === 0) return;
      setDeleting(true);
      try {
         await Promise.all(selectedAttendances.map(id => attendancesAPI.delete(id)));
         toast.success(`${selectedAttendances.length} kehadiran berhasil dihapus`);
         setSelectedAttendances([]);
         setShowBulkDeleteConfirm(false);
         fetchData();
      } catch (error) {
         toast.error('Gagal menghapus beberapa kehadiran');
      } finally {
         setDeleting(false);
      }
   };

   // --- FILTERS & LOGIC ---

   const filteredAttendances = useMemo(() => {
      return attendances.filter(attendance => {
         if (filterApproval === 'pending' && (attendance.approved === true || attendance.approved === false)) return false;
         if (filterApproval === 'approved' && attendance.approved !== true) return false;
         if (filterApproval === 'rejected' && attendance.approved !== false) return false;

         if (filterStatus) {
            const type = attendance.type?.toLowerCase() || attendance.status?.toLowerCase() || '';
            if (type !== filterStatus.toLowerCase()) return false;
         }
         return true;
      });
   }, [attendances, filterApproval, filterStatus]);

   const finalStats = useMemo(() => {
      const total = attendances.length;
      const masukCount = attendances.filter(a => (a.type?.toLowerCase() === 'masuk' || a.status?.toLowerCase() === 'masuk')).length;
      const pulangCount = attendances.filter(a => (a.type?.toLowerCase() === 'pulang' || a.status?.toLowerCase() === 'pulang')).length;
      const izinCount = attendances.filter(a => (a.type?.toLowerCase() === 'izin' || a.status?.toLowerCase() === 'izin')).length;

      return {
         total: apiStats?.total > 0 ? apiStats.total : total,
         masuk: masukCount,
         pulang: pulangCount,
         izin: izinCount
      };
   }, [attendances, apiStats]);

   const totalPages = Math.ceil(filteredAttendances.length / itemsPerPage);
   const indexOfLastItem = currentPage * itemsPerPage;
   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
   const currentAttendances = filteredAttendances.slice(indexOfFirstItem, indexOfLastItem);

   const handleSelectAttendance = (id) => {
      setSelectedAttendances(prev =>
         prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
   };

   const handleSelectAll = () => {
      const currentPageIds = currentAttendances.map(a => a._id);
      const allSelected = currentPageIds.every(id => selectedAttendances.includes(id));
      if (allSelected) {
         setSelectedAttendances(prev => prev.filter(id => !currentPageIds.includes(id)));
      } else {
         setSelectedAttendances(prev => [...new Set([...prev, ...currentPageIds])]);
      }
   };

   const viewDetails = (attendance) => {
      setSelectedAttendance(attendance);
      setShowModal(true);
   };

   const openDeleteConfirm = (attendance) => {
      setDeleteTarget(attendance);
      setShowDeleteConfirm(true);
   };

   if (loading && !attendances.length) return <Loading fullScreen />;

   return (
      <div className="space-y-6 pb-40">
         {/* Page Header */}
         <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Monitoring Kehadiran</h1>
            <p className="text-gray-500 text-sm mt-1">Pantau aktivitas check-in dan check-out warga.</p>
         </div>

         {/* Stats Cards - COMPACT SIZE (Corrected) */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Card 1: Total */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Absensi</p>
                  <h3 className="text-3xl font-bold text-gray-900">{finalStats.total}</h3>
               </div>
               <div className="w-12 h-12  rounded-xl flex items-center justify-center">
                  <MaskedIcon src={iconTotal} color="#2563EB" size={30} />
               </div>
            </div>

            {/* Card 2: Masuk */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Masuk</p>
                  <h3 className="text-3xl font-bold text-gray-900">{finalStats.masuk}</h3>
               </div>
               <div className="w-12 h-12  rounded-xl flex items-center justify-center">
                  <MaskedIcon src={iconMasuk} color="#16A34A" size={30} />
               </div>
            </div>

            {/* Card 3: Pulang */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Pulang</p>
                  <h3 className="text-3xl font-bold text-gray-900">{finalStats.pulang}</h3>
               </div>
               <div className="w-12 h-12  rounded-xl flex items-center justify-center">
                  <MaskedIcon src={iconPulang} color="#EA580C" size={30} />
               </div>
            </div>

            {/* Card 4: Izin */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Izin</p>
                  <h3 className="text-3xl font-bold text-gray-900">{finalStats.izin}</h3>
               </div>
               <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                  <MaskedIcon src={iconIzin} color="#f33964ff" size={30} />
               </div>
            </div>
         </div>

         {/* Filter Bar - Custom Dropdown with Hidden Scrollbar */}
         <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between relative z-30">
            <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
               <div className="p-2 rounded-lg"><MaskedIcon src={filterIcon} color="#4B5563" size={18} /></div>
               <span>Filter Data</span>
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">

               {/* Filter Bulan */}
               <div className="relative flex-1 md:flex-none" ref={monthRef}>
                  <button
                     onClick={() => { setIsMonthOpen(!isMonthOpen); setIsYearOpen(false); setIsRTOpen(false); setIsStatusOpen(false); setIsApprovalOpen(false); }}
                     className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors min-w-[140px]"
                  >
                     <span className="truncate">
                        {filterMonth === '' ? 'Semua Bulan' : (MONTHS.find(m => m.value === filterMonth)?.label || 'Bulan')}
                     </span>
                     <ChevronDown size={14} className={`text-gray-400 transition-transform ${isMonthOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                     {isMonthOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                           {/* Scrollbar disembunyikan tapi tetap bisa discroll */}
                           <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                              {MONTHS.map(m => (
                                 <div key={m.value} onClick={() => { setFilterMonth(m.value); setIsMonthOpen(false); setCurrentPage(1); }} className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 ${filterMonth === m.value ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'}`}>{m.label}</div>
                              ))}
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>

               {/* Filter Tahun */}
               <div className="relative flex-1 md:flex-none" ref={yearRef}>
                  <button
                     onClick={() => { setIsYearOpen(!isYearOpen); setIsMonthOpen(false); setIsRTOpen(false); setIsStatusOpen(false); setIsApprovalOpen(false); }}
                     className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors min-w-[120px]"
                  >
                     <span>{filterYear === '' ? 'Semua Tahun' : filterYear}</span>
                     <ChevronDown size={14} className={`text-gray-400 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                     {isYearOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                           <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                              {YEARS.map(y => (
                                 <div key={y} onClick={() => { setFilterYear(y); setIsYearOpen(false); setCurrentPage(1); }} className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 ${filterYear === y ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'}`}>{y === '' ? 'Semua Tahun' : y}</div>
                              ))}
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>

               {/* Filter RT */}
               <div className="relative flex-1 md:flex-none" ref={rtRef}>
                  <button
                     onClick={() => { setIsRTOpen(!isRTOpen); setIsMonthOpen(false); setIsYearOpen(false); setIsStatusOpen(false); setIsApprovalOpen(false); }}
                     className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors min-w-[120px]"
                  >
                     <span>{filterRT ? `RT ${filterRT}` : 'Semua RT'}</span>
                     <ChevronDown size={14} className={`text-gray-400 transition-transform ${isRTOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                     {isRTOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                           <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                              <div onClick={() => { setFilterRT(''); setIsRTOpen(false); setCurrentPage(1); }} className="px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 text-gray-600">Semua RT</div>
                              {['01', '02', '03', '04', '05', '06'].map(rt => (
                                 <div key={rt} onClick={() => { setFilterRT(rt); setIsRTOpen(false); setCurrentPage(1); }} className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 ${filterRT === rt ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'}`}>RT {rt}</div>
                              ))}
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>

               {/* Filter Status */}
               <div className="relative flex-1 md:flex-none" ref={statusRef}>
                  <button
                     onClick={() => { setIsStatusOpen(!isStatusOpen); setIsMonthOpen(false); setIsYearOpen(false); setIsRTOpen(false); setIsApprovalOpen(false); }}
                     className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors min-w-[130px]"
                  >
                     <span className="capitalize">{filterStatus || 'Semua Tipe'}</span>
                     <ChevronDown size={14} className={`text-gray-400 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                     {isStatusOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                           <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                              <div onClick={() => { setFilterStatus(''); setIsStatusOpen(false); setCurrentPage(1); }} className="px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 text-gray-600">Semua Tipe</div>
                              {['masuk', 'pulang', 'izin'].map(s => (
                                 <div key={s} onClick={() => { setFilterStatus(s); setIsStatusOpen(false); setCurrentPage(1); }} className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 capitalize ${filterStatus === s ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'}`}>{s}</div>
                              ))}
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>

               {/* Filter Approval */}
               <div className="relative flex-1 md:flex-none" ref={approvalRef}>
                  <button
                     onClick={() => { setIsApprovalOpen(!isApprovalOpen); setIsMonthOpen(false); setIsYearOpen(false); setIsRTOpen(false); setIsStatusOpen(false); }}
                     className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors min-w-[150px]"
                  >
                     <span className="capitalize">{filterApproval || 'Semua Approval'}</span>
                     <ChevronDown size={14} className={`text-gray-400 transition-transform ${isApprovalOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                     {isApprovalOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                           <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                              <div onClick={() => { setFilterApproval(''); setIsApprovalOpen(false); setCurrentPage(1); }} className="px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 text-gray-600">Semua Approval</div>
                              <div onClick={() => { setFilterApproval('pending'); setIsApprovalOpen(false); setCurrentPage(1); }} className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 ${filterApproval === 'pending' ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'}`}>Pending</div>
                              <div onClick={() => { setFilterApproval('approved'); setIsApprovalOpen(false); setCurrentPage(1); }} className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 ${filterApproval === 'approved' ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'}`}>Disetujui</div>
                              <div onClick={() => { setFilterApproval('rejected'); setIsApprovalOpen(false); setCurrentPage(1); }} className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 ${filterApproval === 'rejected' ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'}`}>Ditolak</div>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </div>
         </div>

         {/* Bulk Action Bar */}
         {selectedAttendances.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
               <div className="flex items-center gap-3">
                  <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-md">
                     {selectedAttendances.length}
                  </span>
                  <span className="text-sm text-primary-dark font-medium"> Dipilih</span>
               </div>
               <div className="flex gap-2">
                  <button onClick={handleBulkApprove} className="px-3 py-1.5 bg-white text-green-600 border border-green-200 rounded-lg hover:bg-green-50 text-sm font-medium flex items-center gap-1">
                     <Check size={14} /> Setujui
                  </button>
                  <button onClick={handleBulkReject} className="px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-sm font-medium flex items-center gap-1">
                     <X size={14} /> Tolak
                  </button>
                  <button onClick={() => setShowBulkDeleteConfirm(true)} className="px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-1">
                     <Trash2 size={14} /> Hapus
                  </button>
               </div>
            </div>
         )}

         {/* Main Table */}
         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {tableLoading ? (
               <div className="py-20 text-center"><Loading /></div>
            ) : currentAttendances.length === 0 ? (
               <div className="text-center py-20 px-4">
                  <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Calendar className="text-gray-300" size={40} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Tidak ada data</h3>
                  <p className="text-gray-500 text-sm mt-1">Belum ada catatan kehadiran sesuai filter yang dipilih.</p>
               </div>
            ) : (
               <div className="overflow-x-auto">
                  <table className="w-full">
                     <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                           <th className="px-6 py-4 w-12 text-center">
                              <input
                                 type="checkbox"
                                 checked={currentAttendances.length > 0 && currentAttendances.every(a => selectedAttendances.includes(a._id))}
                                 onChange={handleSelectAll}
                                 className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary/20 cursor-pointer"
                              />
                           </th>
                           <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Warga</th>
                           <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lokasi</th>
                           <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
                           <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipe</th>
                           <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Approval</th>
                           <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {currentAttendances.map((attendance) => {
                           const approval = getApprovalInfo(attendance.approved);
                           return (
                              <tr key={attendance._id} className="group hover:bg-blue-50/20 transition-colors">
                                 <td className="px-6 py-4 text-center">
                                    <input
                                       type="checkbox"
                                       checked={selectedAttendances.includes(attendance._id)}
                                       onChange={() => handleSelectAttendance(attendance._id)}
                                       className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary/20 cursor-pointer"
                                    />
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200 overflow-hidden">
                                          {attendance.user?.photo ? (
                                             <img src={attendance.user.photo} alt={attendance.user.name} className="w-full h-full object-cover" />
                                          ) : (
                                             attendance.user?.name?.charAt(0).toUpperCase() || '?'
                                          )}
                                       </div>
                                       <span className="font-medium text-gray-900 text-sm">{attendance.user?.name || 'Unknown'}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                       RT {attendance.rt}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                       <span className="text-sm text-gray-900 font-medium">
                                          {new Date(attendance.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                       </span>
                                       <span className="text-xs text-gray-500">
                                          {new Date(attendance.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                       </span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeColorClass(attendance.type || attendance.status)}`}>
                                       {getTypeLabel(attendance.type || attendance.status)}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${approval.className}`}>
                                       {approval.label}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                       <button
                                          onClick={() => viewDetails(attendance)}
                                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                          title="Lihat Detail"
                                       >
                                          <Eye size={16} />
                                       </button>
                                       <button
                                          onClick={() => openDeleteConfirm(attendance)}
                                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Hapus"
                                       >
                                          <Trash2 size={16} />
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
            )}

            <div className="border-t border-gray-50 bg-gray-50/30">
               <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredAttendances.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
               />
            </div>
         </div>

         {/* Detail Modal */}
         <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Detail Kehadiran">
            {selectedAttendance && (
               <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                     <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                        {selectedAttendance.user?.photo ? (
                           <img src={selectedAttendance.user.photo} className="w-full h-full object-cover" alt="" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-xl">
                              {selectedAttendance.user?.name?.charAt(0)}
                           </div>
                        )}
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-gray-900">{selectedAttendance.user?.name}</h3>
                        <p className="text-gray-500 text-sm">RT {selectedAttendance.rt} • {new Date(selectedAttendance.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                     </div>
                  </div>

                  {selectedAttendance.photo && (
                     <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bukti Foto</label>
                        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                           <img src={selectedAttendance.photo} alt="Bukti" className="w-full h-auto max-h-[300px] object-contain" />
                        </div>
                     </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Tipe</p>
                        <p className="font-semibold text-gray-900 capitalize">{selectedAttendance.type || selectedAttendance.status}</p>
                     </div>
                     <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Jam</p>
                        <p className="font-semibold text-gray-900">{new Date(selectedAttendance.date).toLocaleTimeString('id-ID')} WIB</p>
                     </div>
                  </div>

                  {/* Card Alasan - Hanya tampil untuk tipe Izin */}
                  {(selectedAttendance.type?.toLowerCase() === 'izin' || selectedAttendance.status?.toLowerCase() === 'izin') && (
                     <div className="p-4 bg-white rounded-xl border border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Alasan Izin</p>
                        <p className="text-gray-900 text-sm leading-relaxed">
                           {selectedAttendance.reason || 'Tidak ada alasan yang dicantumkan'}
                        </p>
                     </div>
                  )}

                  <div className="flex gap-3 pt-2">
                     {selectedAttendance.approved !== true && (
                        <Button variant="success" fullWidth onClick={() => handleApprove(selectedAttendance._id, true)}>Setujui</Button>
                     )}
                     {selectedAttendance.approved !== false && (
                        <Button variant="danger" fullWidth onClick={() => handleApprove(selectedAttendance._id, false)}>Tolak</Button>
                     )}
                  </div>
               </div>
            )}
         </Modal>

         {/* Delete Modals */}
         <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Hapus Data" size="sm">
            <div className="space-y-4">
               <p className="text-gray-600">Yakin ingin menghapus data kehadiran ini?</p>
               <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Batal</Button>
                  <Button variant="danger" onClick={handleDelete} loading={deleting}>Hapus</Button>
               </div>
            </div>
         </Modal>

         <Modal isOpen={showBulkDeleteConfirm} onClose={() => setShowBulkDeleteConfirm(false)} title="Hapus Masal" size="sm">
            <div className="space-y-4">
               <p className="text-gray-600">Yakin ingin menghapus {selectedAttendances.length} data terpilih?</p>
               <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setShowBulkDeleteConfirm(false)}>Batal</Button>
                  <Button variant="danger" onClick={handleBulkDelete} loading={deleting}>Hapus Semua</Button>
               </div>
            </div>
         </Modal>

      </div>
   );
};

export default Attendances;