import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Wallet, PiggyBank, Receipt, RefreshCw } from 'lucide-react';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import Badge from '../components/common/Badge';
import { iuranAPI, budgetAPI } from '../api/finance';
import { incomeAPI } from '../api/income';
import toast from 'react-hot-toast';

// Import icons
import iconMoney from '../assets/money.png';
import iconChart from '../assets/analisis.png';
import iconIuran from '../assets/income.png';
import iconProfit from '../assets/profits.png';
import iconSaldo from '../assets/profit.png';
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

const Finances = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [iuranData, setIuranData] = useState([]);
    const [budgetData, setBudgetData] = useState([]);
    const [incomeData, setIncomeData] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchFinancialData();
    }, [selectedMonth, selectedYear]);

    const fetchFinancialData = async () => {
        try {
            setLoading(true);
            const params = { year: selectedYear };
            if (selectedMonth) params.month = selectedMonth;

            const [iuranResponse, budgetResponse, incomeResponse] = await Promise.all([
                iuranAPI.getSummary(params),
                budgetAPI.getSummary(params),
                incomeAPI.getSummary(params),
            ]);

            // Process iuran data
            if (iuranResponse.success) {
                setIuranData(iuranResponse.data.byRT || []);
            }

            // Process budget data
            if (budgetResponse.success) {
                setBudgetData(budgetResponse.data.allRecords || []);
            }

            // Process income data
            if (incomeResponse.success) {
                setIncomeData(incomeResponse.data.byCategory || []);
            }
        } catch (error) {
            console.error('Error fetching financial data:', error);
            toast.error('Gagal memuat data keuangan');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchFinancialData();
        setRefreshing(false);
        toast.success('Data diperbarui');
    };

    // Calculate aggregates from real data
    const totalTarget = iuranData.reduce((sum, rt) => sum + (rt.targetAmount || 0), 0);
    const totalTerkumpul = iuranData.reduce((sum, rt) => sum + (rt.collectedAmount || 0), 0);
    const totalWarga = iuranData.reduce((sum, rt) => sum + (rt.totalResidents || 0), 0);
    const totalSudahBayar = iuranData.reduce((sum, rt) => sum + (rt.paidResidents || 0), 0);

    const totalAlokasi = budgetData.reduce((sum, item) => sum + (item.allocatedAmount || 0), 0);
    const totalTerpakai = budgetData.reduce((sum, item) => sum + (item.spentAmount || 0), 0);

    // NEW: Calculate total income from all sources
    const totalPemasukan = incomeData.reduce((sum, item) => sum + (item.total || 0), 0);

    // NEW: Calculate accurate cash balance
    const saldoRW = totalPemasukan - totalTerpakai;

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Calculate percentage
    const calculatePercentage = (current, target) => {
        if (target === 0) return '0.0';
        return ((current / target) * 100).toFixed(1);
    };

    // Chart data untuk kategori anggaran
    const kategoriAnggaran = budgetData.reduce((acc, item) => {
        const existing = acc.find(a => a.kategori === item.category);
        if (existing) {
            existing.total += item.allocatedAmount || 0;
            existing.terpakai += item.spentAmount || 0;
        } else {
            acc.push({
                kategori: item.category,
                total: item.allocatedAmount || 0,
                terpakai: item.spentAmount || 0,
            });
        }
        return acc;
    }, []);

    if (loading) return <Loading fullScreen />;

    const financialStats = [
        {
            title: 'Total Iuran Terkumpul',
            value: formatCurrency(totalTerkumpul),
            icon: iconIuran,
            isImage: true,
            gradient: 'from-emerald-500 to-emerald-600',
            lightBg: 'bg-emerald-50',
            textColor: 'text-emerald-600',
            trend: calculatePercentage(totalTerkumpul, totalTarget),
            trendUp: totalTerkumpul >= totalTarget * 0.9,
        },
        {
            title: 'Total Anggaran',
            value: formatCurrency(totalAlokasi),
            icon: iconProfit,
            isImage: true,
            gradient: 'from-blue-500 to-blue-600',
            lightBg: 'bg-blue-50',
            textColor: 'text-blue-600',
            trend: calculatePercentage(totalTerpakai, totalAlokasi),
            trendUp: totalTerpakai <= totalAlokasi * 0.8,
        },
        {
            title: 'Saldo RW',
            value: formatCurrency(saldoRW),
            icon: iconMoney,
            isImage: true,
            gradient: 'from-purple-500 to-purple-600',
            lightBg: 'bg-purple-50',
            textColor: 'text-purple-600',
            trend: null,
            trendUp: saldoRW > 0,
        },
        {
            title: 'Tingkat Pembayaran',
            value: `${calculatePercentage(totalSudahBayar, totalWarga)}%`,
            icon: iconChart,
            isImage: true,
            gradient: 'from-amber-500 to-amber-600',
            lightBg: 'bg-amber-50',
            textColor: 'text-amber-600',
            trend: `${totalSudahBayar}/${totalWarga}`,
            trendUp: totalSudahBayar >= totalWarga * 0.9,
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="space-y-6 pb-10">
                {/* Header Section - Modern Design */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Statistik Keuangan</h1>
                                    <p className="text-sm text-gray-500 mt-0.5">Informasi keuangan RW 01</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all disabled:cursor-not-allowed"
                            title="Refresh Data"
                        >
                            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Financial Stats Cards - Modern Design */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {financialStats.map((stat, index) => (
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
                                    {stat.trend && (
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${stat.trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                            }`}>
                                            {stat.trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            <span>{stat.trend}{typeof stat.trend === 'string' && stat.trend.includes('%') ? '' : ''}</span>
                                        </div>
                                    )}
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

                {/* Iuran Bulanan Section - Refined Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">

                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Iuran Bulanan per RT</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Status pengumpulan iuran</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">RT</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Terkumpul</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Warga</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {iuranData.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-16">
                                            <div className="flex flex-col items-center">
                                                <Wallet className="w-12 h-12 text-gray-300 mb-3" />
                                                <p className="text-sm text-gray-400">Belum ada data iuran untuk periode ini</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {iuranData.map((rt, index) => {
                                            const progress = calculatePercentage(rt.collectedAmount, rt.targetAmount);
                                            return (
                                                <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 px-4">
                                                        <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-xs font-semibold">
                                                            RT {rt.rt}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-gray-700">{formatCurrency(rt.targetAmount)}</td>
                                                    <td className="py-4 px-4 text-sm font-semibold text-emerald-600">{formatCurrency(rt.collectedAmount)}</td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[80px]">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' : progress >= 80 ? 'bg-blue-500' : 'bg-amber-500'
                                                                        }`}
                                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-semibold text-gray-900 min-w-[45px]">{progress}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-gray-700">
                                                        {rt.paidResidents}/{rt.totalResidents}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Badge variant={progress >= 100 ? 'success' : progress >= 80 ? 'info' : 'warning'}>
                                                            {progress >= 100 ? 'Terpenuhi' : progress >= 80 ? 'Baik' : 'Perlu Ditingkatkan'}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* Total Row */}
                                        {iuranData.length > 0 && (
                                            <tr className="bg-gray-50 font-semibold">
                                                <td className="py-4 px-4 text-gray-900">Total</td>
                                                <td className="py-4 px-4 text-sm text-gray-900">{formatCurrency(totalTarget)}</td>
                                                <td className="py-4 px-4 text-sm text-emerald-600">{formatCurrency(totalTerkumpul)}</td>
                                                <td className="py-4 px-4">
                                                    <span className="text-xs font-semibold text-gray-900">{calculatePercentage(totalTerkumpul, totalTarget)}%</span>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-gray-900">
                                                    {totalSudahBayar}/{totalWarga}
                                                </td>
                                                <td className="py-4 px-4"></td>
                                            </tr>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Budget Detail per Category - Enhanced Design */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Detail Anggaran per Kategori</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Alokasi dan penggunaan dana</p>
                            </div>
                        </div>
                    </div>

                    {kategoriAnggaran.length === 0 ? (
                        <div className="py-16 text-center">
                            <PiggyBank className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-400">Belum ada data anggaran</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {kategoriAnggaran.map((kategori, index) => {
                                const percentUsed = calculatePercentage(kategori.terpakai, kategori.total);
                                const sisa = kategori.total - kategori.terpakai;
                                return (
                                    <div key={index} className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 mb-1">{kategori.kategori}</h4>
                                                <p className="text-xs text-gray-600">
                                                    Terpakai: <span className="font-semibold text-blue-600">{formatCurrency(kategori.terpakai)}</span> dari <span className="font-semibold">{formatCurrency(kategori.total)}</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 mb-1">Sisa Dana</p>
                                                <p className="text-sm font-bold text-emerald-600">{formatCurrency(sisa)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${percentUsed >= 90 ? 'bg-red-500' : percentUsed >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                                                        }`}
                                                    style={{ width: `${Math.min(percentUsed, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900 min-w-[50px]">{percentUsed}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Finances;
