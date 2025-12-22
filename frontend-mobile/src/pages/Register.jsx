import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Select } from '../components/common';
import toast from 'react-hot-toast';
import biruLogo from '../assets/birulogo.png';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    rt: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama lengkap wajib diisi';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

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

    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor HP wajib diisi';
    } else if (!/^[0-9]{10,13}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Nomor HP tidak valid (10-13 digit)';
    }

    if (!formData.rt) {
      newErrors.rt = 'RT wajib dipilih';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary-700 flex items-center justify-center p-4">
      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md"
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
          <p className="text-neutral text-base">Daftar Akun Baru</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nama Lengkap"
            name="name"
            type="text"
            placeholder="Masukkan nama lengkap"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            icon={User}
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="nama@email.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            icon={Mail}
            required
          />

          <Input
            label="Nomor HP"
            name="phone"
            type="tel"
            placeholder="08123456789"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            icon={Phone}
            required
          />

          <Select
            label="RT"
            name="rt"
            value={formData.rt}
            onChange={handleChange}
            options={rtOptions}
            placeholder="Pilih RT Anda"
            error={errors.rt}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Minimal 6 karakter"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            icon={Lock}
            required
          />

          <Input
            label="Konfirmasi Password"
            name="confirmPassword"
            type="password"
            placeholder="Ketik ulang password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            icon={Lock}
            required
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            className="mt-6"
          >
            Daftar Sekarang
          </Button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Login di sini
          </Link>
        </p>

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

export default Register;
