import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Edit3,
  LogOut,
  Save,
  X,
  MessageCircle,
  HelpCircle,
  ChevronRight,
  Home,
  Shield,
  Check,
  Loader2,
  Pin,
  Map,
  MapPin,
} from 'lucide-react';
import userIcon from '../assets/user (2).png';
import bgrImage from '../assets/isis.png';
import logoPutih from '../assets/putih.png';
import IconCamera from '../assets/cam.png';
import galleryIcon from '../assets/img.png';
import removeIcon from '../assets/remove.png';
import whatsappIcon from '../assets/whatsapp.png';
import faqIcon from '../assets/faq.png';
import keluarIcon from '../assets/keluar.png';
import bahasaIcon from '../assets/bahasa.png';
import idFlag from '../assets/id.png';
import enFlag from '../assets/en.png';
import languageIcon from '../assets/language.png';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authAPI } from '../api';
import { Button, Input, Select, ConfirmModal } from '../components/common';
import toast from 'react-hot-toast';

// ====== KONFIGURASI WHATSAPP ADMIN ======
// Ganti link di bawah ini dengan link WhatsApp admin Anda
// Format: https://wa.me/628xxxxxxxxxx atau https://wa.me/628xxxxxxxxxx?text=PesanDefault
const ADMIN_WHATSAPP_LINK = 'https://wa.me/62895378251954?text=Halo%20Admin%2C%20saya%20ingin%20bertanya%20tentang%20aplikasi%20JagaKampung.';

