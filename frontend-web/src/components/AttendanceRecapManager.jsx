import { useState, useEffect, useRef } from 'react';
import {
    Camera, Upload, Trash2, Edit2, Plus, X,
    MapPin, Calendar, Clock, User, Save, Image as ImageIcon,
    CheckCircle2, Search, Filter, ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { attendanceRecapAPI } from '../api/attendanceRecap';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const RT_FILTERS = ['Semua', 'RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06'];

const AttendanceRecapManager = () => {
    const [recaps, setRecaps] = useState([]);
    const [filteredRecaps, setFilteredRecaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null); // State for photo preview
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Refs
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const formRef = useRef(null);
    const rtRef = useRef(null); // Ref for RT filter dropdown
    const formRTRef = useRef(null); // Ref for Form RT dropdown
    const formTimeRef = useRef(null); // Ref for Form Time dropdown

    // Filters
    const [activeRTFilter, setActiveRTFilter] = useState('Semua');
    const [isRTOpen, setIsRTOpen] = useState(false); // Dropdown State (List)
    const [isFormRTOpen, setIsFormRTOpen] = useState(false); // Dropdown State (Form RT)
    const [isFormTimeOpen, setIsFormTimeOpen] = useState(false); // Dropdown State (Form Time)

    // Form State
    const [formData, setFormData] = useState({
        rt: 'RT 01',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '00:00',
        guards: '',
        photo: null
    });

    // Click Outside Handler for All Dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Main Filter Dropdown
            if (rtRef.current && !rtRef.current.contains(event.target)) {
                setIsRTOpen(false);
            }
            // Form RT Dropdown
            if (formRTRef.current && !formRTRef.current.contains(event.target)) {
                setIsFormRTOpen(false);
            }
            // Form Time Dropdown
            if (formTimeRef.current && !formTimeRef.current.contains(event.target)) {
                setIsFormTimeOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Initial Data Fetch
    useEffect(() => {
        fetchRecaps();
    }, []);

    // Filter Logic
    useEffect(() => {
        if (activeRTFilter === 'Semua') {
            setFilteredRecaps(recaps);
        } else {
            setFilteredRecaps(recaps.filter(item => item.rt === activeRTFilter));
        }
    }, [recaps, activeRTFilter]);

    const fetchRecaps = async () => {
        try {
            setLoading(true);
            const response = await attendanceRecapAPI.getAllRecaps({ limit: 50 }); // Fetch more for local filtering
            if (response.success) {
                setRecaps(response.data);
            }
        } catch (error) {
            console.error('Error fetching recaps:', error);
            toast.error('Gagal memuat daftar rekap');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Mohon upload file gambar');
                return;
            }
            setFormData(prev => ({ ...prev, photo: file }));

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.photo && !editingId) {
            toast.error('Foto bukti wajib diupload');
            return;
        }

        try {
            setIsSubmitting(true);
            const submitData = new FormData();
            submitData.append('rt', formData.rt);
            submitData.append('date', formData.date);
            submitData.append('time', formData.time);
            submitData.append('guards', formData.guards);

            if (formData.photo instanceof File) {
                submitData.append('photo', formData.photo);
            }

            let response;
            if (editingId) {
                response = await attendanceRecapAPI.updateRecap(editingId, submitData);
            } else {
                response = await attendanceRecapAPI.createRecap(submitData);
            }

            if (response.success) {
                toast.success(editingId ? 'Rekap berhasil diperbarui' : 'Rekap berhasil ditambahkan');
                fetchRecaps();
                resetForm();
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error(error.response?.data?.message || 'Gagal menyimpan rekap');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus rekap ini?')) return;

        try {
            const response = await attendanceRecapAPI.deleteRecap(id);
            if (response.success) {
                toast.success('Rekap berhasil dihapus');
                fetchRecaps();
            }
        } catch (error) {
            console.error('Error deleting recap:', error);
            toast.error('Gagal menghapus rekap');
        }
    };

    const handleEdit = (recap) => {
        setEditingId(recap._id);
        setFormData({
            rt: recap.rt,
            date: format(new Date(recap.date), 'yyyy-MM-dd'),
            time: recap.time,
            guards: recap.guards.join(', '),
            photo: recap.photo
        });

        // Check if photo is URL
        const apiBaseUrl = (import.meta.env.VITE_API_URL ||
            (window.location.hostname.includes('vercel.app')
                ? 'https://ukk-jagakampung.onrender.com/api'
                : 'http://localhost:5000/api')).replace('/api', '');

        let photoUrl = recap.photo;
        if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('data:')) {
            photoUrl = photoUrl.replace(/\\/g, '/');
            if (!photoUrl.startsWith('/')) {
                photoUrl = `/${photoUrl}`;
            }
            photoUrl = `${apiBaseUrl}${photoUrl}`;
        }
        setPhotoPreview(photoUrl);

        setShowForm(true);
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const resetForm = () => {
        setFormData({
            rt: 'RT 01',
            date: format(new Date(), 'yyyy-MM-dd'),
            time: format(new Date(), 'HH:mm'),
            guards: '',
            photo: null
        });
        setPhotoPreview(null);
        setEditingId(null);
        setShowForm(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header & Filter Section */}
            <div className="p-6 border-b border-gray-50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <ImageIcon className="text-blue-600" size={20} />
                            Manajemen Foto Rekap
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Upload dan kelola bukti foto kegiatan ronda malam.
                        </p>
                    </div>

                    {!showForm && (
                        <button
                            onClick={() => {
                                setShowForm(true);
                                setFormData(prev => ({ ...prev, time: format(new Date(), 'HH:mm'), date: format(new Date(), 'yyyy-MM-dd') }));
                                setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Plus size={16} />
                            Tambah Foto
                        </button>
                    )}
                </div>

                {/* RT Pills Filter (Original Design for List View) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <span className="text-xs font-medium text-gray-400 mr-1 flex items-center gap-1">
                        <Filter size={12} /> Filter RT:
                    </span>
                    {RT_FILTERS.map(rt => {
                        const isActive = activeRTFilter === rt;
                        return (
                            <button
                                key={rt}
                                onClick={() => setActiveRTFilter(rt)}
                                className={`
                                    relative px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                                    ${isActive ? 'text-blue-600 bg-blue-50 border border-blue-200 shadow-sm' : 'text-gray-500 hover:bg-gray-50 border border-transparent'}
                                `}
                            >
                                {rt}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeRxFilter"
                                        className="absolute inset-0 border border-blue-200 rounded-full"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Form Section */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        ref={formRef}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white border-b border-gray-100 relative shadow-sm"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-800 text-sm">
                                    {editingId ? 'Edit Data Rekap' : 'Upload Foto Baru'}
                                </h3>
                                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                                    {/* Left Column: Image Upload */}
                                    <div className="md:col-span-4 space-y-3">
                                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Foto Bukti</label>

                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`
                                                aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all relative overflow-hidden group
                                                ${photoPreview ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50 bg-white'}
                                            `}
                                        >
                                            {photoPreview ? (
                                                <>
                                                    <img src={photoPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white text-xs font-medium flex items-center gap-1">
                                                            <Edit2 size={12} /> Ganti Foto
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="p-4">
                                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center shadow-sm mx-auto mb-3 text-blue-500 group-hover:scale-110 transition-transform">
                                                        <Upload size={22} />
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-700">Klik untuk upload</p>
                                                    <p className="text-[11px] text-gray-400 mt-1">Format: JPG, PNG (Max 5MB)</p>
                                                </div>
                                            )}
                                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                        </div>

                                        {/* Mobile Camera Button */}
                                        <div className="md:hidden">
                                            <button
                                                type="button"
                                                onClick={() => cameraInputRef.current?.click()}
                                                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                                            >
                                                <Camera size={18} /> Ambil Foto Langsung
                                            </button>
                                            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                                        </div>
                                    </div>

                                    {/* Right Column: Inputs */}
                                    <div className="md:col-span-8 space-y-5">
                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-500">Lokasi RT</label>
                                                <div className={`relative ${isFormRTOpen ? 'z-50' : 'z-30'}`} ref={formRTRef}>
                                                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setIsFormRTOpen(!isFormRTOpen); setIsFormTimeOpen(false); }}
                                                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-left flex items-center justify-between focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all hover:border-gray-300 shadow-sm"
                                                    >
                                                        <span className="text-gray-700 font-medium">{formData.rt}</span>
                                                        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isFormRTOpen ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    <AnimatePresence>
                                                        {isFormRTOpen && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                                                transition={{ duration: 0.15 }}
                                                                className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden"
                                                            >
                                                                <div className="max-h-56 overflow-y-auto p-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                                                    {RT_FILTERS.filter(r => r !== 'Semua').map(rt => (
                                                                        <div
                                                                            key={rt}
                                                                            onClick={() => {
                                                                                setFormData(prev => ({ ...prev, rt }));
                                                                                setIsFormRTOpen(false);
                                                                            }}
                                                                            className={`
                                                                                px-3 py-2.5 text-sm cursor-pointer rounded-lg transition-colors flex items-center justify-between
                                                                                ${formData.rt === rt ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}
                                                                            `}
                                                                        >
                                                                            {rt}
                                                                            {formData.rt === rt && <CheckCircle2 size={14} />}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-500">Tanggal</label>
                                                <input
                                                    type="date"
                                                    name="date"
                                                    value={formData.date}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm text-gray-700"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-xs font-semibold text-gray-500">Jam Ronda</label>
                                                </div>
                                                <div className={`relative ${isFormTimeOpen ? 'z-50' : 'z-20'}`} ref={formTimeRef}>
                                                    <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setIsFormTimeOpen(!isFormTimeOpen); setIsFormRTOpen(false); }}
                                                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-left flex items-center justify-between focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all hover:border-gray-300 shadow-sm"
                                                    >
                                                        <span className="text-gray-700 font-medium">{formData.time} WIB</span>
                                                        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isFormTimeOpen ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    <AnimatePresence>
                                                        {isFormTimeOpen && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                                                transition={{ duration: 0.15 }}
                                                                className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden"
                                                            >
                                                                <div className="max-h-56 overflow-y-auto p-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                                                    {[
                                                                        "22:00", "22:30", "23:00", "23:30",
                                                                        "00:00", "00:30", "01:00", "01:30",
                                                                        "02:00", "02:30", "03:00"
                                                                    ].map(t => (
                                                                        <div
                                                                            key={t}
                                                                            onClick={() => {
                                                                                setFormData(prev => ({ ...prev, time: t }));
                                                                                setIsFormTimeOpen(false);
                                                                            }}
                                                                            className={`
                                                                                px-3 py-2.5 text-sm cursor-pointer rounded-lg transition-colors flex items-center justify-between
                                                                                ${formData.time === t ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}
                                                                            `}
                                                                        >
                                                                            {t} WIB
                                                                            {formData.time === t && <CheckCircle2 size={14} />}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-500">Petugas</label>
                                                <div className="relative">
                                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        name="guards"
                                                        value={formData.guards}
                                                        onChange={handleInputChange}
                                                        placeholder="Nama petugas..."
                                                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                                            <button
                                                type="button"
                                                onClick={resetForm}
                                                className="px-5 py-2.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-70 transition-all active:scale-95"
                                            >
                                                {isSubmitting ? 'Menyimpan...' : (
                                                    <>
                                                        <Save size={16} />
                                                        {editingId ? 'Simpan Perubahan' : 'Upload Sekarang'}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List and Table */}
            <div className="bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] uppercase text-gray-400 font-semibold tracking-wider">
                                <th className="px-6 py-3">Bukti Foto</th>
                                <th className="px-6 py-3">Waktu & Lokasi</th>
                                <th className="px-6 py-3">Daftar Petugas</th>
                                <th className="px-6 py-3 text-right">Opsi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-gray-400 text-sm">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span>Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRecaps.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                                <Search size={20} />
                                            </div>
                                            <p className="text-sm font-medium text-gray-600">Tidak ada data ditemukan</p>
                                            <p className="text-xs mt-1">Coba ubah filter atau tambah data baru.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRecaps.map((recap) => {
                                    const apiBaseUrl = (import.meta.env.VITE_API_URL ||
                                        (window.location.hostname.includes('vercel.app')
                                            ? 'https://ukk-jagakampung.onrender.com/api'
                                            : 'http://localhost:5000/api')).replace('/api', '');

                                    let photoUrl = recap.photo;
                                    if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('data:')) {
                                        // Normalize path separators
                                        photoUrl = photoUrl.replace(/\\/g, '/');
                                        // Ensure single leading slash
                                        if (!photoUrl.startsWith('/')) {
                                            photoUrl = `/${photoUrl}`;
                                        }
                                        photoUrl = `${apiBaseUrl}${photoUrl}`;
                                    }

                                    return (
                                        <motion.tr
                                            key={recap._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-blue-50/30 transition-colors group"
                                        >
                                            <td className="px-6 py-3">
                                                <div className="w-20 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-100 shadow-sm group-hover:shadow transition-all relative cursor-pointer" onClick={() => window.open(photoUrl, '_blank')}>
                                                    <img
                                                        src={photoUrl}
                                                        alt="Bukti"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                                            {recap.rt}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        {format(new Date(recap.date), 'dd MMM yyyy', { locale: id })} • <span className="text-gray-700">{recap.time}</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                                    {recap.guards.map((guard, idx) => (
                                                        <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-[10px] border border-gray-200">
                                                            {guard}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(recap)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(recap._id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AttendanceRecapManager;
