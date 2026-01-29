import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { incomeAPI } from '../api/income';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import Badge from '../components/common/Badge';
import ConfirmModal from '../components/common/ConfirmModal';
import toast from 'react-hot-toast';

// Import icons
import filterIcon from '../assets/filter.png';
import iconMoney from '../assets/money.png';

const INCOME_CATEGORIES = ['Iuran', 'Hibah Pemerintah', 'Donasi', 'Lainnya'];
const RT_OPTIONS = ['01', '02', '03', '04', '05', '06', 'RW-01'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);
const MONTHS = [
    { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' }, { value: '03', label: 'Maret' },
    { value: '04', label: 'April' }, { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' }, { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];

// MaskedIcon helper
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

const IncomeManagement = () => {
    const [loading, setLoading] = useState(false);
    const [incomeData, setIncomeData] = useState([]);
    const [incomeModal, setIncomeModal] = useState(false);
    const [editingIncome, setEditingIncome] = useState(null);
    const [incomeForm, setIncomeForm] = useState({
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        rt: '',
        year: CURRENT_YEAR,
        month: ''
    });

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

    // Filters
    const [filters, setFilters] = useState({ year: CURRENT_YEAR });

    // Dropdown states
    const [isYearOpen, setIsYearOpen] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isRTOpen, setIsRTOpen] = useState(false);
    const [isMonthOpen, setIsMonthOpen] = useState(false);

    // Refs
    const yearRef = useRef(null);
    const categoryRef = useRef(null);
    const rtRef = useRef(null);
    const monthRef = useRef(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (yearRef.current && !yearRef.current.contains(event.target)) setIsYearOpen(false);
            if (categoryRef.current && !categoryRef.current.contains(event.target)) setIsCategoryOpen(false);
            if (rtRef.current && !rtRef.current.contains(event.target)) setIsRTOpen(false);
            if (monthRef.current && !monthRef.current.contains(event.target)) setIsMonthOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchIncomeData();
    }, [filters]);

    const fetchIncomeData = async () => {
        try {
            setLoading(true);
            const response = await incomeAPI.getAll(filters);
            setIncomeData(response.data || []);
        } catch (error) {
            toast.error(error.message || 'Gagal memuat data pemasukan');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Parse amount
            const formData = {
                ...incomeForm,
                amount: parseFloat(parseNumber(incomeForm.amount))
            };

            if (editingIncome) {
                await incomeAPI.update(editingIncome._id, formData);
                toast.success('Data pemasukan berhasil diperbarui');
            } else {
                await incomeAPI.create(formData);
                toast.success('Data pemasukan berhasil ditambahkan');
            }
            setIncomeModal(false);
            resetForm();
            fetchIncomeData();
        } catch (error) {
            toast.error(error.message || 'Gagal menyimpan data pemasukan');
        }
    };

    const handleDelete = async () => {
        try {
            await incomeAPI.delete(deleteConfirm.id);
            toast.success('Data pemasukan berhasil dihapus');
            fetchIncomeData();
            setDeleteConfirm({ show: false, id: null });
        } catch (error) {
            toast.error(error.message || 'Gagal menghapus data pemasukan');
        }
    };

    const resetForm = () => {
        setIncomeForm({
            category: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            description: '',
            rt: '',
            year: CURRENT_YEAR,
            month: ''
        });
        setEditingIncome(null);
    };

    const openEditIncome = (income) => {
        setEditingIncome(income);
        setIncomeForm({
            category: income.category,
            amount: income.amount.toString(),
            date: new Date(income.date).toISOString().split('T')[0],
            description: income.description,
            rt: income.rt || '',
            year: income.year,
            month: income.month
        });
        setIncomeModal(true);
    };

    // Format number with thousand separator
    const formatNumber = (num) => {
        if (!num) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    // Parse formatted number to integer
    const parseNumber = (str) => {
        if (!str) return '';
        return str.toString().replace(/\./g, '');
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Calculate totals
    const totalIncome = incomeData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const incomeByCategory = INCOME_CATEGORIES.map(cat => ({
        category: cat,
        total: incomeData.filter(item => item.category === cat).reduce((sum, item) => sum + item.amount, 0),
        count: incomeData.filter(item => item.category === cat).length
    }));

    if (loading && incomeData.length === 0) {
        return <Loading fullScreen />;
    }

    const getCategoryColor = (category) => {
        const colors = {
            'Iuran': 'bg-blue-500',
            'Hibah Pemerintah': 'bg-emerald-500',
            'Donasi': 'bg-purple-500',
            'Lainnya': 'bg-amber-500'
        };
        return colors[category] || 'bg-gray-500';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="space-y-6 pb-10">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Kelola Pemasukan</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Manajemen data pemasukan RW 01</p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {incomeByCategory.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden"
                        >
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-xl ${getCategoryColor(item.category)} flex items-center justify-center shadow-lg`}>
                                        <MaskedIcon src={iconMoney} color="#FFFFFF" size={20} />
                                    </div>
                                    <div className="px-2 py-1 bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold">
                                        {item.count} data
                                    </div>
                                </div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                    {item.category}
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                                    {formatCurrency(item.total)}
                                </h3>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Filter Bar & Add Button */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                        <div className="p-2 rounded-lg">
                            <MaskedIcon src={filterIcon} color="#4B5563" size={18} />
                        </div>
                        <span>Filter Data</span>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                        {/* Year Filter */}
                        <div className="relative flex-1 md:flex-none" ref={yearRef}>
                            <button
                                onClick={() => setIsYearOpen(!isYearOpen)}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors min-w-[120px]"
                            >
                                <span>{filters.year}</span>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {isYearOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden"
                                    >
                                        <div className="max-h-60 overflow-y-auto">
                                            {YEARS.map(year => (
                                                <div
                                                    key={year}
                                                    onClick={() => {
                                                        setFilters({ ...filters, year });
                                                        setIsYearOpen(false);
                                                    }}
                                                    className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 ${filters.year === year ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'
                                                        }`}
                                                >
                                                    {year}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <Button
                            onClick={() => {
                                resetForm();
                                setIncomeModal(true);
                            }}
                            className="flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Tambah Pemasukan
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="py-20 text-center"><Loading /></div>
                    ) : incomeData.length === 0 ? (
                        <div className="text-center py-20 px-4">
                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DollarSign className="text-gray-300" size={40} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Belum ada data pemasukan</h3>
                            <p className="text-gray-500 text-sm mt-1">Tambahkan data pemasukan untuk memulai pencatatan</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jumlah</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Keterangan</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">RT</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {incomeData.map((income) => (
                                        <tr key={income._id} className="hover:bg-blue-50/20 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {new Date(income.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-white ${getCategoryColor(income.category)}`}>
                                                    {income.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-emerald-600">
                                                {formatCurrency(income.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                                {income.description}
                                            </td>
                                            <td className="px-6 py-4">
                                                {income.rt ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                        {income.rt === 'RW-01' ? 'RW 01' : `RT ${income.rt}`}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditIncome(income)}
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm({ show: true, id: income._id })}
                                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Income Modal */}
            <Modal
                isOpen={incomeModal}
                onClose={() => {
                    setIncomeModal(false);
                    resetForm();
                }}
                title={editingIncome ? 'Edit Data Pemasukan' : 'Tambah Data Pemasukan'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Category */}
                        <div ref={categoryRef}>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Kategori <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors"
                                >
                                    <span>{incomeForm.category || 'Pilih Kategori'}</span>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {isCategoryOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden"
                                        >
                                            <div className="max-h-60 overflow-y-auto">
                                                {INCOME_CATEGORIES.map(cat => (
                                                    <div
                                                        key={cat}
                                                        onClick={() => {
                                                            setIncomeForm({ ...incomeForm, category: cat });
                                                            setIsCategoryOpen(false);
                                                        }}
                                                        className="px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 text-gray-600"
                                                    >
                                                        {cat}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Jumlah (Rp) <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                value={formatNumber(incomeForm.amount)}
                                onChange={(e) => {
                                    const numValue = parseNumber(e.target.value);
                                    setIncomeForm({ ...incomeForm, amount: numValue });
                                }}
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Month */}
                        <div ref={monthRef}>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Bulan <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsMonthOpen(!isMonthOpen)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors"
                                >
                                    <span>{incomeForm.month ? MONTHS.find(m => m.value === incomeForm.month)?.label : 'Pilih Bulan'}</span>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isMonthOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {isMonthOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden"
                                        >
                                            <div className="max-h-60 overflow-y-auto">
                                                {MONTHS.map(month => (
                                                    <div
                                                        key={month.value}
                                                        onClick={() => {
                                                            setIncomeForm({ ...incomeForm, month: month.value });
                                                            setIsMonthOpen(false);
                                                        }}
                                                        className="px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 text-gray-600"
                                                    >
                                                        {month.label}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Year */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Tahun <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="number"
                                value={incomeForm.year}
                                onChange={(e) => setIncomeForm({ ...incomeForm, year: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Tanggal <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="date"
                            value={incomeForm.date}
                            onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                            required
                        />
                    </div>

                    {/* RT (Optional) */}
                    <div ref={rtRef}>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">RT (Opsional)</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsRTOpen(!isRTOpen)}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors"
                            >
                                <span>{incomeForm.rt ? (incomeForm.rt === 'RW-01' ? 'RW 01' : `RT ${incomeForm.rt}`) : 'Pilih RT (Opsional)'}</span>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isRTOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {isRTOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden"
                                    >
                                        <div className="max-h-60 overflow-y-auto">
                                            <div
                                                onClick={() => {
                                                    setIncomeForm({ ...incomeForm, rt: '' });
                                                    setIsRTOpen(false);
                                                }}
                                                className="px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 text-gray-600"
                                            >
                                                Tidak Ada
                                            </div>
                                            {RT_OPTIONS.map(rt => (
                                                <div
                                                    key={rt}
                                                    onClick={() => {
                                                        setIncomeForm({ ...incomeForm, rt });
                                                        setIsRTOpen(false);
                                                    }}
                                                    className="px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 text-gray-600"
                                                >
                                                    {rt === 'RW-01' ? 'RW 01' : `RT ${rt}`}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Keterangan <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={incomeForm.description}
                            onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            rows="3"
                            placeholder="Keterangan pemasukan..."
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setIncomeModal(false);
                                resetForm();
                            }}
                        >
                            Batal
                        </Button>
                        <Button type="submit">
                            {editingIncome ? 'Perbarui' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={deleteConfirm.show}
                onClose={() => setDeleteConfirm({ show: false, id: null })}
                onConfirm={handleDelete}
                title="Konfirmasi Hapus"
                message="Apakah Anda yakin ingin menghapus data pemasukan ini?"
                confirmText="Hapus"
                type="danger"
            />
        </div>
    );
};

export default IncomeManagement;