// MaskedIcon Component
const translations = {
  id: {
    // Profile Header
    appName: 'JagaKampung',
    user: 'Pengguna',

    // Profile Section
    manageProfile: 'Kelola profil anda',
    edit: 'Edit',
    phoneNumber: 'Nomor Telepon',
    rtLocation: 'Lokasi RT',

    // Form Labels
    fullName: 'Nama Lengkap',
    email: 'Email',
    phone: 'Nomor HP',
    rt: 'RT',

    // Form Placeholders
    enterName: 'Masukkan nama',
    enterEmail: 'Masukkan email',
    enterPhone: 'Masukkan nomor HP',
    selectRT: 'Pilih RT',

    // Buttons
    cancel: 'Batal',
    save: 'Simpan',
    logout: 'Keluar',

    // Settings
    settings: 'Pengaturan',
    contactAdmin: 'Hubungi Admin',
    changeLanguage: 'Pilih Bahasa',
    help: 'Bantuan',

    // Language Names
    indonesia: 'Indonesia',
    english: 'Inggris',

    // Photo Options
    selectMethod: 'Pilih Metode',
    viewGallery: 'Lihat galeri',
    takePhoto: 'Ambil foto',
    removePhoto: 'Hapus foto',

    // Language Modal
    changeLanguageTitle: 'Ubah Bahasa',
    selectLanguage: 'Pilih Bahasa',
    selectLanguageDesc: 'Pilih bahasa yang Anda inginkan',
    indonesianLang: 'Bahasa Indonesia',
    englishLang: 'Bahasa Inggris',

    // Modals
    logoutConfirm: 'Konfirmasi Logout',
    logoutMessage: 'Apakah Anda yakin ingin keluar dari akun?',
    yesLogout: 'Ya, Keluar',

    // FAQ
    faq: 'FAQ',
    faqDesc: 'Pertanyaan yang sering diajukan',
    otherQuestions: 'Ada pertanyaan lain? Hubungi admin via WhatsApp',

    // Validation
    nameRequired: 'Nama wajib diisi',
    emailRequired: 'Email wajib diisi',
    emailInvalid: 'Format email tidak valid',
    phoneRequired: 'Nomor HP wajib diisi',
    rtRequired: 'RT wajib dipilih',
    fillAllFields: 'Mohon lengkapi semua field dengan benar',

    // Toast Messages
    profileUpdated: 'Profil berhasil diperbarui',
    photoUpdated: 'Foto profil berhasil diperbarui',
    photoRemoved: 'Foto profil berhasil dihapus',
    noPhotoToRemove: 'Tidak ada foto untuk dihapus',
    photoChangeCancelled: 'Perubahan foto dibatalkan',
    languageChanged: 'Bahasa berhasil diubah ke',
    invalidFile: 'File harus berupa gambar',
    fileTooLarge: 'Ukuran file maksimal 5MB',
    noPhotoSelected: 'Tidak ada foto yang dipilih',
    updateFailed: 'Gagal memperbarui profil',
    photoUpdateFailed: 'Gagal memperbarui foto profil',
    photoRemoveFailed: 'Gagal menghapus foto',
    errorOccurred: 'Terjadi kesalahan',

    // Version
    version: 'JagaKampung v1.0.0',
  },
  en: {
    // Profile Header
    appName: 'JagaKampung',
    user: 'User',

    // Profile Section
    manageProfile: 'Manage your profile',
    edit: 'Edit',
    phoneNumber: 'Phone Number',
    rtLocation: 'RT Location',

    // Form Labels
    fullName: 'Full Name',
    email: 'Email',
    phone: 'Phone Number',
    rt: 'RT',

    // Form Placeholders
    enterName: 'Enter name',
    enterEmail: 'Enter email',
    enterPhone: 'Enter phone number',
    selectRT: 'Select RT',

    // Buttons
    cancel: 'Cancel',
    save: 'Save',
    logout: 'Logout',

    // Settings
    settings: 'Settings',
    contactAdmin: 'Contact Admin',
    changeLanguage: 'Select Language',
    help: 'Help',

    // Language Names
    indonesia: 'Indonesia',
    english: 'Inggris',

    // Photo Options
    selectMethod: 'Select Method',
    viewGallery: 'View gallery',
    takePhoto: 'Take photo',
    removePhoto: 'Remove photo',

    // Language Modal
    changeLanguageTitle: 'Change Language',
    selectLanguage: 'Select Language',
    selectLanguageDesc: 'Choose your preferred language',
    indonesianLang: 'Bahasa Indonesia',
    englishLang: 'Bahasa Inggris',

    // Modals
    logoutConfirm: 'Logout Confirmation',
    logoutMessage: 'Are you sure you want to logout from your account?',
    yesLogout: 'Yes, Logout',

    // FAQ
    faq: 'FAQ',
    faqDesc: 'Frequently Asked Questions',
    otherQuestions: 'Have other questions? Contact admin via WhatsApp',

    // Validation
    nameRequired: 'Name is required',
    emailRequired: 'Email is required',
    emailInvalid: 'Invalid email format',
    phoneRequired: 'Phone number is required',
    rtRequired: 'RT must be selected',
    fillAllFields: 'Please fill all fields correctly',

    // Toast Messages
    profileUpdated: 'Profile successfully updated',
    photoUpdated: 'Profile photo successfully updated',
    photoRemoved: 'Profile photo successfully removed',
    noPhotoToRemove: 'No photo to remove',
    photoChangeCancelled: 'Photo change cancelled',
    languageChanged: 'Language successfully changed to',
    invalidFile: 'File must be an image',
    fileTooLarge: 'Maximum file size is 5MB',
    noPhotoSelected: 'No photo selected',
    updateFailed: 'Failed to update profile',
    photoUpdateFailed: 'Failed to update profile photo',
    photoRemoveFailed: 'Failed to remove photo',
    errorOccurred: 'An error occurred',

    // Version
    version: 'JagaKampung v1.0.0',
  },
};

