import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/common';
import toast from 'react-hot-toast';

// Assets
import logoPutih from '../assets/putih.png';
import googleIcon from '../assets/google.png';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const scrollContainerRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // For scroll-based card animation
  const [scrollY, setScrollY] = useState(0);
  const [cardExpanded, setCardExpanded] = useState(false);

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
      const result = await login(formData, rememberMe);

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
    // Placeholder for Google login functionality
    toast('Login dengan Google akan segera hadir!', {
      icon: '🚀',
    });
  };

  // Handle scroll to expand/collapse card
  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    setScrollY(scrollTop);

    // If scrolled more than 50px, consider card as expanded
    if (scrollTop > 50) {
      setCardExpanded(true);
    } else {
      setCardExpanded(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden relative bg-blue-500">
      {/* Blue Background Header Area with Logo */}
      <div
        className="absolute top-0 left-0 right-0 bg-gradient-to-b from-blue-600 to-blue-500 flex flex-col items-center justify-center transition-all duration-300"
        style={{
          height: cardExpanded ? '15vh' : '45vh',
          paddingTop: cardExpanded ? '20px' : '0'
        }}
      >
        {/* Logo */}
        <motion.img
          src={logoPutih}
          alt="JagaKampung Logo"
          className="object-contain transition-all duration-300"
          style={{
            height: cardExpanded ? '40px' : '80px',
            opacity: 1
          }}
        />
        {!cardExpanded && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/80 text-sm mt-3 font-medium"
          >
            Sistem Absensi Ronda Malam
          </motion.p>
        )}
      </div>

      {/* Scrollable White Card Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="absolute bottom-0 left-0 right-0 overflow-y-auto transition-all duration-300"
        style={{
          top: cardExpanded ? '12vh' : '40vh',
          scrollBehavior: 'smooth'
        }}
      >
        {/* White Card */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 200,
            delay: 0.1
          }}
          className="bg-white rounded-t-[32px] min-h-full shadow-2xl"
        >
          {/* Drag Handle Indicator */}
          <div className="flex justify-center pt-4 pb-2">
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
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
