import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { financeAPI } from '../api';
import { format } from 'date-fns';
import { id, enUS } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';

const FinancialReportsSection = () => {
    const { t, currentLanguage } = useLanguage();
    const [activeTab, setActiveTab] = useState('pemasukan'); // pemasukan, pengeluaran, iuran
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let response;
            const params = { limit: 10 }; // Fetch up to 10 latest records

            if (activeTab === 'pemasukan') {
                response = await financeAPI.getAllIncome(params);
            } else if (activeTab === 'pengeluaran') {
                response = await financeAPI.getAllBudgets(params);
            } else if (activeTab === 'iuran') {
                response = await financeAPI.getAllIuran(params);
            }

            console.log(`[Finance] Tab: ${activeTab}, Response:`, response);

            if (response && response.success) {
                setData(response.data || []);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error('Error fetching financial data:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const formatMonthYear = (monthStr, year) => {
        if (!monthStr) return '-';
        // If month is in YYYY-MM format
        if (typeof monthStr === 'string' && monthStr.match(/^\d{4}-\d{2}$/)) {
            const [y, m] = monthStr.split('-');
            const date = new Date(parseInt(y), parseInt(m) - 1);
            return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        }
        // If month is just a name, append year
        return `${monthStr} ${year}`;
    };

    const tabs = [
        { id: 'pemasukan', label: t('home.income') },
        { id: 'pengeluaran', label: t('home.budget') },
        { id: 'iuran', label: t('home.dues') },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-8"
        >
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('home.financialReportTitle')}</h2>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-4 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                {loading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    </div>
                ) : data.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        {activeTab === 'pemasukan' && t('home.noDataIncome')}
                        {activeTab === 'pengeluaran' && t('home.noDataBudget')}
                        {activeTab === 'iuran' && t('home.noDataDues')}
                    </div>
                ) : (
                    <div className="overflow-x-auto relative">
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-gray-600 font-medium sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        {activeTab === 'pemasukan' && (
                                            <>
                                                <th className="px-4 py-3 whitespace-nowrap bg-slate-50">{t('common.date')}</th>
                                                <th className="px-4 py-3 whitespace-nowrap bg-slate-50">{t('home.source')}</th>
                                                <th className="px-4 py-3 whitespace-nowrap bg-slate-50">{t('home.category')}</th>
                                                <th className="px-4 py-3 text-right whitespace-nowrap bg-slate-50">{t('home.amount')}</th>
                                            </>
                                        )}
                                        {activeTab === 'pengeluaran' && (
                                            <>
                                                <th className="px-4 py-3 whitespace-nowrap bg-slate-50">{t('home.category')}</th>
                                                <th className="px-4 py-3 text-right whitespace-nowrap bg-slate-50">{t('home.budget')}</th>
                                                <th className="px-4 py-3 text-right whitespace-nowrap bg-slate-50">{t('home.used')}</th>
                                                <th className="px-4 py-3 text-right whitespace-nowrap bg-slate-50">{t('home.remaining')}</th>
                                            </>
                                        )}
                                        {activeTab === 'iuran' && (
                                            <>
                                                <th className="px-4 py-3 whitespace-nowrap bg-slate-50">{t('home.period')}</th>
                                                <th className="px-4 py-3 text-right whitespace-nowrap bg-slate-50">{t('home.target')}</th>
                                                <th className="px-4 py-3 text-right whitespace-nowrap bg-slate-50">{t('home.collected')}</th>
                                                <th className="px-4 py-3 text-center whitespace-nowrap bg-slate-50">%</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.map((item, idx) => (
                                        <tr key={item._id || idx} className="hover:bg-gray-50 transition-colors">
                                            {activeTab === 'pemasukan' && (
                                                <>
                                                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                        {item.date ? format(new Date(item.date), 'dd/MM/yyyy', { locale: currentLanguage === 'en' ? enUS : id }) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-gray-800">
                                                        <div className="truncate max-w-[120px]" title={item.description}>{item.description}</div>
                                                        <div className="text-[10px] text-gray-400 font-normal">RT {item.rt || '-'}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">
                                                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs border border-green-100">
                                                            {item.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-green-600 font-bold whitespace-nowrap">
                                                        {formatCurrency(item.amount)}
                                                    </td>
                                                </>
                                            )}
                                            {activeTab === 'pengeluaran' && (
                                                <>
                                                    <td className="px-4 py-3 font-medium text-gray-800">
                                                        {item.category}
                                                        <div className="text-[10px] text-gray-400 font-normal">RT {item.rt} • {item.year}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">
                                                        {formatCurrency(item.allocatedAmount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-red-500 whitespace-nowrap font-medium">
                                                        {formatCurrency(item.spentAmount || 0)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-gray-700">
                                                        {formatCurrency((item.allocatedAmount || 0) - (item.spentAmount || 0))}
                                                    </td>
                                                </>
                                            )}
                                            {activeTab === 'iuran' && (
                                                <>
                                                    <td className="px-4 py-3 font-medium text-gray-800 capitalize whitespace-nowrap">
                                                        {formatMonthYear(item.month, item.year)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">
                                                        {formatCurrency(item.targetAmount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-blue-600 font-bold whitespace-nowrap">
                                                        {formatCurrency(item.collectedAmount || 0)}
                                                    </td>
                                                    <td className="px-4 py-3 min-w-[140px]">
                                                        {(() => {
                                                            const percentage = item.targetAmount > 0
                                                                ? ((item.collectedAmount || 0) / item.targetAmount) * 100
                                                                : 0;

                                                            return (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all ${percentage >= 100 ? 'bg-emerald-500' : percentage >= 80 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-semibold text-gray-700 w-[35px] text-right">
                                                                        {Math.round(percentage)}%
                                                                    </span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                    <span className="text-xs text-gray-400 italic">{t('home.dataIntegrated')}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default FinancialReportsSection;
