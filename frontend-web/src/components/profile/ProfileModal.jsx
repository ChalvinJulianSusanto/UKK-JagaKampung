import { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Lock, Save, Camera, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '../common/Input';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/auth';

const ProfileModal = ({ isOpen, onClose, user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      // Handle photo URL from backend
      if (user.photo) {
        const photoUrl = user.photo.startsWith('http')
          ? user.photo
          : `http://localhost:5000${user.photo}`;
        setPhotoPreview(photoUrl);
      } else {
        setPhotoPreview(null);
      }
      setPhotoFile(null);
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate password if changing
      if (formData.newPassword || formData.confirmPassword) {
        if (!formData.currentPassword) {
          toast.error('Current password is required to change password');
          setLoading(false);
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error('New passwords do not match');
          setLoading(false);
          return;
        }
        if (formData.newPassword.length < 6) {
          toast.error('New password must be at least 6 characters');
          setLoading(false);
          return;
        }
      }

      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);

      if (formData.newPassword) {
        formDataToSend.append('currentPassword', formData.currentPassword);
        formDataToSend.append('newPassword', formData.newPassword);
      }

      if (photoFile) {
        formDataToSend.append('photo', photoFile);
      }

      const response = await authAPI.updateProfile(formDataToSend);

      if (response.success) {
        toast.success('Profile berhasil diperbarui');

        console.log('Response from server:', response.data);

        // Update local storage with new user data including photo
        const rememberMe = localStorage.getItem('rememberMe');
        const storage = rememberMe ? localStorage : sessionStorage;
        const currentUser = JSON.parse(storage.getItem('user') || '{}');
        const updatedUser = {
          ...currentUser,
          ...response.data,
          // Ensure photo is properly set
          photo: response.data.photo || currentUser.photo
        };

        console.log('Updated user object:', updatedUser);
        storage.setItem('user', JSON.stringify(updatedUser));

        if (onUpdate) {
          console.log('Calling onUpdate with:', updatedUser);
          onUpdate(updatedUser);
        }

        // Reset password fields
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        // Reset photo file but keep preview from updated user data
        setPhotoFile(null);

        onClose();
      } else {
        toast.error(response.message || 'Gagal untuk memperbarui foto profil');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-primary p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Edit Profil</h2>
                    <p className="text-sm text-white/90 mt-1">Perbarui profil anda</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Profile Photo Upload */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white">
                          <User size={48} />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg  transition-all "
                    >
                      <Camera size={20} />
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="mt-2 text-sm text-red-500  transition-colors"
                    >
                      Hapus Foto
                    </button>
                  )}
                  <p className="text-xs text-neutral mt-2 text-center">
                     Ukuran file maksimal 5MB(jpg, png, jpeg)
                  </p>
                </div>

                {/* Name */}
                <Input
                  label="Nama Lengkap"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Masukan nama lengkap"
                  icon={<User size={20} />}
                  required
                />

                {/* Email */}
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Masukan email anda"
                  icon={<Mail size={20} />}
                  required
                />

                {/* Divider */}
                <div className="border-t border-gray-200 my-6">
                  <p className="text-sm text-neutral font-medium -mt-3 bg-white px-2 w-fit">
                    Ubah kata sandi (Opsional)
                  </p>
                </div>

                {/* Current Password */}
                <Input
                  label="Kata sandi sekarang"
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Masukan kata sandi sekarang"
                  icon={<Lock size={20} />}
                  showPasswordToggle
                />

                {/* New Password */}
                <Input
                  label="Kata sandi baru"
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Masukan kata sandi baru"
                  icon={<Lock size={20} />}
                  showPasswordToggle
                />

                {/* Confirm Password */}
                <Input
                  label="Konfirmasi kata sandi baru"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Konfirmasi kata sandi baru"
                  icon={<Lock size={20} />}
                  showPasswordToggle
                />

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={onClose}
                    disabled={loading}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={loading}
                    icon={<Save size={20} />}
                  >
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
