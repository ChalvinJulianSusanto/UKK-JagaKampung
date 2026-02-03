import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, Calendar, DollarSign, FileText, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { iuranAPI, budgetAPI } from '../api/finance';
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
import excelIcon from '../assets/excel.png';
import pdfIcon from '../assets/pdf.png';
import { exportToExcel, exportToPDF } from '../utils/exportHelpers';

const RT_OPTIONS = ['01', '02', '03', '04', '05', '06'];
const RT_OPTIONS_WITH_RW = ['01', '02', '03', '04', '05', '06', 'RW-01'];
const BUDGET_CATEGORIES = ['Keamanan', 'Kebersihan', 'Infrastruktur', 'Sosial', 'Administrasi', 'Lainnya'];
const INCOME_CATEGORIES = ['Iuran', 'Hibah Pemerintah', 'Donasi', 'Lainnya'];
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

const FinanceManagement = () => {
    const [activeTab, setActiveTab] = useState('iuran');
    const [loading, setLoading] = useState(false);

    // Iuran state
    const [iuranData, setIuranData] = useState([]);
    const [iuranModal, setIuranModal] = useState(false);
    const [editingIuran, setEditingIuran] = useState(null);
    const [iuranForm, setIuranForm] = useState({
        month: '',
        year: CURRENT_YEAR,
        rt: '',
        targetAmount: '',
        collectedAmount: '',
        totalResidents: '',
        paidResidents: '',
        notes: '',
    });

    // Budget state
    const [budgetData, setBudgetData] = useState([]);
    const [budgetModal, setBudgetModal] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [budgetForm, setBudgetForm] = useState({
        year: CURRENT_YEAR,
        rt: '',
        category: '',
        allocatedAmount: '',
        spentAmount: '',
        description: '',
    });

    // Income state
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
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: '', id: null });

    // Filters with custom dropdowns
    const [iuranFilters, setIuranFilters] = useState({ year: CURRENT_YEAR });
    const [budgetFilters, setBudgetFilters] = useState({ year: CURRENT_YEAR });
    const [incomeFilters, setIncomeFilters] = useState({ year: CURRENT_YEAR });

    // Dropdown states
    const [isIuranYearOpen, setIsIuranYearOpen] = useState(false);
    const [isBudgetYearOpen, setIsBudgetYearOpen] = useState(false);
    const [isIncomeYearOpen, setIsIncomeYearOpen] = useState(false);
    const [isMonthOpen, setIsMonthOpen] = useState(false);
    const [isRTOpen, setIsRTOpen] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false); // Budget Category
    const [isIncomeCategoryOpen, setIsIncomeCategoryOpen] = useState(false); // Income Category

    // Custom Category States
    const [isBudgetCustom, setIsBudgetCustom] = useState(false);
    const [isIncomeCustom, setIsIncomeCustom] = useState(false);

    const [isIncomeRTOpen, setIsIncomeRTOpen] = useState(false);
    const [isIncomeMonthOpen, setIsIncomeMonthOpen] = useState(false);

    // Refs for click outside
    const iuranYearRef = useRef(null);
    const budgetYearRef = useRef(null);
    const incomeYearRef = useRef(null);
    const monthRef = useRef(null);
    const rtRef = useRef(null);
    const categoryRef = useRef(null);
    const incomeCategoryRef = useRef(null);
    const incomeRTRef = useRef(null);
    const incomeMonthRef = useRef(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (iuranYearRef.current && !iuranYearRef.current.contains(event.target)) setIsIuranYearOpen(false);
            if (budgetYearRef.current && !budgetYearRef.current.contains(event.target)) setIsBudgetYearOpen(false);
            if (incomeYearRef.current && !incomeYearRef.current.contains(event.target)) setIsIncomeYearOpen(false);
            if (monthRef.current && !monthRef.current.contains(event.target)) setIsMonthOpen(false);
            if (rtRef.current && !rtRef.current.contains(event.target)) setIsRTOpen(false);
            if (categoryRef.current && !categoryRef.current.contains(event.target)) setIsCategoryOpen(false);
            if (incomeCategoryRef.current && !incomeCategoryRef.current.contains(event.target)) setIsIncomeCategoryOpen(false);
            if (incomeRTRef.current && !incomeRTRef.current.contains(event.target)) setIsIncomeRTOpen(false);
            if (incomeMonthRef.current && !incomeMonthRef.current.contains(event.target)) setIsIncomeMonthOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (activeTab === 'iuran') {
            fetchIuranData();
        } else if (activeTab === 'anggaran') {
            fetchBudgetData();
        } else if (activeTab === 'pemasukan') {
            fetchIncomeData();
        }
    }, [activeTab, iuranFilters, budgetFilters, incomeFilters]);

    // Fetch Iuran data
    const fetchIuranData = async () => {
        try {
            setLoading(true);
            const response = await iuranAPI.getAll(iuranFilters);
            setIuranData(response.data || []);
        } catch (error) {
            toast.error(error.message || 'Gagal memuat data iuran');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Budget data
    const fetchBudgetData = async () => {
        try {
            setLoading(true);
            const response = await budgetAPI.getAll(budgetFilters);
            setBudgetData(response.data || []);
        } catch (error) {
            toast.error(error.message || 'Gagal memuat data anggaran');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Income data
    const fetchIncomeData = async () => {
        try {
            setLoading(true);
            const response = await incomeAPI.getAll(incomeFilters);
            setIncomeData(response.data || []);
        } catch (error) {
            toast.error(error.message || 'Gagal memuat data pemasukan');
        } finally {
            setLoading(false);
        }
    };

    // Handle Iuran form submit
    const handleIuranSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingIuran) {
                await iuranAPI.update(editingIuran._id, iuranForm);
                toast.success('Data iuran berhasil diperbarui');
            } else {
                await iuranAPI.create(iuranForm);
                toast.success('Data iuran berhasil ditambahkan');
            }
            setIuranModal(false);
            resetIuranForm();
            fetchIuranData();
        } catch (error) {
            toast.error(error.message || 'Gagal menyimpan data iuran');
        }
    };

    // Handle Budget form submit
    const handleBudgetSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBudget) {
                await budgetAPI.update(editingBudget._id, budgetForm);
                toast.success('Data anggaran berhasil diperbarui');
            } else {
                await budgetAPI.create(budgetForm);
                toast.success('Data anggaran berhasil ditambahkan');
            }
            setBudgetModal(false);
            resetBudgetForm();
            fetchBudgetData();
        } catch (error) {
            toast.error(error.message || 'Gagal menyimpan data anggaran');
        }
    };

    // Handle Income form submit
    const handleIncomeSubmit = async (e) => {
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
            resetIncomeForm();
            fetchIncomeData();
        } catch (error) {
            toast.error(error.message || 'Gagal menyimpan data pemasukan');
        }
    };

    // Handle delete
    const handleDelete = async () => {
        try {
            if (deleteConfirm.type === 'iuran') {
                await iuranAPI.delete(deleteConfirm.id);
                toast.success('Data iuran berhasil dihapus');
                fetchIuranData();
            } else if (deleteConfirm.type === 'anggaran') {
                await budgetAPI.delete(deleteConfirm.id);
                toast.success('Data anggaran berhasil dihapus');
                fetchBudgetData();
            } else if (deleteConfirm.type === 'pemasukan') {
                await incomeAPI.delete(deleteConfirm.id);
                toast.success('Data pemasukan berhasil dihapus');
                fetchIncomeData();
            }
            setDeleteConfirm({ show: false, type: '', id: null });
        } catch (error) {
            toast.error(error.message || 'Gagal menghapus data');
        }
    };

    // Reset forms
    const resetIuranForm = () => {
        setIuranForm({
            month: '',
            year: CURRENT_YEAR,
            rt: '',
            targetAmount: '',
            collectedAmount: '',
            totalResidents: '',
            paidResidents: '',
            notes: '',
        });
        setEditingIuran(null);
    };

    const resetBudgetForm = () => {
        setBudgetForm({
            year: CURRENT_YEAR,
            rt: '',
            category: '',
            allocatedAmount: '',
            spentAmount: '',
            description: '',
        });
        setEditingBudget(null);
        setIsBudgetCustom(false);
    };

    const resetIncomeForm = () => {
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
        setIsIncomeCustom(false);
    };

    // Open edit modal
    const openEditIuran = (iuran) => {
        setEditingIuran(iuran);
        setIuranForm({
            month: iuran.month,
            year: iuran.year,
            rt: iuran.rt,
            targetAmount: iuran.targetAmount,
            collectedAmount: iuran.collectedAmount,
            totalResidents: iuran.totalResidents,
            paidResidents: iuran.paidResidents,
            notes: iuran.notes || '',
        });
        setIuranModal(true);
    };

    const openEditBudget = (budget) => {
        setEditingBudget(budget);
        setBudgetForm({
            year: budget.year,
            rt: budget.rt,
            category: budget.category,
            allocatedAmount: budget.allocatedAmount,
            spentAmount: budget.spentAmount,
            description: budget.description || '',
        });

        // Check if category is custom
        const isStandard = BUDGET_CATEGORIES.slice(0, -1).includes(budget.category);
        setIsBudgetCustom(!isStandard);

        setBudgetModal(true);
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


        // Check if category is custom
        const isStandard = INCOME_CATEGORIES.slice(0, -1).includes(income.category);
        setIsIncomeCustom(!isStandard);

        setIncomeModal(true);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
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

    // Get month name
    const getMonthName = (monthStr) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    };

    // Export Handlers
    const handleExportIuran = (type) => {
        if (iuranData.length === 0) {
            toast.error('Tidak ada data iuran untuk diekspor');
            return;
        }

        const dataToExport = iuranData.map((item, index) => ({
            No: index + 1,
            Periode: getMonthName(item.month),
            RT: item.rt,
            Target: item.targetAmount,
            Terkumpul: item.collectedAmount,
            'Status Warga': `${item.paidResidents}/${item.totalResidents}`,
            Progress: `${((item.collectedAmount / item.targetAmount) * 100).toFixed(1)}%`
        }));

        if (type === 'excel') {
            exportToExcel(dataToExport, `Laporan_Iuran_${iuranFilters.year}`, 'Iuran Bulanan');
        } else {
            const totalTerkumpul = iuranData.reduce((sum, item) => sum + item.collectedAmount, 0);

            exportToPDF({
                title: 'Laporan Iuran Bulanan',
                subtitle: `Periode Tahun ${iuranFilters.year}`,
                headers: ['No', 'Periode', 'RT', 'Target', 'Terkumpul', 'Status Warga', 'Progress'],
                data: dataToExport.map(item => [
                    item.No,
                    item.Periode,
                    item.RT,
                    formatCurrency(item.Target),
                    formatCurrency(item.Terkumpul),
                    item['Status Warga'],
                    item.Progress
                ]),
                fileName: `Laporan_Iuran_${iuranFilters.year}`,
                summary: { label: 'Total Terkumpul', value: formatCurrency(totalTerkumpul) }
            });
        }
        toast.success(`Berhasil mengekspor Laporan Iuran (${type.toUpperCase()})`);
    };

    const handleExportBudget = (type) => {
        if (budgetData.length === 0) {
            toast.error('Tidak ada data anggaran untuk diekspor');
            return;
        }

        const dataToExport = budgetData.map((item, index) => {
            const usage = ((item.spentAmount / item.allocatedAmount) * 100).toFixed(1);
            const remaining = item.allocatedAmount - item.spentAmount;
            return {
                No: index + 1,
                Tahun: item.year,
                RT: item.rt === 'RW-01' ? 'RW 01' : `RT ${item.rt}`,
                Kategori: item.category,
                Alokasi: item.allocatedAmount,
                Terpakai: item.spentAmount,
                Sisa: remaining,
                Penggunaan: `${usage}%`
            };
        });

        if (type === 'excel') {
            exportToExcel(dataToExport, `Laporan_Anggaran_${budgetFilters.year}`, 'Anggaran');
        } else {
            const totalAlokasi = budgetData.reduce((sum, item) => sum + item.allocatedAmount, 0);
            const totalTerpakai = budgetData.reduce((sum, item) => sum + item.spentAmount, 0);

            exportToPDF({
                title: 'Laporan Anggaran',
                subtitle: `Periode Tahun ${budgetFilters.year}`,
                headers: ['No', 'Tahun', 'RT', 'Kategori', 'Alokasi', 'Terpakai', 'Sisa', 'Penggunaan'],
                data: dataToExport.map(item => [
                    item.No,
                    item.Tahun,
                    item.RT,
                    item.Kategori,
                    formatCurrency(item.Alokasi),
                    formatCurrency(item.Terpakai),
                    formatCurrency(item.Sisa),
                    item.Penggunaan
                ]),
                fileName: `Laporan_Anggaran_${budgetFilters.year}`,
                summary: { label: 'Total Terpakai', value: `${formatCurrency(totalTerpakai)} (dari ${formatCurrency(totalAlokasi)})` }
            });
        }
        toast.success(`Berhasil mengekspor Laporan Anggaran (${type.toUpperCase()})`);
    };

    if (loading && (iuranData.length === 0 && budgetData.length === 0)) {
        return <Loading fullScreen />;
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kelola Keuangan</h1>
                <p className="text-gray-500 text-sm mt-1">Manajemen data iuran dan anggaran RW 01</p>
            </div>

            {/* Modern Tab Navigation */}
            <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm inline-flex gap-2">
                <button
                    onClick={() => setActiveTab('iuran')}
                    className={`px-6 py-3 font-semibold text-sm rounded-xl transition-all ${activeTab === 'iuran'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    Iuran Bulanan
                </button>
                <button
                    onClick={() => setActiveTab('anggaran')}
                    className={`px-6 py-3 font-semibold text-sm rounded-xl transition-all ${activeTab === 'anggaran'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    Anggaran
                </button>
                <button
                    onClick={() => setActiveTab('pemasukan')}
                    className={`px-6 py-3 font-semibold text-sm rounded-xl transition-all ${activeTab === 'pemasukan'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    Pemasukan
                </button>
            </div>

            {/* Iuran Tab */}
            {activeTab === 'iuran' && (
                <div className="space-y-6">
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
                            <div className="relative flex-1 md:flex-none" ref={iuranYearRef}>
                                <button
                                    onClick={() => setIsIuranYearOpen(!isIuranYearOpen)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors min-w-[120px]"
                                >
                                    <span>{iuranFilters.year}</span>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isIuranYearOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {isIuranYearOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden"
                                        >
                                            <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                                {YEARS.map(year => (
                                                    <div
                                                        key={year}
                                                        onClick={() => {
                                                            setIuranFilters({ ...iuranFilters, year });
                                                            setIsIuranYearOpen(false);
                                                        }}
                                                        className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 ${iuranFilters.year === year ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'
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

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleExportIuran('excel')}
                                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm font-medium"
                                    title="Export Excel"
                                >
                                    <img src={excelIcon} alt="Excel" className="w-5 h-5 brightness-0 invert" />
                                    <span>Excel</span>
                                </button>
                                <button
                                    onClick={() => handleExportIuran('pdf')}
                                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm font-medium"
                                    title="Export PDF"
                                >
                                    <img src={pdfIcon} alt="PDF" className="w-5 h-5 brightness-0 invert" />
                                    <span>PDF</span>
                                </button>
                            </div>
                            <Button
                                onClick={() => {
                                    resetIuranForm();
                                    setIuranModal(true);
                                }}
                                className="flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Tambah Data Iuran
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading ? (
                            <div className="py-20 text-center"><Loading /></div>
                        ) : iuranData.length === 0 ? (
                            <div className="text-center py-20 px-4">
                                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Calendar className="text-gray-300" size={40} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Belum ada data iuran</h3>
                                <p className="text-gray-500 text-sm mt-1">Tambahkan data iuran untuk memulai pencatatan</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Periode</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">RT</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Terkumpul</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Warga</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {iuranData.map((iuran) => {
                                            const progress = ((iuran.collectedAmount / iuran.targetAmount) * 100).toFixed(1);
                                            return (
                                                <tr key={iuran._id} className="group hover:bg-blue-50/20 transition-colors">
                                                    <td className="px-6 py-4 text-sm text-gray-900">{getMonthName(iuran.month)}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                            RT {iuran.rt}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(iuran.targetAmount)}</td>
                                                    <td className="px-6 py-4 text-sm font-semibold text-emerald-600">
                                                        {formatCurrency(iuran.collectedAmount)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {iuran.paidResidents}/{iuran.totalResidents}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : progress >= 80 ? 'bg-blue-500' : 'bg-amber-500'
                                                                        }`}
                                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-semibold text-gray-900 min-w-[45px]">{progress}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => openEditIuran(iuran)}
                                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirm({ show: true, type: 'iuran', id: iuran._id })}
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
                    </div>
                </div>
            )}

            {/* Budget Tab */}
            {activeTab === 'anggaran' && (
                <div className="space-y-6">
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
                            <div className="relative flex-1 md:flex-none" ref={budgetYearRef}>
                                <button
                                    onClick={() => setIsBudgetYearOpen(!isBudgetYearOpen)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors min-w-[120px]"
                                >
                                    <span>{budgetFilters.year}</span>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isBudgetYearOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {isBudgetYearOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden"
                                        >
                                            <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                                {YEARS.map(year => (
                                                    <div
                                                        key={year}
                                                        onClick={() => {
                                                            setBudgetFilters({ ...budgetFilters, year });
                                                            setIsBudgetYearOpen(false);
                                                        }}
                                                        className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 ${budgetFilters.year === year ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'
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

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleExportBudget('excel')}
                                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm font-medium"
                                    title="Export Excel"
                                >
                                    <img src={excelIcon} alt="Excel" className="w-5 h-5 brightness-0 invert" />
                                    <span>Excel</span>
                                </button>
                                <button
                                    onClick={() => handleExportBudget('pdf')}
                                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm font-medium"
                                    title="Export PDF"
                                >
                                    <img src={pdfIcon} alt="PDF" className="w-5 h-5 brightness-0 invert" />
                                    <span>PDF</span>
                                </button>
                            </div>
                            <Button
                                onClick={() => {
                                    resetBudgetForm();
                                    setBudgetModal(true);
                                }}
                                className="flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Tambah Data Anggaran
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading ? (
                            <div className="py-20 text-center"><Loading /></div>
                        ) : budgetData.length === 0 ? (
                            <div className="text-center py-20 px-4">
                                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <DollarSign className="text-gray-300" size={40} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Belum ada data anggaran</h3>
                                <p className="text-gray-500 text-sm mt-1">Tambahkan data anggaran untuk memulai pencatatan</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tahun</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">RT</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Alokasi</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Terpakai</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sisa</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Penggunaan</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {budgetData.map((budget) => {
                                            const usage = ((budget.spentAmount / budget.allocatedAmount) * 100).toFixed(1);
                                            const remaining = budget.allocatedAmount - budget.spentAmount;
                                            return (
                                                <tr key={budget._id} className="group hover:bg-blue-50/20 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{budget.year}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                            {budget.rt === 'RW-01' ? 'RW 01' : `RT ${budget.rt}`}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="info">{budget.category}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(budget.allocatedAmount)}</td>
                                                    <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                                                        {formatCurrency(budget.spentAmount)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-semibold text-emerald-600">
                                                        {formatCurrency(remaining)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${usage >= 90 ? 'bg-red-500' : usage >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                                                                        }`}
                                                                    style={{ width: `${Math.min(usage, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-semibold text-gray-900 min-w-[45px]">{usage}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => openEditBudget(budget)}
                                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirm({ show: true, type: 'anggaran', id: budget._id })}
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
                    </div>
                </div>
            )}

            {/* Income/Pemasukan Tab */}
            {activeTab === 'pemasukan' && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {INCOME_CATEGORIES.map(category => {
                            const total = incomeData
                                .filter(item => item.category === category)
                                .reduce((sum, item) => sum + item.amount, 0);

                            const getCardStyle = (cat) => {
                                switch (cat) {
                                    case 'Iuran': return { bg: 'bg-blue-50', text: 'text-blue-600' };
                                    case 'Hibah Pemerintah': return { bg: 'bg-emerald-50', text: 'text-emerald-600' };
                                    case 'Donasi': return { bg: 'bg-purple-50', text: 'text-purple-600' };
                                    default: return { bg: 'bg-amber-50', text: 'text-amber-600' };
                                }
                            };

                            const styles = getCardStyle(category);

                            return (
                                <div key={category} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                                    <div>
                                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{category}</p>
                                        <h3 className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(total)}</h3>
                                    </div>


                                </div>
                            );
                        })}
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
                            <div className="relative flex-1 md:flex-none" ref={incomeYearRef}>
                                <button
                                    onClick={() => setIsIncomeYearOpen(!isIncomeYearOpen)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors min-w-[120px]"
                                >
                                    <span>{incomeFilters.year}</span>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isIncomeYearOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {isIncomeYearOpen && (
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
                                                            setIncomeFilters({ ...incomeFilters, year });
                                                            setIsIncomeYearOpen(false);
                                                        }}
                                                        className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 ${incomeFilters.year === year ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'
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
                                    resetIncomeForm();
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
                                        {incomeData.map((income) => {
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
                                                                onClick={() => setDeleteConfirm({ show: true, type: 'pemasukan', id: income._id })}
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
                    </div>
                </div>
            )}

            {/* Iuran Modal */}
            <Modal
                isOpen={iuranModal}
                onClose={() => {
                    setIuranModal(false);
                    resetIuranForm();
                }}
                title={editingIuran ? 'Edit Data Iuran' : 'Tambah Data Iuran'}
            >
                <form onSubmit={handleIuranSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Month - Custom Dropdown */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Bulan <span className="text-red-500">*</span>
                            </label>
                            <div className="relative" ref={monthRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsMonthOpen(!isMonthOpen)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors"
                                >
                                    <span>{iuranForm.month ? MONTHS.find(m => m.value === iuranForm.month.split('-')[1])?.label : 'Pilih Bulan'}</span>
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
                                            <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                                {MONTHS.map(month => (
                                                    <div
                                                        key={month.value}
                                                        onClick={() => {
                                                            setIuranForm({ ...iuranForm, month: `${iuranForm.year}-${month.value}` });
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
                                value={iuranForm.year}
                                onChange={(e) => setIuranForm({ ...iuranForm, year: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    {/* RT - Custom Dropdown */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            RT <span className="text-red-500">*</span>
                        </label>
                        <div className="relative" ref={rtRef}>
                            <button
                                type="button"
                                onClick={() => setIsRTOpen(!isRTOpen)}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors"
                            >
                                <span>{iuranForm.rt ? `RT ${iuranForm.rt}` : 'Pilih RT'}</span>
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
                                        <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                            {RT_OPTIONS.map(rt => (
                                                <div
                                                    key={rt}
                                                    onClick={() => {
                                                        setIuranForm({ ...iuranForm, rt });
                                                        setIsRTOpen(false);
                                                    }}
                                                    className="px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 text-gray-600"
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Target Iuran (Rp) <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                value={formatNumber(iuranForm.targetAmount)}
                                onChange={(e) => {
                                    const numValue = parseNumber(e.target.value);
                                    setIuranForm({ ...iuranForm, targetAmount: numValue });
                                }}
                                placeholder="0"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Terkumpul (Rp) <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                value={formatNumber(iuranForm.collectedAmount)}
                                onChange={(e) => {
                                    const numValue = parseNumber(e.target.value);
                                    setIuranForm({ ...iuranForm, collectedAmount: numValue });
                                }}
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Total Warga <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="number"
                                value={iuranForm.totalResidents}
                                onChange={(e) => setIuranForm({ ...iuranForm, totalResidents: e.target.value })}
                                placeholder="0"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Sudah Bayar <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="number"
                                value={iuranForm.paidResidents}
                                onChange={(e) => setIuranForm({ ...iuranForm, paidResidents: e.target.value })}
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Catatan (Opsional)</label>
                        <textarea
                            value={iuranForm.notes}
                            onChange={(e) => setIuranForm({ ...iuranForm, notes: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            rows="3"
                            placeholder="Catatan tambahan..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setIuranModal(false);
                                resetIuranForm();
                            }}
                        >
                            Batal
                        </Button>
                        <Button type="submit">
                            {editingIuran ? 'Perbarui' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Budget Modal */}
            <Modal
                isOpen={budgetModal}
                onClose={() => {
                    setBudgetModal(false);
                    resetBudgetForm();
                }}
                title={editingBudget ? 'Edit Data Anggaran' : 'Tambah Data Anggaran'}
            >
                <form onSubmit={handleBudgetSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Tahun <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="number"
                                value={budgetForm.year}
                                onChange={(e) => setBudgetForm({ ...budgetForm, year: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                        {/* RT - Custom Dropdown */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                RT <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsRTOpen(!isRTOpen)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors"
                                >
                                    <span>{budgetForm.rt ? (budgetForm.rt === 'RW-01' ? 'RW 01' : `RT ${budgetForm.rt}`) : 'Pilih RT'}</span>
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
                                            <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                                {RT_OPTIONS_WITH_RW.map(rt => (
                                                    <div
                                                        key={rt}
                                                        onClick={() => {
                                                            setBudgetForm({ ...budgetForm, rt });
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
                    </div>

                    {/* Category - Custom Dropdown */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Kategori <span className="text-red-500">*</span>
                        </label>
                        <div className="relative" ref={categoryRef}>
                            <button
                                type="button"
                                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors"
                            >
                                <span>{isBudgetCustom ? 'Lainnya' : (budgetForm.category || 'Pilih Kategori')}</span>
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
                                        <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                            {BUDGET_CATEGORIES.map(cat => (
                                                <div
                                                    key={cat}
                                                    onClick={() => {
                                                        if (cat === 'Lainnya') {
                                                            setIsBudgetCustom(true);
                                                            setBudgetForm({ ...budgetForm, category: '' });
                                                        } else {
                                                            setIsBudgetCustom(false);
                                                            setBudgetForm({ ...budgetForm, category: cat });
                                                        }
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
                        {isBudgetCustom && (
                            <div className="mt-2">
                                <Input
                                    type="text"
                                    value={budgetForm.category}
                                    onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                                    placeholder="Masukkan kategori lainnya..."
                                    required
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Alokasi Anggaran (Rp) <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                value={formatNumber(budgetForm.allocatedAmount)}
                                onChange={(e) => {
                                    const numValue = parseNumber(e.target.value);
                                    setBudgetForm({ ...budgetForm, allocatedAmount: numValue });
                                }}
                                placeholder="0"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Terpakai (Rp) <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                value={formatNumber(budgetForm.spentAmount)}
                                onChange={(e) => {
                                    const numValue = parseNumber(e.target.value);
                                    setBudgetForm({ ...budgetForm, spentAmount: numValue });
                                }}
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Deskripsi (Opsional)</label>
                        <textarea
                            value={budgetForm.description}
                            onChange={(e) => setBudgetForm({ ...budgetForm, description: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            rows="3"
                            placeholder="Deskripsi anggaran..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setBudgetModal(false);
                                resetBudgetForm();
                            }}
                        >
                            Batal
                        </Button>
                        <Button type="submit">
                            {editingBudget ? 'Perbarui' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Income Modal */}
            <Modal
                isOpen={incomeModal}
                onClose={() => {
                    setIncomeModal(false);
                    resetIncomeForm();
                }}
                title={editingIncome ? 'Edit Data Pemasukan' : 'Tambah Data Pemasukan'}
            >
                <form onSubmit={handleIncomeSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Category */}
                        <div ref={incomeCategoryRef}>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Kategori <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsIncomeCategoryOpen(!isIncomeCategoryOpen)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors"
                                >
                                    <span>{isIncomeCustom ? 'Lainnya' : (incomeForm.category || 'Pilih Kategori')}</span>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isIncomeCategoryOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {isIncomeCategoryOpen && (
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
                                                            if (cat === 'Lainnya') {
                                                                setIsIncomeCustom(true);
                                                                setIncomeForm({ ...incomeForm, category: '' });
                                                            } else {
                                                                setIsIncomeCustom(false);
                                                                setIncomeForm({ ...incomeForm, category: cat });
                                                            }
                                                            setIsIncomeCategoryOpen(false);
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
                            {isIncomeCustom && (
                                <div className="mt-2">
                                    <Input
                                        type="text"
                                        value={incomeForm.category}
                                        onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                                        placeholder="Masukkan kategori lainnya..."
                                        required
                                        autoFocus
                                    />
                                </div>
                            )}
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
                        <div ref={incomeMonthRef}>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Bulan <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsIncomeMonthOpen(!isIncomeMonthOpen)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors"
                                >
                                    <span>{incomeForm.month ? MONTHS.find(m => m.value === incomeForm.month)?.label : 'Pilih Bulan'}</span>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isIncomeMonthOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {isIncomeMonthOpen && (
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
                                                            setIsIncomeMonthOpen(false);
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
                    <div ref={incomeRTRef}>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">RT (Opsional)</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsIncomeRTOpen(!isIncomeRTOpen)}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors"
                            >
                                <span>{incomeForm.rt ? (incomeForm.rt === 'RW-01' ? 'RW 01' : `RT ${incomeForm.rt}`) : 'Pilih RT (Opsional)'}</span>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isIncomeRTOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {isIncomeRTOpen && (
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
                                                    setIsIncomeRTOpen(false);
                                                }}
                                                className="px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 text-gray-600"
                                            >
                                                Tidak Ada
                                            </div>
                                            {RT_OPTIONS_WITH_RW.map(rt => (
                                                <div
                                                    key={rt}
                                                    onClick={() => {
                                                        setIncomeForm({ ...incomeForm, rt });
                                                        setIsIncomeRTOpen(false);
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
                                resetIncomeForm();
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
                onClose={() => setDeleteConfirm({ show: false, type: '', id: null })}
                onConfirm={handleDelete}
                title="Konfirmasi Hapus"
                message={`Apakah Anda yakin ingin menghapus data ${deleteConfirm.type === 'iuran' ? 'iuran' :
                    deleteConfirm.type === 'pemasukan' ? 'pemasukan' : 'anggaran'
                    } ini?`}
                confirmText="Hapus"
                type="danger"
            />
        </div>
    );
};

export default FinanceManagement;
