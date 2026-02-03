import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LogOut, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../api'; // Assuming you have an API wrapper to check status

const PendingVerification = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const checkStatus = async () => {
        setLoading(true);
        try {
            // We try to fetch 'me' again. If the backend still says pending, we stay here.
            // If active, the layout/router will naturally let us pass (requires page reload or context update).
            // For now, let's just reload the window to force a fresh auth check or prompt the user.

            // Simulating a check or just reloading the page which triggers the AuthProvider to refetch 'me'
            window.location.reload();

        } catch (error) {
            toast.error('Gagal memuat status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[30%] bg-blue-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[30%] bg-blue-200/30 rounded-full blur-3xl" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 relative z-10 text-center"
            >
                <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-yellow-500" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Menunggu Verifikasi</h1>
                <p className="text-gray-500 mb-6">
                    Halo, <span className="font-semibold text-gray-700">{user?.name || 'Warga'}</span>!
                    <br className="mb-2" />
                    Akun Anda saat ini sedang berstatus <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-bold align-middle">MENUNGGU</span>.
                </p>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left mb-8">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">Kenapa saya harus menunggu?</p>
                            <p className="opacity-90 leading-relaxed">
                                Demi keamanan bersama, akses aplikasi <b>JagaKampung</b> terbatas hanya untuk warga yang telah diverifikasi oleh Admin/Ketua RT. Mohon hubungi admin untuk mempercepat proses.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={checkStatus}
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <RefreshCw size={18} />
                                Cek Status Saya
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} />
                        Keluar
                    </button>
                </div>
            </motion.div>

            <p className="mt-8 text-xs text-center text-gray-400">
                &copy; {new Date().getFullYear()} JagaKampung App
            </p>
        </div>
    );
};

export default PendingVerification;
