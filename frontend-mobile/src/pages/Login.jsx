import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Assets
import googleIcon from '../assets/google.png';
import bgLogin from '../assets/bg-login.png';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Refs
  const cardRef = useRef(null);
  const bgRef = useRef(null);
  const lastTouchY = useRef(0);
  const currentTranslate = useRef(0);
  const velocity = useRef(0);
  const lastTime = useRef(0);

  // State for dynamic card position
  const [cardTopPosition, setCardTopPosition] = useState('38%');
  const [cardMaxHeight, setCardMaxHeight] = useState('75vh');

  // State scroll limits
  const [limits, setLimits] = useState({ min: 0, max: 0 });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});


  // --- RESPONSIVE POSITIONING & SCROLL LIMITS ---
  useEffect(() => {
    const calculateLimits = () => {
      const windowHeight = window.innerHeight;

      // Card mulai LEBIH TINGGI agar semua konten form terlihat
      // Tapi masih tetap bisa di-swipe ke atas untuk melihat background
      let startPercentage;
      let stopPercentage;
      let maxCardHeight;

      if (windowHeight < 650) {
        startPercentage = 0.32;
        stopPercentage = 0.15;
        maxCardHeight = '72vh';
      } else if (windowHeight < 780) {
        startPercentage = 0.35;
        stopPercentage = 0.18;
        maxCardHeight = '70vh';
      } else if (windowHeight < 850) {
        startPercentage = 0.38;
        stopPercentage = 0.20;
        maxCardHeight = '68vh';
      } else if (windowHeight < 950) {
        startPercentage = 0.40;
        stopPercentage = 0.20;
        maxCardHeight = '70vh';
      } else {
        startPercentage = 0.42;
        stopPercentage = 0.20;
        maxCardHeight = '75vh';
      }

      const startPosition = windowHeight * startPercentage;
      const targetStopPosition = windowHeight * stopPercentage;
      const maxUpwardDistance = targetStopPosition - startPosition;

      setCardTopPosition(`${startPercentage * 100}%`);
      setCardMaxHeight(maxCardHeight);

      setLimits({
        min: maxUpwardDistance,
        max: 0
      });
    };

    calculateLimits();
    window.addEventListener('resize', calculateLimits);
    return () => window.removeEventListener('resize', calculateLimits);
  }, []);

  // Parallax Effect
  const setTransform = (y) => {
    if (cardRef.current) {
      cardRef.current.style.transform = `translateY(${y}px)`;
    }
    if (bgRef.current) {
      bgRef.current.style.transform = `translateY(${y * 0.15}px)`;
    }
  };

  const animateTo = (target) => {
    const start = currentTranslate.current;
    const distance = target - start;
    const duration = 300;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
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
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email wajib diisi';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Format email tidak valid';
    if (!formData.password) newErrors.password = 'Password wajib diisi';
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
      if (result.success) navigate('/', { replace: true });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Google Login Logic
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoResponse.json();
        const credential = btoa(JSON.stringify({
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          sub: userInfo.sub,
          email_verified: userInfo.email_verified,
        }));
        const result = await loginWithGoogle(credential);
        if (result.success) {
          const userData = result.user;
          (!userData.rt || !userData.phone) ? navigate('/complete-profile', { replace: true }) : navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Google login error:', error);
        toast.error('Google login gagal.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => toast.error('Google login gagal.'),
    flow: 'implicit',
  });

  const handleGoogleLogin = () => googleLogin();

  useEffect(() => {
    const disableGoogleOneTap = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
          window.google.accounts.id.disableAutoSelect();
        } catch (error) { }
      }
    };
    disableGoogleOneTap();
    const interval = setInterval(disableGoogleOneTap, 500);
    const timeout = setTimeout(() => clearInterval(interval), 5000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  // --- TOUCH & MOUSE HANDLERS ---
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    let isDragging = false;

    const onTouchStart = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'button' || tag === 'a') return;
      isDragging = true;
      lastTouchY.current = e.touches[0].clientY;
      lastTime.current = performance.now();
      velocity.current = 0;
      card.style.transition = 'none';
      if (bgRef.current) bgRef.current.style.transition = 'none';
    };

    const onTouchMove = (e) => {
      if (!isDragging) return;
      const touchY = e.touches[0].clientY;
      const now = performance.now();
      const deltaY = touchY - lastTouchY.current;
      const deltaTime = now - lastTime.current;
      if (deltaTime > 0) velocity.current = deltaY / deltaTime;

      let newY = currentTranslate.current + deltaY;

      // Rubber band effect
      if (newY > limits.max) newY = limits.max + (newY - limits.max) * 0.3;
      else if (newY < limits.min) newY = limits.min + (newY - limits.min) * 0.3;

      currentTranslate.current = newY;
      setTransform(newY);
      lastTouchY.current = touchY;
      lastTime.current = now;
      e.preventDefault();
    };

    const onTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      const vel = velocity.current;
      let target;
      if (Math.abs(vel) > 0.5) target = vel < 0 ? limits.min : limits.max;
      else {
        const mid = (limits.min + limits.max) / 2;
        target = currentTranslate.current < mid ? limits.min : limits.max;
      }
      target = Math.max(limits.min, Math.min(limits.max, target));
      animateTo(target);
    };

    // Mouse handlers
    let isMouseDragging = false;
    const onMouseDown = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'button' || tag === 'a') return;
      isMouseDragging = true;
      lastTouchY.current = e.clientY;
      lastTime.current = performance.now();
      velocity.current = 0;
      card.style.transition = 'none';
      if (bgRef.current) bgRef.current.style.transition = 'none';
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!isMouseDragging) return;
      const now = performance.now();
      const deltaY = e.clientY - lastTouchY.current;
      const deltaTime = now - lastTime.current;
      if (deltaTime > 0) velocity.current = deltaY / deltaTime;
      let newY = currentTranslate.current + deltaY;
      if (newY > limits.max) newY = limits.max + (newY - limits.max) * 0.3;
      else if (newY < limits.min) newY = limits.min + (newY - limits.min) * 0.3;
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
      if (Math.abs(vel) > 0.5) target = vel < 0 ? limits.min : limits.max;
      else {
        const mid = (limits.min + limits.max) / 2;
        target = currentTranslate.current < mid ? limits.min : limits.max;
      }
      target = Math.max(limits.min, Math.min(limits.max, target));
      animateTo(target);
    };

    card.addEventListener('touchstart', onTouchStart, { passive: true });
    card.addEventListener('touchmove', onTouchMove, { passive: false });
    card.addEventListener('touchend', onTouchEnd, { passive: true });
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
  }, [limits]);

  return (
    <div className="h-screen w-full overflow-hidden relative bg-[#0f3a85]">
      {/* Background Layer */}
      <div
        ref={bgRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{
          backgroundImage: `url(${bgLogin})`,
          backgroundSize: '100% auto',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
          willChange: 'transform',
          transformOrigin: 'top center'
        }}
      />

      {/* White Card */}
      <div
        ref={cardRef}
        className="absolute left-0 right-0 bg-white rounded-t-[32px] shadow-2xl select-none cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
        style={{
          top: cardTopPosition,
          // --- PERBAIKAN DI SINI ---
          // Kita tambahkan + 50vh (setengah tinggi layar) sebagai buffer tambahan
          // agar saat ditarik ke atas, card tidak habis (tidak kepotong).
          minHeight: `calc(100vh - ${cardTopPosition} + 50vh)`, 
          paddingBottom: '50px', // Opsional: tambah padding bawah
          // ------------------------
          willChange: 'transform',
          touchAction: 'none',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-3">
          <div className="w-12 h-1.5" />
        </div>

        {/* Content - Spacing optimized for small screens */}
        <div className="px-6 pb-3">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1.5">Selamat Datang di RW 01!</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Login atau Register sekarang! untuk melakukan absensi ronda di RW 01.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Masukkan Email anda"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Masukkan Password anda"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 ${errors.password ? 'border-red-400' : 'border-gray-200'}`}
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
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : 'MASUK'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-3">
            Belum punya akun?{' '}
            <Link to="/register" className="text-blue-500 font-semibold">Daftar Sekarang</Link>
          </p>

          <div className="flex items-center my-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-3 text-xs text-gray-400">Atau gunakan akun</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-gray-500 font-medium">Memproses...</span>
              </>
            ) : (
              <>
                <img src={googleIcon} alt="Google" className="w-5 h-5" />
                <span className="text-gray-700 font-medium">Login dengan Google</span>
              </>
            )
            }
          </button>

          <div className="mt-4 pt-3 border-t border-gray-100 pb-4">
            <p className="text-center text-xs text-gray-400">© 2026 JagaKampung. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;