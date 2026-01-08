import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Assets
import logoPutih from '../assets/putih.png';
import googleIcon from '../assets/google.png';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const sheetRef = useRef(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Sheet position state
  const [sheetPosition, setSheetPosition] = useState('bottom'); // 'bottom' or 'top'
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);

  // Position values (in pixels from bottom of screen)
  const bottomPosition = 0;  // Card at initial position
  const topPosition = -200;  // Card moved up by 200px

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.password) {
      newErrors.password = 'Password wajib diisi';
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
      const result = await login(formData, true);

      if (result.success) {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    toast('Login dengan Google akan segera hadir!', {
      icon: '🚀',
    });
  };

  // Touch handlers for the handle bar
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    const diff = startY - currentY;

    // Calculate new translate value
    const baseTranslate = sheetPosition === 'top' ? topPosition : bottomPosition;
    let newTranslate = baseTranslate - diff;

    // Clamp the value
    newTranslate = Math.max(topPosition, Math.min(bottomPosition, newTranslate));

    setCurrentTranslate(newTranslate);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // Determine final position based on current translate
    const threshold = (topPosition + bottomPosition) / 2;

    if (currentTranslate < threshold) {
      setSheetPosition('top');
      setCurrentTranslate(topPosition);
    } else {
      setSheetPosition('bottom');
      setCurrentTranslate(bottomPosition);
    }
  };

  // Get current translateY value
  const getTranslateY = () => {
    if (isDragging) {
      return currentTranslate;
    }
    return sheetPosition === 'top' ? topPosition : bottomPosition;
  };

  return (
    <div className="h-screen w-full overflow-hidden relative bg-gradient-to-b from-blue-600 to-blue-500">
      {/* Fixed Blue Background with Logo */}
      <div className="absolute inset-0 flex flex-col items-center pt-16">
        {/* Logo */}
        <img
          src={logoPutih}
          alt="JagaKampung Logo"
          className="h-20 object-contain"
        />
        <p className="text-white/80 text-sm mt-3 font-medium">
          Sistem Absensi Ronda Malam
        </p>
      </div>

      {/* White Card (Bottom Sheet) */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bg-white rounded-t-[32px] shadow-2xl overflow-hidden"
        style={{
          top: '38%',
          height: 'calc(100vh - 38% + 200px)', // Extra height for when pulled up
          transform: `translateY(${getTranslateY()}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
        }}
      >
        {/* Drag Handle - Only this area responds to touch drag */}
        <div
          className="flex justify-center pt-4 pb-3 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Card Content - Scrollable */}
        <div
          className="px-6 pb-10 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 100px)' }}
        >
          {/* Welcome Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Selamat Datang Di JagaKampung!
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Login atau Register sekarang! untuk menikmati semua fitur yang tersedia di JagaKampung.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  placeholder="Masukkan Email anda"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3.5 border-2 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors ${errors.email ? 'border-red-400' : 'border-gray-200'
                    }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Masukkan Password anda"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3.5 pr-12 border-2 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors ${errors.password ? 'border-red-400' : 'border-gray-200'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* MASUK Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                'MASUK'
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Belum punya akun?{' '}
            <Link to="/register" className="text-blue-500 font-semibold hover:underline">
              Daftar Sekarang
            </Link>
          </p>

          {/* Separator */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-4 text-sm text-gray-400">Atau gunakan akun</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <img src={googleIcon} alt="Google" className="w-5 h-5" />
            <span className="text-blue-500 font-semibold">Sign in with Google</span>
          </button>

          {/* Footer - Copyright */}
          <div className="mt-10 pt-6 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400">
              © 2025 JagaKampung. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
