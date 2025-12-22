import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { schedulesAPI } from '../api/schedules';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Search, Calendar, Filter,
  ChevronDown, AlertTriangle, Check, X, Save, Edit2
} from 'lucide-react';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const MONTHS_OBJECT = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
];
const YEARS = [2024, 2025, 2026, 2027];
const RT_OPTIONS = ['01', '02', '03', '04', '05', '06'];

const Schedules = () => {
  // --- State Management ---
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedRT, setSelectedRT] = useState('01');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [searchQuery, setSearchQuery] = useState('');

  // Custom Dropdown States
  const [isRTOpen, setIsRTOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  const [currentSchedule, setCurrentSchedule] = useState(null);

  // Refs
  const rtRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  // --- INLINE EDITING STATES ---
  const [editingId, setEditingId] = useState(null); // ID baris yang sedang diedit
  const [isAddingNew, setIsAddingNew] = useState(false); // Status sedang menambah baris baru

  // State untuk menampung data form (baik untuk baris baru maupun edit)
  const [inlineForm, setInlineForm] = useState({
    guardName: '',
    fullDate: '',
    notes: '',
    email: ''
  });

  // Selection & Modal States
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false, type: null, ids: [], title: ''
  });

  // --- Effects ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rtRef.current && !rtRef.current.contains(event.target)) setIsRTOpen(false);
      if (monthRef.current && !monthRef.current.contains(event.target)) setIsMonthOpen(false);
      if (yearRef.current && !yearRef.current.contains(event.target)) setIsYearOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [selectedYear, selectedRT, selectedMonth]);

  useEffect(() => {
    filterSchedules();
    // Reset editing states when data changes
    setEditingId(null);
    setIsAddingNew(false);
    setSelectedIds([]);
  }, [schedules, searchQuery]);

  // --- Logic Functions ---
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await schedulesAPI.getAll({
        year: selectedYear,
        rt: selectedRT,
        month: selectedMonth
      });
      if (response.success && response.data.length > 0) {
        setCurrentSchedule(response.data[0]);
        setSchedules(response.data[0].entries || []);
      } else {
        await handleCreateSchedule();
      }
    } catch (error) {
      if (error.response?.status === 404) {
        await handleCreateSchedule();
      } else {
        toast.error('Gagal memuat jadwal');
        setSchedules([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterSchedules = () => {
    if (!searchQuery.trim()) {
      setFilteredSchedules(schedules);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = schedules.filter(entry =>
      entry.guardName?.toLowerCase().includes(query) ||
      entry.day?.toLowerCase().includes(query)
    );
    setFilteredSchedules(filtered);
  };

  const handleCreateSchedule = async () => {
    try {
      const response = await schedulesAPI.create({
        rt: selectedRT,
        month: selectedMonth,
        year: selectedYear,
      });
      if (response.success) {
        setCurrentSchedule(response.data);
        setSchedules([]);
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  // --- Helper: Get Day from Date String ---
  const getDayName = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return DAYS[date.getDay()];
  };

  const parseDateToEntry = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.getDate(),
      day: DAYS[date.getDay()],
      month: date.getMonth() + 1,
      year: date.getFullYear()
    };
  };

  // --- INLINE HANDLERS ---

  // 1. Start Adding New Row
  const startAdding = () => {
    setInlineForm({ guardName: '', fullDate: '', notes: '', email: '' });
    setIsAddingNew(true);
    setEditingId(null); // Cancel editing others
  };

  // 2. Start Editing Existing Row
  const startEditing = (entry) => {
    // Construct full date YYYY-MM-DD for input value
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(entry.date).padStart(2, '0')}`;

    setInlineForm({
      guardName: entry.guardName,
      fullDate: dateStr,
      notes: entry.notes || '',
      email: entry.email || ''
    });
    setEditingId(entry._id);
    setIsAddingNew(false); // Cancel adding new
  };

  // 3. Cancel Action
  const cancelAction = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setInlineForm({ guardName: '', fullDate: '', notes: '', email: '' });
  };

  // 4. Save New Entry
  const saveNewEntry = async () => {
    if (!currentSchedule) return toast.error('Jadwal error');
    if (!inlineForm.guardName || !inlineForm.fullDate) return toast.error('Nama & Tanggal wajib diisi');

    const dateInfo = parseDateToEntry(inlineForm.fullDate);
    if (dateInfo.month !== selectedMonth || dateInfo.year !== selectedYear) {
      return toast.error(`Tanggal harus bulan ${MONTHS[selectedMonth - 1]} ${selectedYear}`);
    }

    try {
      const response = await schedulesAPI.addEntry(currentSchedule._id, {
        guardName: inlineForm.guardName,
        date: dateInfo.date,
        day: dateInfo.day,
        notes: inlineForm.notes,
        email: inlineForm.email
      });

      if (response.success) {
        toast.success('Data tersimpan');
        cancelAction();
        fetchSchedules();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan');
    }
  };

  // 5. Update Existing Entry
  const updateEntry = async () => {
    if (!currentSchedule || !editingId) return;

    const dateInfo = parseDateToEntry(inlineForm.fullDate);
    if (dateInfo.month !== selectedMonth || dateInfo.year !== selectedYear) {
      return toast.error(`Tanggal harus bulan ${MONTHS[selectedMonth - 1]} ${selectedYear}`);
    }

    try {
      const response = await schedulesAPI.updateEntry(
        currentSchedule._id,
        editingId,
        {
          guardName: inlineForm.guardName,
          date: dateInfo.date,
          day: dateInfo.day,
          notes: inlineForm.notes,
          email: inlineForm.email
        }
      );

      if (response.success) {
        toast.success('Data diperbarui');
        cancelAction();
        fetchSchedules();
      }
    } catch (error) {
      toast.error('Gagal update data');
    }
  };

  // --- Selection Logic ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredSchedules.map(entry => entry._id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // --- Unified Delete Logic ---
  const openDeleteModal = (type, ids, title) => {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    setDeleteConfirmation({ isOpen: true, type, ids: idsArray, title });
  };

  const confirmDelete = async () => {
    const { type, ids } = deleteConfirmation;
    try {
      if (type === 'schedule') {
        await schedulesAPI.delete(currentSchedule._id);
        toast.success('Jadwal direset');
        setCurrentSchedule(null);
        setSelectedIds([]);
      } else {
        await Promise.all(ids.map(id => schedulesAPI.deleteEntry(currentSchedule._id, id)));
        toast.success(`${ids.length} data dihapus`);
        setSelectedIds([]);
      }
      fetchSchedules();
    } catch (error) {
      toast.error('Gagal menghapus');
    } finally {
      setDeleteConfirmation({ isOpen: false, type: null, ids: [], title: '' });
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="space-y-6 min-h-screen bg-gray-50/50 p-1 pb-20">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Jadwal Ronda</h1>
          <p className="text-gray-500 mt-1 text-sm">Kelola jadwal ronda dengan baik</p>
        </div>
      </div>

      {/* 2. Filter & Action Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Actions */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button
            onClick={startAdding}
            disabled={isAddingNew}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-roboto sans-serif font-medium rounded-lg transition-all shadow-sm ${isAddingNew ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
          >
            
             +Tambah jadwal
          </button>
          {currentSchedule && schedules.length > 0 && (
            <button
              onClick={() => openDeleteModal('schedule', null, `SEMUA Jadwal Bulan ${MONTHS_OBJECT.find(m => m.value === selectedMonth)?.label}`)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-roboto sans-serif font-medium rounded-lg hover:bg-red-700 active:scale-95 transition-all shadow-sm"
            >
              <Trash2 size={16} />
              Reset bulan ini
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* RT Filter */}
          <div className="relative flex-1 md:flex-none" ref={rtRef}>
            <button
              onClick={() => { setIsRTOpen(!isRTOpen); setIsMonthOpen(false); setIsYearOpen(false); }}
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors min-w-[120px]"
            >
              <span className="truncate">RT {selectedRT}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isRTOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isRTOpen && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {RT_OPTIONS.map(rt => (
                      <div key={rt} onClick={() => { setSelectedRT(rt); setIsRTOpen(false); }} className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 ${selectedRT === rt ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'}`}>RT {rt}</div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Month Filter */}
          <div className="relative flex-1 md:flex-none" ref={monthRef}>
            <button
              onClick={() => { setIsMonthOpen(!isMonthOpen); setIsRTOpen(false); setIsYearOpen(false); }}
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors min-w-[140px]"
            >
              <span className="truncate">{MONTHS_OBJECT.find(m => m.value === selectedMonth)?.label}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isMonthOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isMonthOpen && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {MONTHS_OBJECT.map(m => (
                      <div key={m.value} onClick={() => { setSelectedMonth(m.value); setIsMonthOpen(false); }} className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 ${selectedMonth === m.value ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'}`}>{m.label}</div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Year Filter */}
          <div className="relative flex-1 md:flex-none" ref={yearRef}>
            <button
              onClick={() => { setIsYearOpen(!isYearOpen); setIsRTOpen(false); setIsMonthOpen(false); }}
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors min-w-[100px]"
            >
              <span className="truncate">{selectedYear}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isYearOpen && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {YEARS.map(y => (
                      <div key={y} onClick={() => { setSelectedYear(y); setIsYearOpen(false); }} className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 ${selectedYear === y ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'}`}>{y}</div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search */}
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama..."
              className="pl-10 pr-10 py-2.5 w-full bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-500 transition-all shadow-sm text-sm min-w-[240px]"
            />
          </div>
        </div>
      </div>

      {/* 3. Data Table (Excel Style) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden relative min-h-[300px]">

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="absolute top-0 left-0 w-full bg-blue-50 z-20 px-6 py-2 border-b border-blue-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 h-[57px]">
            <div className="flex items-center gap-3">
              <span className="text-sm text-blue-800 font-semibold">{selectedIds.length} data dipilih</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openDeleteModal('bulk', selectedIds, `${selectedIds.length} data terpilih`)}
                className="px-4 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded hover:bg-red-200 flex items-center gap-2 transition-colors"
              >
                <Trash2 size={14} />
                Hapus Terpilih
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-4 py-1.5 bg-white border border-gray-300 text-gray-600 text-xs font-medium rounded hover:bg-gray-50"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 w-[50px]">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={filteredSchedules.length > 0 && selectedIds.length === filteredSchedules.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">No</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Nama Penjaga</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Email</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Tanggal</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Hari</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Catatan</th>
                <th className="px-4 py-4 text-center text-sm font-bold text-gray-700 w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">

              {/* --- NEW ROW INPUT (Excel Style) --- */}
              {isAddingNew && (
                <tr className="bg-blue-50/50">
                  <td className="px-6 py-4"></td>
                  <td className="px-4 py-4 text-sm text-blue-600 font-bold">Baru</td>

                  {/* Nama Input */}
                  <td className="px-4 py-2">
                    <input
                      autoFocus
                      type="text"
                      value={inlineForm.guardName}
                      onChange={(e) => setInlineForm({ ...inlineForm, guardName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ketik nama..."
                    />
                  </td>

                  {/* Email Input */}
                  <td className="px-4 py-2">
                    <input
                      type="email"
                      value={inlineForm.email}
                      onChange={(e) => setInlineForm({ ...inlineForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="user@email.com"
                    />
                  </td>

                  {/* Tanggal Input */}
                  <td className="px-4 py-2">
                    <input
                      type="date"
                      value={inlineForm.fullDate}
                      onChange={(e) => setInlineForm({ ...inlineForm, fullDate: e.target.value })}
                      min={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`}
                      max={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`}
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </td>

                  {/* Hari (Auto) */}
                  <td className="px-4 py-4 text-sm text-gray-500 font-medium">
                    {getDayName(inlineForm.fullDate)}
                  </td>

                  {/* Catatan Input */}
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={inlineForm.notes}
                      onChange={(e) => setInlineForm({ ...inlineForm, notes: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Keterangan..."
                    />
                  </td>

                  {/* Action Buttons */}
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={saveNewEntry} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700" title="Simpan">
                        <Check size={16} />
                      </button>
                      <button onClick={cancelAction} className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300" title="Batal">
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* --- EXISTING ROWS --- */}
              {filteredSchedules.length === 0 && !isAddingNew ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-gray-500 text-sm">
                    Belum ada data
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((entry, index) => {
                  const isSelected = selectedIds.includes(entry._id);
                  const isEditing = editingId === entry._id;

                  if (isEditing) {
                    // --- EDIT MODE ROW ---
                    return (
                      <tr key={entry._id} className="bg-yellow-50/50">
                        <td className="px-6 py-4"></td>
                        <td className="px-4 py-4 text-sm text-gray-500 font-medium">{index + 1}</td>

                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={inlineForm.guardName}
                            onChange={(e) => setInlineForm({ ...inlineForm, guardName: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-yellow-400 rounded-md text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                          />
                        </td>

                        {/* Email Input */}
                        <td className="px-4 py-2">
                          <input
                            type="email"
                            value={inlineForm.email}
                            onChange={(e) => setInlineForm({ ...inlineForm, email: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-yellow-400 rounded-md text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                            placeholder="user@email.com"
                          />
                        </td>

                        <td className="px-4 py-2">
                          <input
                            type="date"
                            value={inlineForm.fullDate}
                            onChange={(e) => setInlineForm({ ...inlineForm, fullDate: e.target.value })}
                            min={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`}
                            max={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`}
                            className="w-full px-3 py-2 bg-white border border-yellow-400 rounded-md text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                          />
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-500 font-medium">
                          {getDayName(inlineForm.fullDate)}
                        </td>

                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={inlineForm.notes}
                            onChange={(e) => setInlineForm({ ...inlineForm, notes: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-yellow-400 rounded-md text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                          />
                        </td>

                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={updateEntry} className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700" title="Simpan">
                              <Save size={16} />
                            </button>
                            <button onClick={cancelAction} className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300" title="Batal">
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // --- READ ONLY ROW ---
                  return (
                    <tr
                      key={entry._id}
                      className={`transition-colors hover:bg-gray-50 ${isSelected ? 'bg-blue-50/50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(entry._id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">{index + 1}</td>
                      <td className="px-4 py-4 text-sm text-gray-900 font-semibold">{entry.guardName}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{entry.email || '-'}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {entry.date} {MONTHS[selectedMonth - 1]} {selectedYear}
                      </td>
                      {/* Day Column Clean Style */}
                      <td className="px-4 py-4 text-sm font-medium text-gray-600">
                        {entry.day}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 max-w-[200px] truncate">{entry.notes || '-'}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => startEditing(entry)}
                            className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal('single', entry._id, entry.guardName)}
                            className="px-3 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredSchedules.length > 0 && (
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center text-xs text-gray-500">
            <span>Total: {filteredSchedules.length} data penjaga</span>
            <span> {MONTHS_OBJECT.find(m => m.value === selectedMonth)?.label} {selectedYear}</span>
          </div>
        )}
      </div>

      {/* --- DELETE CONFIRMATION MODAL ONLY (No Add/Edit Modal anymore) --- */}
      <Modal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, type: null, ids: [], title: '' })}
        title="Konfirmasi Hapus"
      >
        <div className="text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Yakin ingin menghapus?</h3>
          <p className="text-gray-500 text-sm mb-6">
            {deleteConfirmation.type === 'schedule'
              ? `Anda akan menghapus SELURUH jadwal bulan ${MONTHS[selectedMonth - 1]}.`
              : deleteConfirmation.ids.length > 1
                ? `Anda akan menghapus ${deleteConfirmation.ids.length} data terpilih.`
                : `Anda akan menghapus data penjaga ${deleteConfirmation.title}.`
            }
            <br />Tindakan ini tidak dapat dibatalkan.
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setDeleteConfirmation({ isOpen: false, type: null, ids: [], title: '' })}
              className="px-5 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={confirmDelete}
              className="px-5 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md transition-all"
            >
              Hapus
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Schedules;