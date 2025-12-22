import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import toast from 'react-hot-toast';
import bgLogin from '../assets/bglogin.png';
import biruLogo from '../assets/birulogo.png';



const Login = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(formData, rememberMe);
      if (response.success) {
        // Only allow admin login
        const userRole = response.data?.role || response.data?.user?.role;
        if (userRole === 'admin') {
          toast.success('Login berhasil!');
          navigate('/dashboard');
        } else {
          // Logout non-admin users
          logout();
          toast.error('Akses ditolak. Hanya admin yang dapat mengakses web ini.');
          setLoading(false);
          return;
        }
      } else {
        toast.error(response.message || 'Login gagal');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={bgLogin}
          alt="Background Login"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        className="relative z-10 bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={biruLogo}
              alt="JagaKampung Logo"
              className="h-24 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">JagaKampung</h1>
          <p className="text-neutral text-base">Portal Admin</p>
        </div>

        {/* Info Box */}
       

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Masukan email"
            icon={<Mail size={20} />}
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Masukan password"
            icon={<Lock size={20} />}
            showPasswordToggle
            required
          />

          {/* Remember Me Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-neutral-dark cursor-pointer select-none">
              <p className="text-neutral">Pertahankan sesi login</p>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={loading}
            icon={<LogIn size={20} />}
            className="mt-6"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-neutral/10">
          <p className="text-center text-xs text-neutral">
            © 2025 JagaKampung. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
