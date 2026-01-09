import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Assets
import logoPutih from '../assets/putih.png';

const CompleteProfile = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        rt: user?.rt || '',
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nama wajib diisi';
        }

        if (!formData.rt) {
            newErrors.rt = 'RT wajib dipilih';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Nomor HP wajib diisi';
        } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
            newErrors.phone = 'Format nomor HP tidak valid';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Mohon lengkapi semua field dengan benar');
            return;
        }

        setLoading(true);

        try {
            const { authAPI } = await import('../api');
            const response = await authAPI.updateProfile(formData);

            if (response.success && response.data) {
                updateUser(response.data);
                toast.success('Profil berhasil dilengkapi!');
                navigate('/', { replace: true });
            }
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error('Gagal melengkapi profil. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-500 flex flex-col">
            {/* Header */}
            <div className="flex flex-col items-center pt-12 pb-8">
                <img src={logoPutih} alt="JagaKampung" className="h-20 object-contain mb-3" />
                <p className="text-white/80 text-sm font-medium">Sistem Absensi Ronda Malam</p>
            </div>

            {/* Form Card */}
            <div className="flex-1 bg-white rounded-t-[32px] shadow-2xl px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Lengkapi Profil Anda
                        </h1>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Silakan lengkapi informasi berikut untuk melanjutkan ke aplikasi JagaKampung.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Masukkan nama lengkap"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-4 py-3.5 border-2 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors ${errors.name ? 'border-red-400' : 'border-gray-200'
                                    }`}
                            />
                            {errors.name && (
                                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                            )}
                        </div>

                        {/* RT Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                RT
                            </label>
                            <select
                                name="rt"
                                value={formData.rt}
                                onChange={handleChange}
                                className={`w-full px-4 py-3.5 border-2 rounded-xl text-gray-800 focus:outline-none focus:border-blue-500 transition-colors ${errors.rt ? 'border-red-400' : 'border-gray-200'
                                    } ${!formData.rt ? 'text-gray-400' : ''}`}
                            >
                                <option value="">Pilih RT Anda</option>
                                <option value="01">RT 01</option>
                                <option value="02">RT 02</option>
                                <option value="03">RT 03</option>
                                <option value="04">RT 04</option>
                                <option value="05">RT 05</option>
                                <option value="06">RT 06</option>
                            </select>
                            {errors.rt && (
                                <p className="text-red-500 text-xs mt-1">{errors.rt}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nomor Handphone
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Contoh: 081234567890"
                                value={formData.phone}
                                onChange={handleChange}
                                className={`w-full px-4 py-3.5 border-2 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors ${errors.phone ? 'border-red-400' : 'border-gray-200'
                                    }`}
                            />
                            {errors.phone && (
                                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2 mt-8"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                'Lanjutkan'
                            )}
                        </button>
                    </form>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-sm text-blue-800">
                            <span className="font-semibold">💡 Info:</span> Informasi ini diperlukan untuk mengatur jadwal ronda dan komunikasi dalam sistem.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CompleteProfile;
