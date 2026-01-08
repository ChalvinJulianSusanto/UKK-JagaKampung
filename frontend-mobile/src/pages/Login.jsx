import { useState, useRef } from 'react';
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

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Sheet dragging state
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startTranslateRef = useRef(0);

  // Position limits
  const minTranslate = -200; // Max up
  const maxTranslate = 0;    // Initial position

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

  // Touch handlers for the entire card
  const handleTouchStart = (e) => {
    // Don't trigger drag if touching input fields or buttons
    const tagName = e.target.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'button' || tagName === 'a') {
      return;
    }

    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    startTranslateRef.current = translateY;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    let newTranslate = startTranslateRef.current + diff;

    // Clamp with elastic effect at bounds
    if (newTranslate > maxTranslate) {
      newTranslate = maxTranslate + (newTranslate - maxTranslate) * 0.2;
    } else if (newTranslate < minTranslate) {
      newTranslate = minTranslate + (newTranslate - minTranslate) * 0.2;
    }

    setTranslateY(newTranslate);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Snap to nearest position
    const midPoint = (minTranslate + maxTranslate) / 2;

    if (translateY < midPoint) {
      setTranslateY(minTranslate); // Snap to top
    } else {
      setTranslateY(maxTranslate); // Snap to bottom
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden relative bg-gradient-to-b from-blue-600 to-blue-500">
      {/* Fixed Blue Background with Logo */}
      <div className="absolute inset-0 flex flex-col items-center pt-16 pointer-events-none">
        <img
          src={logoPutih}
          alt="JagaKampung Logo"
          className="h-20 object-contain"
        />
        <p className="text-white/80 text-sm mt-3 font-medium">
          Sistem Absensi Ronda Malam
        </p>
      </div>

      {/* White Card - Entire card is draggable */}
      <div
        className="absolute left-0 right-0 bg-white rounded-t-[32px] shadow-2xl select-none"
        style={{
          top: '38%',
          minHeight: '80vh',
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
          touchAction: 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle Indicator */}
        <div className="flex justify-center pt-4 pb-3">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Card Content */}
        <div className="px-6 pb-10">
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
              <input
                type="email"
                name="email"
                placeholder="Masukkan Email anda"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3.5 border-2 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors ${errors.email ? 'border-red-400' : 'border-gray-200'
                  }`}
              />
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

          {/* Footer */}
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