// MaskedIcon Component (sama seperti di Home.jsx)
const MaskedIcon = ({ src, color = '#FFFFFF', size = 20, alt = '' }) => {
  const style = {
    width: size,
    height: size,
    backgroundColor: color,
    WebkitMaskImage: `url(${src})`,
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskSize: 'contain',
    WebkitMaskPosition: 'center',
    maskImage: `url(${src})`,
    maskRepeat: 'no-repeat',
    maskSize: 'contain',
    maskPosition: 'center',
    display: 'inline-block',
    flex: '0 0 auto',
  };
  return <span role="img" aria-label={alt} style={style} />;
};

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [tempSelectedLanguage, setTempSelectedLanguage] = useState(currentLanguage);

  // State Photo Preview
  const [photoPreview, setPhotoPreview] = useState(user?.photo || null);
  const [photoFile, setPhotoFile] = useState(null);

  // Update photoPreview jika user data berubah
  useEffect(() => {
    if (user?.photo && !photoFile) {
      const timestamp = new Date().getTime();
      let photoUrl = user.photo;
      if (photoUrl.startsWith('/') && !photoUrl.startsWith('http')) {
        const apiBaseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
        photoUrl = `${apiBaseUrl}${photoUrl}`;
      }
      const symbol = photoUrl.includes('?') ? '&' : '?';
      setPhotoPreview(`${photoUrl}${symbol}t=${timestamp}`);
    }
  }, [user, photoFile]);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    rt: user?.rt || '',
  });

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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoClick = () => {
    if (!uploadingPhoto) {
      setShowPhotoOptions(true);
    }
  };

  const handleSelectFromGallery = () => {
    setShowPhotoOptions(false);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const handleTakePhoto = () => {
    setShowPhotoOptions(false);
    setTimeout(() => {
      cameraInputRef.current?.click();
    }, 100);
  };

  const handleRemovePhoto = async () => {
    setShowPhotoOptions(false);

    if (!user?.photo) {
      toast.error(t('profile.noPhotoToRemove'));
      return;
    }

    try {
      setUploadingPhoto(true);
      const response = await authAPI.updateProfile({ removePhoto: true });

      if (response.success) {
        toast.success(t('profile.photoRemoved'));
        if (updateUser) {
          updateUser(response.data);
        }
        setPhotoPreview(null);
        setPhotoFile(null);
      } else {
        toast.error(response.message || t('profile.photoRemoveFailed'));
      }
    } catch (error) {
      console.error("Remove photo error:", error);
      toast.error(t('profile.errorOccurred'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.invalidFile'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('profile.fileTooLarge'));
      return;
    }

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoSave = async () => {
    if (!photoFile) {
      toast.error(t('profile.noPhotoSelected'));
      return;
    }

    setUploadingPhoto(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('photo', photoFile);

      const response = await authAPI.updateProfile(formDataUpload);

      if (response.success && response.data) {
        updateUser(response.data);

        let newPhotoUrl = response.data.photo;
        if (newPhotoUrl.startsWith('/') && !newPhotoUrl.startsWith('http')) {
          const apiBaseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
          newPhotoUrl = `${apiBaseUrl}${newPhotoUrl}`;
        }

        setPhotoPreview(`${newPhotoUrl}?t=${new Date().getTime()}`);
        toast.success(t('profile.photoUpdated'));
        setPhotoFile(null);
      }
    } catch (error) {
      console.error('Error updating photo:', error);
      toast.error(error.response?.data?.message || t('profile.photoUpdateFailed'));
      setPhotoPreview(user?.photo || null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoCancelChange = () => {
    setPhotoPreview(user?.photo || null);
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    toast.info(t('profile.photoChangeCancelled'));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('profile.nameRequired');
    if (!formData.email.trim()) {
      newErrors.email = t('profile.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('profile.emailInvalid');
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t('profile.phoneRequired');
    }
    if (!formData.rt) newErrors.rt = t('profile.rtRequired');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error(t('profile.fillAllFields'));
      return;
    }

    setLoading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('name', formData.name);
      formDataUpload.append('email', formData.email);
      formDataUpload.append('phone', formData.phone);
      formDataUpload.append('rt', formData.rt);

      const response = await authAPI.updateProfile(formDataUpload);

      if (response.success && response.data) {
        updateUser(response.data);
        toast.success(t('profile.profileUpdated'));
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || t.updateFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      rt: user?.rt || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
  };

  const handleWhatsAppAdmin = () => {
    // Coba buka dengan wa.me format, lebih kompatibel untuk mobile
    const phoneNumber = '62895378251954'; // Ganti dengan nomor admin
    const message = 'Halo Admin, saya ingin bertanya tentang aplikasi JagaKampung.';
    const encodedMessage = encodeURIComponent(message);

    // Format yang lebih kompatibel untuk mobile browser
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // Untuk Android, coba gunakan intent jika wa.me tidak berfungsi
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // Langsung buka dengan format intent untuk mobile
      window.location.href = whatsappURL;
    } else {
      // Untuk desktop, buka di tab baru
      window.open(whatsappURL, '_blank');
    }
  };

  // Open Language Modal and initialize temp selection
  const handleOpenLanguageModal = () => {
    setTempSelectedLanguage(currentLanguage);
    setShowLanguageModal(true);
  };

  // Confirm Language Change
  const handleConfirmLanguageChange = () => {
    if (tempSelectedLanguage !== currentLanguage) {
      setLanguage(tempSelectedLanguage);
      const langName = tempSelectedLanguage === 'id' ? 'Indonesia' : 'Inggris';
      toast.success(`${t('profile.languageChanged')} ${langName}`);
    }
    setShowLanguageModal(false);
  };

  // Menu Items Configuration
  const menuItems = [
    {
      iconImg: whatsappIcon,
      title: t('profile.contactAdmin'),
      subtitle: '',
      color: 'emerald',
      onClick: handleWhatsAppAdmin,
    },
    {
      iconImg: bahasaIcon,
      title: t('profile.changeLanguage'),
      subtitle: currentLanguage === 'id' ? t('profile.indonesia') : t('profile.english'),
      color: 'blue',
      onClick: handleOpenLanguageModal,
    },
    {
      iconImg: faqIcon,
      title: t('profile.help'),
      subtitle: '',
      color: 'black',
      onClick: () => setShowHelpModal(true),
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      emerald: 'bg-emerald-50 text-emerald-600',
      blue: 'bg-blue-50 text-blue-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600',
      red: 'bg-red-50 text-red-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handlePhotoChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Header with Background Image */}
      <div
        className="relative overflow-hidden pb-40"
        style={{
          backgroundImage: `url(${bgrImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>

        {/* Logo + Text Centered */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-4">
          <img src={logoPutih} alt="JagaKampung" className="h-7 w-auto" />
          <span className="text-white font-semibold text-lg tracking-wide">JagaKampung</span>
        </div>
      </div>

      {/* Card Container with Photo Overlay */}
      <div className="px-4 -mt-20 relative">
        {/* Profile Photo - Absolute positioned to overlap bg and card */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-14 z-30">
          <div className="relative group">
            <div
              className="w-28 h-28  p-1  relative overflow-hidden cursor-pointer"
              onClick={handlePhotoClick}
            >
              {photoPreview ? (
                <img
                  key={photoPreview}
                  src={photoPreview}
                  alt="Profil"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  className={`w-full h-full object-cover rounded-full border-2 border-white bg-slate-100 transition-opacity ${uploadingPhoto ? 'opacity-50' : 'group-hover:opacity-80'}`}
                />
              ) : null}

              {/* Fallback Icon User */}
              <div
                className={`w-full h-full rounded-full border-2 border-primary/20 bg-slate-100 flex items-center justify-center text-primary/50 group-hover:bg-slate-200 transition-colors ${photoPreview ? 'hidden' : 'flex'}`}
              >
                <User size={40} />
              </div>

              {/* Loading Overlay */}
              {uploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Camera Button - Same as Home */}
            {photoFile && !uploadingPhoto ? (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                <motion.button
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  onClick={(e) => { e.stopPropagation(); handlePhotoCancelChange(); }}
                  className="p-2 bg-red-500 rounded-full text-white shadow-lg hover:bg-red-600 border-2 border-white"
                >
                  <X size={16} strokeWidth={3} />
                </motion.button>

                <motion.button
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  onClick={(e) => { e.stopPropagation(); handlePhotoSave(); }}
                  className="p-2 bg-green-500 rounded-full text-white shadow-lg hover:bg-green-600 border-2 border-white"
                >
                  <Check size={16} strokeWidth={3} />
                </motion.button>
              </div>
            ) : (
              !uploadingPhoto && (
                <div
                  onClick={handlePhotoClick}
                  className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-100 group-hover:bg-blue-50 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <MaskedIcon src={IconCamera} size={14} color="#858585ff" alt="Edit Foto" />
                </div>
              )
            )}
          </div>
        </div>

        {/* Main Content Card - Combined Profile & Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl shadow-sm shadow-slate-200/60 overflow-hidden pt-16"
        >
          {/* Profile Info - Inside Card */}
          <div className="text-center pb-4 border-b border-slate-100 mx-5">
            <h2 className="text-xl font-bold text-slate-800">{user?.name || t('profile.user')}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{user?.email || '-'}</p>
          </div>

          {/* Biodata Section */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">


                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">{t('profile.manageProfile')}</h3>
              </div>
              {!isEditing && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-primary  bg-rounded font-medium flex items-center gap-1 hover:bg-primary/5 px-2 py-1 rounded-md transition-colors"
                >

                  {t('profile.edit')}
                </motion.button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {!isEditing ? (
                <motion.div
                  key="display"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {/* Info Display - Clean Design */}
                  <div className="space-y-3">
                    {/* Phone Number */}
                    <div className="border-b border-slate-100 pb-3">
                      <p className="text-xs text-slate-400 mb-1">{t.phoneNumber}</p>
                      <p className="text-sm font-medium text-slate-700">{user?.phone || '-'}</p>
                    </div>

                    {/* RT Location */}
                    <div className="pb-1">
                      <p className="text-xs text-slate-400 mb-1">{t.rtLocation}</p>
                      <p className="text-sm font-medium text-slate-700">RT {user?.rt || '-'}</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {/* Minimalist Edit Form */}
                  <div className="space-y-3">
                    {/* Name Input */}
                    <div className="relative">
                      <label className="text-xs text-slate-400 mb-1 block">{t('profile.fullName')}</label>
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-primary/30 focus-within:bg-white transition-all">
                        <User className="w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
                          placeholder={t('profile.enterName')}
                        />
                      </div>
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    {/* Email Input */}
                    <div className="relative">
                      <label className="text-xs text-slate-400 mb-1 block">{t('profile.email')}</label>
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-primary/30 focus-within:bg-white transition-all">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
                          placeholder={t('profile.enterEmail')}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    {/* Phone Input */}
                    <div className="relative">
                      <label className="text-xs text-slate-400 mb-1 block">{t('profile.phone')}</label>
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-primary/30 focus-within:bg-white transition-all">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
                          placeholder={t('profile.enterPhone')}
                        />
                      </div>
                      {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    </div>

                    {/* RT Select */}
                    <div className="relative">
                      <label className="text-xs text-slate-400 mb-1 block">{t('profile.rt')}</label>
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-primary/30 focus-within:bg-white transition-all">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <select
                          name="rt"
                          value={formData.rt}
                          onChange={handleChange}
                          className="flex-1 bg-transparent text-sm text-slate-700 outline-none appearance-none cursor-pointer"
                        >
                          <option value="">{t('profile.selectRT')}</option>
                          {rtOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                      </div>
                      {errors.rt && <p className="text-xs text-red-500 mt-1">{errors.rt}</p>}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancel}
                      disabled={loading}
                      className="flex-1 py-2.5 px-4 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                      {t('profile.cancel')}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>

                          {t('profile.save')}
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider Line */}
          <div className="mx-5 border-t border-slate-100"></div>

          {/* Settings Section */}
          <div className="p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {t('profile.settings')}
            </h3>

            <div className="space-y-1">
              {menuItems.map((item, index) => (
                <MenuItem key={index} {...item} getColorClasses={getColorClasses} />
              ))}
            </div>

            {/* Logout Button */}
            <div className="mt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                    <img src={keluarIcon} alt="Keluar" className="w-5 h-5" style={{ filter: 'invert(27%) sepia(94%) saturate(4619%) hue-rotate(345deg) brightness(91%) contrast(90%)' }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-black">{t('profile.logout')}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* App Version */}
      <div className="text-center mt-6 mb-4">
        <p className="text-xs text-slate-400">© 2026 JagaKampung. All rights reserved.</p>
      </div>

      {/* Bottom Sheet - Photo Options (Same as Home) */}
      <AnimatePresence>
        {showPhotoOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowPhotoOptions(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
              </div>

              {/* Title */}
              <div className="px-6 pb-4">
                <h3 className="text-lg font-semibold text-gray-800">{t('profile.selectMethod')}</h3>
              </div>

              {/* Options */}
              <div className="px-6 pb-2">
                {/* View photo library (Gallery) */}
                <button
                  onClick={handleSelectFromGallery}
                  className="w-full flex items-center gap-4 py-4 hover:bg-gray-50 transition-colors rounded-lg"
                >
                  <img
                    src={galleryIcon}
                    alt="Gallery"
                    className="w-6 h-6"
                    style={{ filter: 'grayscale(100%) brightness(0.3)' }}
                  />
                  <span className="text-base text-gray-700">{t('profile.viewGallery')}</span>
                </button>

                {/* Take a photo */}
                <button
                  onClick={handleTakePhoto}
                  className="w-full flex items-center gap-4 py-4 hover:bg-gray-50 transition-colors rounded-lg"
                >
                  <img
                    src={IconCamera}
                    alt="Camera"
                    className="w-6 h-6"
                    style={{ filter: 'grayscale(100%) brightness(0.3)' }}
                  />
                  <span className="text-base text-gray-700">{t('profile.takePhoto')}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="mx-6 border-t border-gray-200"></div>

              {/* Remove photo */}
              <div className="px-6 py-2 pb-8">
                <button
                  onClick={handleRemovePhoto}
                  className="w-full flex items-center gap-4 py-4 rounded-lg"
                  disabled={!user?.photo}
                >
                  <img
                    src={removeIcon}
                    alt="Remove"
                    className="w-6 h-6"
                    style={{
                      filter: user?.photo
                        ? 'invert(27%) sepia(94%) saturate(4619%) hue-rotate(345deg) brightness(91%) contrast(90%)'
                        : 'grayscale(100%) opacity(0.3)'
                    }}
                  />
                  <span className={`text-base ${user?.photo ? 'text-red-600' : 'text-gray-400'}`}>
                    {t.removePhoto}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title={t('profile.logoutConfirm')}
        message={t('profile.logoutMessage')}
        confirmText={t('profile.yesLogout')}
        cancelText={t('profile.cancel')}
        confirmVariant="danger"
      />

      {/* Help Modal - FAQ Accordion Style */}
      <AnimatePresence>
        {showHelpModal && (
          <HelpFAQModal onClose={() => setShowHelpModal(false)} t={t} />
        )}
      </AnimatePresence>

      {/* Language Selection Modal - Redesigned Bottom Sheet */}
      <AnimatePresence>
        {showLanguageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowLanguageModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Indicator Bar at Top */}
              <div className="flex justify-center pt-3 pb-4">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>

              {/* Icon + Title Section */}
              <div className="flex flex-col items-center px-6 pb-6 pt-2">
                {/* Blue Circle with Language Icon */}
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <MaskedIcon src={languageIcon} size={40} color="#2563eb" alt="Language" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900">{t('profile.selectLanguage')}</h3>
              </div>

              {/* Language Options */}
              <div className="px-6 pb-6 space-y-3">
                {/* English Option */}
                <button
                  onClick={() => setTempSelectedLanguage('en')}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all hover:bg-gray-50"
                  style={{
                    borderColor: tempSelectedLanguage === 'en' ? '#2563eb' : '#e5e7eb',
                    backgroundColor: tempSelectedLanguage === 'en' ? '#eff6ff' : '#ffffff'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <img src={enFlag} alt="English" className="w-8 h-8 object-contain" />
                    <span className="text-base font-medium text-gray-900">English</span>
                  </div>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center border-2"
                    style={{
                      borderColor: tempSelectedLanguage === 'en' ? '#2563eb' : '#d1d5db',
                      backgroundColor: tempSelectedLanguage === 'en' ? '#2563eb' : 'transparent'
                    }}
                  >
                    {tempSelectedLanguage === 'en' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                    )}
                  </div>
                </button>

                {/* Indonesian Option */}
                <button
                  onClick={() => setTempSelectedLanguage('id')}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all hover:bg-gray-50"
                  style={{
                    borderColor: tempSelectedLanguage === 'id' ? '#2563eb' : '#e5e7eb',
                    backgroundColor: tempSelectedLanguage === 'id' ? '#eff6ff' : '#ffffff'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <img src={idFlag} alt="Bahasa Indonesia" className="w-8 h-8 object-contain" />
                    <span className="text-base font-medium text-gray-900">Bahasa Indonesia</span>
                  </div>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center border-2"
                    style={{
                      borderColor: tempSelectedLanguage === 'id' ? '#2563eb' : '#d1d5db',
                      backgroundColor: tempSelectedLanguage === 'id' ? '#2563eb' : 'transparent'
                    }}
                  >
                    {tempSelectedLanguage === 'id' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                    )}
                  </div>
                </button>
              </div>

              {/* Confirm Button */}
              <div className="px-6 pb-6">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmLanguageChange}
                  className="w-full py-4 rounded-2xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition-colors"
                >
                  {t('profile.changeLanguageTitle')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Info Item Component
const InfoItem = ({ icon: Icon, label, value, color, fullWidth }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-500',
    emerald: 'bg-emerald-50 text-emerald-500',
    purple: 'bg-purple-50 text-purple-500',
    orange: 'bg-orange-50 text-orange-500',
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 ${fullWidth ? 'col-span-2' : ''}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
};

// Menu Item Component
const MenuItem = ({ iconImg, title, subtitle, color, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center">
        <img
          src={iconImg}
          alt={title}
          className="w-5 h-5"
          style={{
            filter: color === 'emerald'
              ? 'invert(48%) sepia(79%) saturate(2475%) hue-rotate(142deg) brightness(97%) contrast(91%)'
              : color === 'blue'
                ? 'invert(47%) sepia(96%) saturate(1821%) hue-rotate(192deg) brightness(99%) contrast(101%)'
                : 'brightness(0)'
          }}
        />
      </div>
      <div className="text-left">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
  </motion.button>
);

// Help Item Component
const HelpItem = ({ emoji, title, description }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
    <span className="text-xl">{emoji}</span>
    <div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
    </div>
  </div>
);

// FAQ Data
const faqData = [
  {
    question: "Bagaimana cara melihat jadwal ronda?",
    answer: "Buka menu Jadwal, lalu anda bisa pilih filter rt yang sesuai dengan rt yang anda pilih, lalu lihat data jadwal pada tabel yang telah ada"
  },
  {
    question: "Bagaimana cara melakukan absensi?",
    answer: "Buka menu Absensi, lalu klik tombol 'Masuk' saat mulai ronda dan 'Pulang' setelah selesai. Pastikan untuk mengambil foto selfie sebagai bukti kehadiran."
  },
  {
    question: "Bagaimana cara mengubah foto profil?",
    answer: "Buka halaman Profil, klik pada foto profil Anda, pilih 'Lihat galeri' untuk memilih foto dari galeri atau 'Ambil foto' untuk menggunakan kamera."
  },
  {
    question: "Bagaimana cara membuat laporan?",
    answer: "Buka menu Laporan, klik tombol 'Buat Laporan', isi detail kejadian seperti judul, deskripsi, dan lampirkan foto jika diperlukan, lalu kirim."
  },
  {
    question: "Mengapa saya tidak menerima notifikasi?",
    answer: "Pastikan notifikasi aplikasi diaktifkan di pengaturan perangkat Anda. Periksa juga koneksi internet dan pastikan Anda sudah login dengan benar."
  }
];

// Help FAQ Modal Component  
const HelpFAQModal = ({ onClose, t }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{t('profile.faq')}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t('profile.faqDesc')}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-2">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="border border-slate-100 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleExpand(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-700 pr-3">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: expandedIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {expandedIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0">
                        <p className="text-xs text-slate-500 leading-relaxed">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-400 text-center">
            {t('profile.otherQuestions')}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Profile;