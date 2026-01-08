import { useState, useRef, useEffect } from 'react';
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

  // Refs
  const cardRef = useRef(null);
  const lastTouchY = useRef(0);
  const currentTranslate = useRef(0);
  const velocity = useRef(0);
  const lastTime = useRef(0);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Limits
  const minY = -200;
  const maxY = 0;

  // Apply transform directly
  const setTransform = (y) => {
    if (cardRef.current) {
      cardRef.current.style.transform = `translateY(${y}px)`;
    }
  };

  // Animate to position with spring-like effect
  const animateTo = (target) => {
    const start = currentTranslate.current;
    const distance = target - start;
    const duration = 250;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + distance * eased;

      setTransform(current);
      currentTranslate.current = current;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        currentTranslate.current = target;
        setTransform(target);
      }
    };

    requestAnimationFrame(animate);
  };

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
    toast('Login dengan Google akan segera hadir!', { icon: '🚀' });
  };

  // Touch handling with passive: false for immediate response
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    let isDragging = false;

    const onTouchStart = (e) => {
      // Skip if touching input or button
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'button' || tag === 'a') return;

      isDragging = true;
      lastTouchY.current = e.touches[0].clientY;
      lastTime.current = performance.now();
      velocity.current = 0;

      // Remove transition for immediate response
      card.style.transition = 'none';
    };

    const onTouchMove = (e) => {
      if (!isDragging) return;

      const touchY = e.touches[0].clientY;
      const now = performance.now();
      const deltaY = touchY - lastTouchY.current;
      const deltaTime = now - lastTime.current;

      // Calculate velocity
      if (deltaTime > 0) {
        velocity.current = deltaY / deltaTime;
      }

      // Update position immediately
      let newY = currentTranslate.current + deltaY;

      // Rubber band at edges
      if (newY > maxY) {
        newY = maxY + (newY - maxY) * 0.3;
      } else if (newY < minY) {
        newY = minY + (newY - minY) * 0.3;
      }

      currentTranslate.current = newY;
      setTransform(newY);

      lastTouchY.current = touchY;
      lastTime.current = now;

      // Prevent page scroll
      e.preventDefault();
    };

    const onTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;

      // Determine target based on velocity and position
      const vel = velocity.current;
      let target;

      if (Math.abs(vel) > 0.5) {
        // High velocity - use velocity direction
        target = vel < 0 ? minY : maxY;
      } else {
        // Low velocity - snap to nearest
        const mid = (minY + maxY) / 2;
        target = currentTranslate.current < mid ? minY : maxY;
      }

      // Clamp target
      target = Math.max(minY, Math.min(maxY, target));

      animateTo(target);
    };

    // Add event listeners with passive: false for immediate response
    card.addEventListener('touchstart', onTouchStart, { passive: true });
    card.addEventListener('touchmove', onTouchMove, { passive: false });
    card.addEventListener('touchend', onTouchEnd, { passive: true });

    // Mouse events for desktop
    let isMouseDragging = false;

    const onMouseDown = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'button' || tag === 'a') return;

      isMouseDragging = true;
      lastTouchY.current = e.clientY;
      lastTime.current = performance.now();
      velocity.current = 0;
      card.style.transition = 'none';
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!isMouseDragging) return;

      const now = performance.now();
      const deltaY = e.clientY - lastTouchY.current;
      const deltaTime = now - lastTime.current;

      if (deltaTime > 0) {
        velocity.current = deltaY / deltaTime;
      }

      let newY = currentTranslate.current + deltaY;

      if (newY > maxY) {
        newY = maxY + (newY - maxY) * 0.3;
      } else if (newY < minY) {
        newY = minY + (newY - minY) * 0.3;
      }

      currentTranslate.current = newY;
      setTransform(newY);

      lastTouchY.current = e.clientY;
      lastTime.current = now;
    };

    const onMouseUp = () => {
      if (!isMouseDragging) return;
      isMouseDragging = false;

      const vel = velocity.current;
      let target;

      if (Math.abs(vel) > 0.5) {
        target = vel < 0 ? minY : maxY;
      } else {
        const mid = (minY + maxY) / 2;
        target = currentTranslate.current < mid ? minY : maxY;
      }

      target = Math.max(minY, Math.min(maxY, target));
      animateTo(target);
    };

    card.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      card.removeEventListener('touchstart', onTouchStart);
      card.removeEventListener('touchmove', onTouchMove);
      card.removeEventListener('touchend', onTouchEnd);
      card.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden relative bg-gradient-to-b from-blue-600 to-blue-500">
      {/* Background with Logo */}
      <div className="absolute inset-0 flex flex-col items-center pt-16 pointer-events-none">
        <img src={logoPutih} alt="JagaKampung" className="h-20 object-contain" />
        <p className="text-white/80 text-sm mt-3 font-medium">Sistem Absensi Ronda Malam</p>
      </div>

      {/* White Card */}
      <div
        ref={cardRef}
        className="absolute left-0 right-0 bg-white rounded-t-[32px] shadow-2xl select-none cursor-grab active:cursor-grabbing"
        style={{
          top: '38%',
          minHeight: '80vh',
          willChange: 'transform',
          touchAction: 'none'
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-3">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Content */}
        <div className="px-6 pb-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang Di JagaKampung!</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Login atau Register sekarang! untuk menikmati semua fitur yang tersedia di JagaKampung.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Masukkan Email anda"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3.5 border-2 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 ${errors.email ? 'border-red-400' : 'border-gray-200'
                  }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Masukkan Password anda"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3.5 pr-12 border-2 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 ${errors.password ? 'border-red-400' : 'border-gray-200'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
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

          <p className="text-center text-sm text-gray-600 mt-6">
            Belum punya akun?{' '}
            <Link to="/register" className="text-blue-500 font-semibold">Daftar Sekarang</Link>
          </p>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-4 text-sm text-gray-400">Atau gunakan akun</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <img src={googleIcon} alt="Google" className="w-5 h-5" />
            <span className="text-blue-500 font-semibold">Sign in with Google</span>
          </button>

          <div className="mt-10 pt-6 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400">© 2025 JagaKampung. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
