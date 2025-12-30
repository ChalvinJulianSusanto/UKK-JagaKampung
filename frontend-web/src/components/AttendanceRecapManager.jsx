import { useState, useEffect, useRef } from 'react';
import {
    Camera, Upload, Trash2, Edit2, Plus, X,
    MapPin, Calendar, Clock, User, Save, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { attendanceRecapAPI } from '../api/attendanceRecap';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const AttendanceRecapManager = () => {
    const [recaps, setRecaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        rt: 'RT 01',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        guards: '',
        photo: null
    });
    const [photoPreview, setPhotoPreview] = useState(null);

    // Refs
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    // Initial Data Fetch
    useEffect(() => {
        fetchRecaps();
    }, []);

    const fetchRecaps = async () => {
        try {
            setLoading(true);
            const response = await attendanceRecapAPI.getAllRecaps({ limit: 10 });
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
            submitData.append('guards', formData.guards); // String comma separated

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
            photo: recap.photo // URL string
        });

        // Check if photo is URL
        const apiBaseUrl = import.meta.env.VITE_API_URL
            ? import.meta.env.VITE_API_URL.replace('/api', '')
            : 'http://localhost:5000';

        let photoUrl = recap.photo;
        if (photoUrl && photoUrl.startsWith('/') && !photoUrl.startsWith('http')) {
            photoUrl = `${apiBaseUrl}${photoUrl}`;
        }
        setPhotoPreview(photoUrl);

        setShowForm(true);
        // Scroll to form
        document.getElementById('recap-form')?.scrollIntoView({ behavior: 'smooth' });
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <ImageIcon className="text-blue-600" size={24} />
                        Manajemen Rekap Kehadiran
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Kelola foto bukti dan data kehadiran ronda malam per RT.
                    </p>
                </div>

                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Tambah Rekap
                    </button>
                )}
            </div>

            {/* Form Section */}
            {showForm && (
                <div id="recap-form" className="bg-gray-50 rounded-xl p-5 mb-8 border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                        <h3 className="font-bold text-gray-800">
                            {editingId ? 'Edit Rekap Kehadiran' : 'Tambah Rekap Baru'}
                        </h3>
                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Grid Layout for Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* RT Selection */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">RT / Lokasi</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <select
                                        name="rt"
                                        value={formData.rt}
                                        onChange={handleInputChange}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    >
                                        {['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06'].map(rt => (
                                            <option key={rt} value={rt}>{rt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Date Input */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">Tanggal</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>

                            {/* Time Input */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">Waktu</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="time"
                                        name="time"
                                        value={formData.time}
                                        onChange={handleInputChange}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>

                            {/* Guards Input */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">Petugas Jaga</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        name="guards"
                                        value={formData.guards}
                                        onChange={handleInputChange}
                                        placeholder="Contoh: Ahmad, Budi, Cecep"
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 ml-1">Pisahkan nama dengan koma (,)</p>
                            </div>
                        </div>

                        {/* Photo Upload Section */}
                        <div className="mt-4">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">Foto Bukti</label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Upload Buttons */}
                                <div className="space-y-3">
                                    {/* File Upload (Desktop/Mobile) */}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors bg-white h-32"
                                    >
                                        <Upload className="text-gray-400 mb-2" size={24} />
                                        <span className="text-xs font-medium text-gray-600">Upload File Gambar</span>
                                        <span className="text-[10px] text-gray-400 mt-1">JPG, PNG (Max 5MB)</span>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </div>

                                    {/* Camera Upload (Mobile Only - using capture attribute) */}
                                    <div className="md:hidden">
                                        <div
                                            onClick={() => cameraInputRef.current?.click()}
                                            className="bg-blue-600 text-white rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer active:bg-blue-700 shadow-sm"
                                        >
                                            <Camera size={18} />
                                            <span className="text-sm font-medium">Ambil Foto Langsung</span>
                                        </div>
                                        <input
                                            ref={cameraInputRef}
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </div>
                                </div>

                                {/* Preview Area */}
                                <div className="bg-white border border-gray-200 rounded-xl p-2 h-48 flex items-center justify-center overflow-hidden relative">
                                    {photoPreview ? (
                                        <>
                                            <img
                                                src={photoPreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPhotoPreview(null);
                                                    setFormData(prev => ({ ...prev, photo: null }));
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                    if (cameraInputRef.current) cameraInputRef.current.value = '';
                                                }}
                                                className="absolute top-3 right-3 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600"
                                            >
                                                <X size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <ImageIcon className="mx-auto mb-2 opacity-50" size={32} />
                                            <span className="text-xs">Belum ada foto</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                disabled={isSubmitting}
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        {editingId ? 'Simpan Perubahan' : 'Simpan Rekap'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Recap List Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                            <th className="px-4 py-3">Bukti</th>
                            <th className="px-4 py-3">Lokasi & Waktu</th>
                            <th className="px-4 py-3">Petugas</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-gray-500 text-sm">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : recaps.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-gray-500 text-sm">
                                    Belum ada data rekap kehadiran.
                                </td>
                            </tr>
                        ) : (
                            recaps.map((recap) => {
                                const apiBaseUrl = import.meta.env.VITE_API_URL
                                    ? import.meta.env.VITE_API_URL.replace('/api', '')
                                    : 'http://localhost:5000';

                                let photoUrl = recap.photo;
                                if (photoUrl && photoUrl.startsWith('/') && !photoUrl.startsWith('http')) {
                                    photoUrl = `${apiBaseUrl}${photoUrl}`;
                                }

                                return (
                                    <tr key={recap._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                                                <img
                                                    src={photoUrl}
                                                    alt="Bukti"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800 text-sm">{recap.rt}</span>
                                                <span className="text-xs text-gray-500">
                                                    {format(new Date(recap.date), 'dd MMM yyyy', { locale: id })} • {recap.time}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {recap.guards.slice(0, 2).map((guard, idx) => (
                                                    <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-medium border border-blue-100">
                                                        {guard}
                                                    </span>
                                                ))}
                                                {recap.guards.length > 2 && (
                                                    <span className="text-xs text-gray-400 self-center">+{recap.guards.length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(recap)}
                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(recap._id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={16} />
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
        </div>
    );
};

export default AttendanceRecapManager;
