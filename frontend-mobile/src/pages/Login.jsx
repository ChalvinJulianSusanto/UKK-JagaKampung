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
  const bgRef = useRef(null); // Ref baru untuk background
  const lastTouchY = useRef(0);
  const currentTranslate = useRef(0);
  const velocity = useRef(0);
  const lastTime = useRef(0);

  // State untuk menyimpan batas scroll dinamis
  const [limits, setLimits] = useState({ min: -200, max: 0 });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Hitung batas scroll berdasarkan ukuran layar saat ini
  useEffect(() => {
    const calculateLimits = () => {
      const windowHeight = window.innerHeight;
      
      // Posisi awal kartu adalah 45% dari atas (0.45)
      const startPosition = windowHeight * 0.45; 
      
      // Kita ingin menyisakan ruang di atas (Header) sekitar 120px untuk Logo
      const safeTopMargin = 120; 

      // Hitung seberapa jauh kartu boleh naik (minY harus negatif)
      // Jarak dari posisi awal ke margin atas
      const maxUpwardDistance = safeTopMargin - startPosition;
      
      setLimits({
        min: maxUpwardDistance, // Contoh: -300px
        max: 0 // Posisi default
      });
    };

    calculateLimits();
    window.addEventListener('resize', calculateLimits);
    return () => window.removeEventListener('resize', calculateLimits);
  }, []);

  // Fungsi untuk menggerakkan Kartu DAN Background (Parallax Effect)
  const setTransform = (y) => {
    // 1. Gerakkan Kartu
    if (cardRef.current) {
      cardRef.current.style.transform = `translateY(${y}px)`;
    }
    
    // 2. Gerakkan Background (Lebih lambat, rasio 0.2)
    // Ini membuat background "naik pelan" saat kartu ditarik, tanpa merubah ukuran
    if (bgRef.current) {
      bgRef.current.style.transform = `translateY(${y * 0.2}px)`;
    }
  };

  // Animate to position with spring-like effect
  const animateTo = (target) => {
    const start = currentTranslate.current;
    const distance = target - start;
    const duration = 300; // Sedikit diperlambat agar smooth
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
    onError: (error) => toast.error('Google login gagal.'),
    flow: 'implicit',
  });

  const handleGoogleLogin = () => googleLogin();

  useEffect(() => {
    // Disable One Tap logic here (same as before)
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

  // --- TOUCH & MOUSE HANDLERS (UPDATED LIMITS) ---
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
      if(bgRef.current) bgRef.current.style.transition = 'none'; // Matikan transisi background saat drag
    };

    const onTouchMove = (e) => {
      if (!isDragging) return;

      const touchY = e.touches[0].clientY;
      const now = performance.now();
      const deltaY = touchY - lastTouchY.current;
      const deltaTime = now - lastTime.current;

      if (deltaTime > 0) velocity.current = deltaY / deltaTime;

      let newY = currentTranslate.current + deltaY;

      // Rubber band effect pada batas limits.min dan limits.max
      if (newY > limits.max) {
        newY = limits.max + (newY - limits.max) * 0.3;
      } else if (newY < limits.min) {
        newY = limits.min + (newY - limits.min) * 0.3;
      }

      currentTranslate.current = newY;
      setTransform(newY); // Menggerakkan Card & Background

      lastTouchY.current = touchY;
      lastTime.current = now;
      e.preventDefault();
    };

    const onTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;

      const vel = velocity.current;
      let target;

      // Logic snap point yang lebih pintar
      if (Math.abs(vel) > 0.5) {
        target = vel < 0 ? limits.min : limits.max;
      } else {
        const mid = (limits.min + limits.max) / 2;
        target = currentTranslate.current < mid ? limits.min : limits.max;
      }

      // Pastikan target tidak melampaui batas
      target = Math.max(limits.min, Math.min(limits.max, target));
      animateTo(target);
    };

    // Desktop Mouse Events (Sama logikanya dengan Touch)
    let isMouseDragging = false;
    const onMouseDown = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'button' || tag === 'a') return;
      isMouseDragging = true;
      lastTouchY.current = e.clientY;
      lastTime.current = performance.now();
      velocity.current = 0;
      card.style.transition = 'none';
      if(bgRef.current) bgRef.current.style.transition = 'none';
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
  }, [limits]); // Re-run effect jika limits berubah (resize window)

  return (
    <div className="h-screen w-full overflow-hidden relative bg-[#0f3a85]">
      {/* Background Layer - Terpisah agar bisa diparallax */}
      <div 
        ref={bgRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{
          backgroundImage: `url(${bgLogin})`,
          backgroundSize: '100% auto', // Lebar full, tinggi menyesuaikan
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
          willChange: 'transform', // Optimasi performa animasi
          // Transform origin top center agar anchor tetap di atas
          transformOrigin: 'top center'
        }}
      />

      {/* White Card */}
      <div
        ref={cardRef}
        className="absolute left-0 right-0 bg-white rounded-t-[32px] shadow-2xl select-none cursor-grab active:cursor-grabbing"
        style={{
          // Posisi Awal: 45% dari atas (menutupi jalanan, menyisakan langit)
          top: '45%', 
          minHeight: '85vh', // Cukup panjang untuk scrolling
          willChange: 'transform',
          touchAction: 'none',
          paddingBottom: '120px'
        }}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-4 pb-3">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Content */}
        <div className="px-6 pb-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang Di JagaKampung!</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Login atau Register sekarang! untuk menikmati semua fitur yang tersedia.
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
                className={`w-full px-4 py-3.5 border-2 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
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
                  className={`w-full px-4 py-3.5 pr-12 border-2 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 ${errors.password ? 'border-red-400' : 'border-gray-200'}`}
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
              ) : 'MASUK'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Belum punya akun?{' '}
            <Link to="/register" className="text-blue-500 font-semibold">Daftar Sekarang</Link>
          </p>

          <div className="flex items-center my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-4 text-sm text-gray-400">Atau gunakan akun</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            )}
          </button>

          <div className="mt-8 pt-5 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400">© 2025 JagaKampung. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;