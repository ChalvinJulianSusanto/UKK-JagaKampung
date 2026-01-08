import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

  // Refs for smooth animation without re-renders
  const cardRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Position limits
  const minY = -200; // Max up
  const maxY = 0;    // Initial position

  // Update card position directly via DOM
  const updateCardPosition = useCallback((y, withTransition = false) => {
    if (cardRef.current) {
      cardRef.current.style.transition = withTransition
        ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        : 'none';
      cardRef.current.style.transform = `translateY(${y}px)`;
    }
  }, []);

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

  // Check if target is interactive element
  const isInteractiveElement = (target) => {
    const tagName = target.tagName.toLowerCase();
    return tagName === 'input' || tagName === 'button' || tagName === 'a';
  };

  // Handle drag move
  const handleDragMove = useCallback((clientY) => {
    if (!isDraggingRef.current) return;

    const diff = clientY - startYRef.current;
    let newY = currentYRef.current + diff;

    // Rubber band effect at bounds
    if (newY > maxY) {
      newY = maxY + (newY - maxY) * 0.15;
    } else if (newY < minY) {
      newY = minY + (newY - minY) * 0.15;
    }

    updateCardPosition(newY, false);
    startYRef.current = clientY;
    currentYRef.current = newY;
  }, [updateCardPosition]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const midPoint = (minY + maxY) / 2;
    const targetY = currentYRef.current < midPoint ? minY : maxY;

    currentYRef.current = targetY;
    updateCardPosition(targetY, true);
  }, [updateCardPosition]);

  // Touch Events
  const handleTouchStart = (e) => {
    if (isInteractiveElement(e.target)) return;
    isDraggingRef.current = true;
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    handleDragMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse Events (for laptop/desktop)
  const handleMouseDown = (e) => {
    if (isInteractiveElement(e.target)) return;
    e.preventDefault();
    isDraggingRef.current = true;
    startYRef.current = e.clientY;

    // Add global mouse listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e) => {
    handleDragMove(e.clientY);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
    // Remove global mouse listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleDragEnd, handleMouseMove]);

  // Initialize
  useEffect(() => {
    currentYRef.current = 0;
    updateCardPosition(0, false);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [updateCardPosition, handleMouseMove, handleMouseUp]);

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

      {/* White Card */}
      <div
        ref={cardRef}
        className="absolute left-0 right-0 bg-white rounded-t-[32px] shadow-2xl select-none will-change-transform cursor-grab active:cursor-grabbing"
        style={{
          top: '38%',
          minHeight: '80vh',
          touchAction: 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-4 pb-3">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Content */}
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
            {/* Email */}
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

            {/* Password */}
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
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
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

          {/* Google Sign In */}
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
