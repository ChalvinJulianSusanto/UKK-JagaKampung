import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Phone, MapPin, Info, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import leftIcon from '../assets/left.png';

// ── inline Input component (clean style) ──────────────────────────────────────
const CleanInput = ({ label, name, type = 'text', placeholder, value, onChange, error, icon: Icon, rightElement }) => (
  <div className="reg-field">
    {label && <label className="reg-label">{label}</label>}
    <div className={`reg-input-wrap ${error ? 'reg-input-wrap--error' : ''}`}>
      {Icon && <Icon size={18} className="reg-icon" />}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="reg-input"
        autoComplete="off"
      />
      {rightElement && <span className="reg-right">{rightElement}</span>}
    </div>
    {error && <span className="reg-error">{error}</span>}
  </div>
);


// ── main component ─────────────────────────────────────────────────────────────
const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isRTOpen, setIsRTOpen] = useState(false);
  const rtRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    rt: '',
  });

  const rtOptions = [
    { value: '01', label: 'RT 01' },
    { value: '02', label: 'RT 02' },
    { value: '03', label: 'RT 03' },
    { value: '04', label: 'RT 04' },
    { value: '05', label: 'RT 05' },
    { value: '06', label: 'RT 06' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // ── step 1 validation ──────────────────────────────────────────────────────
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── step 2 validation ──────────────────────────────────────────────────────
  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nama lengkap wajib diisi';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor HP wajib diisi';
    } else if (!/^[0-9]{10,13}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Nomor HP tidak valid (10-13 digit)';
    }
    if (!formData.rt) newErrors.rt = 'RT wajib dipilih';
    if (!formData.password) {
      newErrors.password = 'Password wajib diisi';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password wajib diisi';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) {
      toast.error('Mohon lengkapi semua field dengan benar');
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      const result = await register(registerData);
      if (result.success) {
        toast.success('Registrasi berhasil! Silakan login.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── slide variants ─────────────────────────────────────────────────────────
  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };
  const dir = step === 2 ? 1 : -1;

  // close RT dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (rtRef.current && !rtRef.current.contains(e.target)) {
        setIsRTOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      {/* ── global scoped styles ─────────────────────────────────── */}
      <style>{`
        /* reset & base */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .reg-root {
          min-height: 100vh;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow: hidden;
          position: relative;
        }

        /* top bar */
        .reg-topbar {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px 20px 16px;
        }
        .reg-back-btn {
          position: absolute;
          left: 20px;
          width: 38px; height: 38px;
          border: none;
          background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          padding: 0;
        }
        .reg-back-btn img {
          filter: invert(27%) sepia(90%) saturate(1200%) hue-rotate(210deg) brightness(90%) contrast(95%);
          transition: opacity 0.2s;
        }
        .reg-back-btn:hover img { opacity: 0.7; }
        .reg-topbar-title {
          font-size: 17px;
          font-weight: 600;
          color: #1a1a2e;
          text-align: center;
        }

        /* page content */
        .reg-slide-container {
          flex: 1;
          overflow: hidden;
          position: relative;
        }
        .reg-slide {
          position: absolute;
          inset: 0;
          padding: 28px 24px 0;
          display: flex;
          flex-direction: column;
        }

        /* heading */
        .reg-heading {
          margin-bottom: 28px;
        }
        .reg-heading h2 {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 6px;
          line-height: 1.3;
        }
        .reg-heading p {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
        }

        /* fields */
        .reg-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .reg-label { font-size: 13px; font-weight: 500; color: #374151; }
        .reg-input-wrap {
          display: flex; align-items: center;
          border: 1.5px solid #d1d5db;
          border-radius: 12px;
          padding: 0 14px;
          background: #fff;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .reg-input-wrap:focus-within {
          border-color: #3b5bdb;
          box-shadow: 0 0 0 3px rgba(59,91,219,0.12);
        }
        .reg-input-wrap--error { border-color: #ef4444; }
        .reg-input-wrap--error:focus-within {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.12);
        }
        .reg-icon { color: #9ca3af; flex-shrink: 0; margin-right: 10px; }
        .reg-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 15px;
          color: #1a1a2e;
          padding: 14px 0;
          font-family: inherit;
        }
        .reg-input::placeholder { color: #9ca3af; }
        .reg-right { flex-shrink: 0; margin-left: 8px; }
        .reg-eye-btn {
          background: none; border: none; padding: 0;
          color: #9ca3af; cursor: pointer; display: flex; align-items: center;
          transition: color 0.2s;
        }
        .reg-eye-btn:hover { color: #3b5bdb; }
        .reg-error { font-size: 12px; color: #ef4444; margin-top: 2px; }

        /* custom RT dropdown */
        .reg-dropdown-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px;
          background: #fff;
          border: 1.5px solid #d1d5db;
          border-radius: 12px;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
          text-align: left;
        }
        .reg-dropdown-btn:focus { outline: none; border-color: #3b5bdb; box-shadow: 0 0 0 3px rgba(59,91,219,0.12); }
        .reg-dropdown-btn.reg-input-wrap--error { border-color: #ef4444; }
        .reg-dropdown-value { font-size: 15px; color: #1a1a2e; }
        .reg-dropdown-placeholder { font-size: 15px; color: #9ca3af; }
        .reg-dropdown-chevron { color: #9ca3af; flex-shrink: 0; }
        .reg-dropdown-panel {
          position: absolute;
          top: calc(100% + 6px);
          left: 0; right: 0;
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.10);
          overflow: hidden;
          z-index: 200;
        }
        .reg-dropdown-item {
          width: 100%;
          padding: 13px 16px;
          text-align: left;
          font-size: 14px;
          font-family: inherit;
          background: none;
          border: none;
          cursor: pointer;
          color: #374151;
          transition: background 0.15s;
        }
        .reg-dropdown-item:hover { background: #f5f7ff; }
        .reg-dropdown-item--active { background: #eef1ff; color: #3b5bdb; font-weight: 600; }

        /* info box */
        .reg-info-box {
          display: flex; align-items: flex-start; gap: 10px;
          background: #f0f4ff;
          border-radius: 12px;
          padding: 14px;
          margin-top: 4px;
          margin-bottom: 20px;
        }
        .reg-info-box svg { flex-shrink: 0; color: #3b5bdb; margin-top: 1px; }
        .reg-info-box p { font-size: 13px; color: #374151; line-height: 1.5; }

        /* step indicator */
        .reg-steps {
          display: flex; gap: 6px; margin-bottom: 24px;
        }
        .reg-step-dot {
          height: 4px; border-radius: 99px;
          transition: all 0.3s ease;
        }
        .reg-step-dot--active { background: #3b5bdb; flex: 1.8; }
        .reg-step-dot--inactive { background: #e5e7eb; flex: 1; }

        /* bottom sticky area */
        .reg-bottom {
          padding: 16px 24px 36px;
          background: #fff;
        }

        /* primary button */
        .reg-btn-primary {
          width: 100%;
          padding: 16px;
          background: #3b5bdb;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.5px;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          text-transform: uppercase;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 4px 16px rgba(59,91,219,0.35);
        }
        .reg-btn-primary:hover:not(:disabled) {
          background: #2f4ac0;
          box-shadow: 0 6px 20px rgba(59,91,219,0.45);
        }
        .reg-btn-primary:active:not(:disabled) { transform: scale(0.98); }
        .reg-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        /* login link */
        .reg-login-link {
          text-align: center;
          margin-top: 14px;
          font-size: 13px;
          color: #6b7280;
        }
        .reg-login-link a { color: #3b5bdb; font-weight: 600; text-decoration: none; }
        .reg-login-link a:hover { text-decoration: underline; }

        /* scrollable fields area */
        .reg-fields-scroll {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 8px;
        }
        .reg-fields-scroll::-webkit-scrollbar { width: 0; }

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="reg-root">
        {/* Top bar */}
        <div className="reg-topbar">
          <button
            className="reg-back-btn"
            onClick={() => (step === 2 ? setStep(1) : navigate('/login'))}
            aria-label="Kembali"
          >
            <img src={leftIcon} alt="Kembali" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          </button>
          <span className="reg-topbar-title">Daftar Akun</span>
        </div>

        {/* Slide content */}
        <div className="reg-slide-container">
          <AnimatePresence initial={false} custom={dir} mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                className="reg-slide"
                custom={-1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeInOut' }}
              >

                {/* Heading */}
                <div className="reg-heading">
                  <h2>Daftar Akun JagaKampung!</h2>
                  <p>Daftar akun untuk menikmati semua layanan dan fitur di JagaKampung!</p>
                </div>

                {/* Email field */}
                <CleanInput
                  label="Alamat Email"
                  name="email"
                  type="email"
                  placeholder="Masukan alamat email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}

                />

                {/* Info box */}
                <div className="reg-info-box">
                  <Info size={16} />
                  <p>Pastikan email kamu aktif, ya! Email digunakan untuk verifikasi dan notifikasi akun.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                className="reg-slide"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeInOut' }}
              >

                {/* Heading */}
                <div className="reg-heading">
                  <h2>Lengkapi Data Diri</h2>
                  <p>Isi informasi berikut untuk menyelesaikan pendaftaranmu.</p>
                </div>

                {/* Scrollable fields */}
                <div className="reg-fields-scroll">
                  <CleanInput
                    label="Nama Lengkap"
                    name="name"
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}

                  />

                  <CleanInput
                    label="Nomor HP"
                    name="phone"
                    type="tel"
                    placeholder="Masukan nomer Telp"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}

                  />

                  {/* Custom RT Dropdown */}
                  <div className="reg-field" ref={rtRef} style={{ position: 'relative' }}>
                    <label className="reg-label">RT</label>
                    <button
                      type="button"
                      className={`reg-dropdown-btn ${errors.rt ? 'reg-input-wrap--error' : ''}`}
                      onClick={() => setIsRTOpen((v) => !v)}
                    >
                      <span className={formData.rt ? 'reg-dropdown-value' : 'reg-dropdown-placeholder'}>
                        {formData.rt ? rtOptions.find(o => o.value === formData.rt)?.label : 'Pilih RT'}
                      </span>
                      <ChevronDown
                        size={18}
                        className="reg-dropdown-chevron"
                        style={{ transform: isRTOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                      />
                    </button>
                    {errors.rt && <span className="reg-error">{errors.rt}</span>}

                    <AnimatePresence>
                      {isRTOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.18 }}
                          className="reg-dropdown-panel"
                        >
                          {rtOptions.map((o) => (
                            <button
                              key={o.value}
                              type="button"
                              className={`reg-dropdown-item ${formData.rt === o.value ? 'reg-dropdown-item--active' : ''}`}
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, rt: o.value }));
                                if (errors.rt) setErrors((prev) => ({ ...prev, rt: '' }));
                                setIsRTOpen(false);
                              }}
                            >
                              {o.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <CleanInput
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukan Kata sandi"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    rightElement={
                      <button
                        type="button"
                        className="reg-eye-btn"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        )}
                      </button>
                    }
                  />

                  <CleanInput
                    label="Konfirmasi Password"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Masukkan ulang Kata sandi"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    rightElement={
                      <button
                        type="button"
                        className="reg-eye-btn"
                        onClick={() => setShowConfirm((v) => !v)}
                        tabIndex={-1}
                      >
                        {showConfirm ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        )}
                      </button>
                    }
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom sticky button */}
        <div className="reg-bottom">
          {step === 1 ? (
            <button className="reg-btn-primary" onClick={handleNext}>
              Lanjutkan
            </button>
          ) : (
            <button
              className="reg-btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Mendaftar...' : 'Daftar'}
            </button>
          )}

          <p className="reg-login-link">
            Sudah punya akun?{' '}
            <Link to="/login">Login di sini</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;
