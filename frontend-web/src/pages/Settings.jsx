import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Loader2, Mail, Phone, MapPin, User, Lock, Save, ShieldCheck, CheckCircle2, Edit3, X, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import bgSet from '../assets/bg-set.png';
import batikBg from '../assets/batik.png';
import { authAPI } from '../api/auth';
import { useAuth } from '../context/AuthContext';

// Komponen Input Reusable
const InputGroup = ({ label, icon, type = "text", readOnly = false, ...props }) => {
  const IconComp = icon;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="mb-4">
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className={`relative group ${readOnly ? 'opacity-75' : ''}`}>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
          <IconComp size={18} />
        </div>
        <input
          type={currentType}
          readOnly={readOnly}
          disabled={readOnly}
          className={`w-full rounded-xl border py-3 pl-11 ${isPassword ? 'pr-12' : 'pr-4'} text-slate-800 outline-none transition-all sm:text-sm
              ${readOnly 
                  ? 'bg-slate-100 border-slate-200 cursor-default text-slate-600' 
                  : 'bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
              }`}
          {...props}
        />
        {isPassword && !readOnly && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

const Settings = () => {
  const { user: authUser, setUser, isAdmin } = useAuth();
  const fileInputRef = useRef(null);
  
  // State
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', rt: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Custom Dropdown State
  const [isRTOpen, setIsRTOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const rtRef = useRef(null); // Ref for the button container
  const dropdownRef = useRef(null); // Ref for the dropdown itself
  
  // Loading States
  const [isSaving, setIsSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Fungsi untuk mendapatkan posisi dropdown dengan benar
  const updateDropdownPosition = () => {
    if (rtRef.current) {
      const rect = rtRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 240; // Approximate max height
      
      // Cek apakah dropdown akan keluar dari viewport di bagian bawah
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      let topPosition;
      let maxHeight;
      
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        // Jika tidak ada cukup space di bawah, tampilkan di atas
        topPosition = rect.top - dropdownHeight - 5;
        maxHeight = Math.min(dropdownHeight, spaceAbove - 10);
      } else {
        // Tampilkan di bawah
        topPosition = rect.bottom + 5;
        maxHeight = Math.min(dropdownHeight, spaceBelow - 10);
      }
      
      setDropdownPos({
        top: topPosition,
        left: rect.left,
        width: rect.width,
        maxHeight: maxHeight
      });
    }
  };

  const handleRTToggle = () => {
    if (!isRTOpen) {
      updateDropdownPosition();
      setIsRTOpen(true);
    } else {
      setIsRTOpen(false);
    }
  };

  // Click Outside Handler for RT Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close if clicking outside both the button (rtRef) and the dropdown (dropdownRef)
      if (
        rtRef.current && !rtRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsRTOpen(false);
      }
    };
    
    // Handler untuk resize window
    const handleResize = () => {
      if (isRTOpen) {
        updateDropdownPosition();
      }
    };
    
    // Handler untuk scroll window - hanya tutup jika scroll jauh dari dropdown
    const handleScroll = () => {
      if (isRTOpen && dropdownRef.current) {
        const dropdownRect = dropdownRef.current.getBoundingClientRect();
        // Hanya tutup jika dropdown sudah tidak terlihat
        if (
          dropdownRect.bottom < 0 ||
          dropdownRect.top > window.innerHeight ||
          dropdownRect.right < 0 ||
          dropdownRect.left > window.innerWidth
        ) {
          setIsRTOpen(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isRTOpen]);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const res = await authAPI.getMe();
        if (res.success) {
          const { name, email, phone, rt, photo } = res.data;
          setProfileData({ 
            name: name || '', 
            email: email || '', 
            phone: phone || '', 
            rt: rt || '' 
          });
          setPhotoPreview(photo);
        }
      } catch {
        toast.error('Gagal memuat data user');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);
  
  // --- Handlers ---
  const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('photo', file);
      setPhotoUploading(true);
      try {
        const res = await authAPI.updateProfile(formData);
        if (res.success) {
            toast.custom(() => (
                <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-green-100 flex items-center gap-2">
                    <CheckCircle2 className="text-green-500" size={20}/> <span className="text-sm font-medium">Foto diperbarui!</span>
                </div>
            ));
            setUser({ ...authUser, ...res.data });
        } else {
            toast.error(res.message);
        }
      } catch {
        toast.error('Gagal upload foto');
      } finally {
        setPhotoUploading(false);
      }
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    try {
        // Validate Password if filled
        if (passwordData.newPassword || passwordData.currentPassword) {
            if (passwordData.newPassword !== passwordData.confirmNewPassword) {
                toast.error('Password baru tidak cocok');
                setIsSaving(false);
                return;
            }
            if (!passwordData.currentPassword) {
                toast.error('Masukkan password saat ini untuk mengubah password');
                setIsSaving(false);
                return;
            }
            if (passwordData.newPassword.length < 6) {
                toast.error('Password baru minimal 6 karakter');
                setIsSaving(false);
                return;
            }
        }

        // Prepare Data
        const formData = new FormData();
        formData.append('name', profileData.name);
        formData.append('phone', profileData.phone);
        if (isAdmin) formData.append('rt', profileData.rt);
        
        // Append password data if attempting change
        if (passwordData.newPassword && passwordData.currentPassword) {
            formData.append('currentPassword', passwordData.currentPassword);
            formData.append('newPassword', passwordData.newPassword);
        }

        const res = await authAPI.updateProfile(formData);
        
        if (res.success) {
            toast.success('Perubahan berhasil disimpan');
            setUser({ ...authUser, ...res.data });
            setIsEditing(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } else {
            toast.error(res.message);
        }

    } catch (error) {
        console.error(error);
        toast.error('Gagal menyimpan perubahan');
    } finally {
        setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    setProfileData({
        name: authUser.name || '',
        email: authUser.email || '',
        phone: authUser.phone || '',
        rt: authUser.rt || ''
    });
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[70vh] gap-3">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <span className="text-slate-400 text-sm font-medium">Memuat Profil...</span>
    </div>
  );
  
  return (
    <div className="relative font-sans min-h-screen w-full">
      {/* Batik Background - Full Width with Silhouette Effect */}
      <div 
        className="fixed inset-0 w-full h-full z-0"
        style={{ 
          backgroundImage: `url(${batikBg})`, 
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
          backgroundPosition: 'center top',
          opacity: '0.08',
          filter: 'grayscale(100%) contrast(150%)'
        }}
      />

      {/* Background Layer Top */}
      <div className="fixed left-0 top-0 w-full h-[340px] z-[1]">
        <img 
          src={bgSet} 
          alt="Background Pattern" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen py-8 px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          {/* --- Combined Card --- */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden max-h-[85vh] flex flex-col">
            
            {/* Top Section: Hero/Avatar (Integrated) - Fixed */}
            <div className="relative bg-slate-50/50 p-8 border-b border-slate-100 flex-shrink-0">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative group shrink-0">
                  <div className="h-28 w-28 rounded-full p-1 bg-white border-2 border-blue-100 shadow-md">
                    <img
                      src={photoPreview || `https://ui-avatars.com/api/?name=${profileData.name}&background=random`}
                      alt="Avatar"
                      className="h-full w-full object-cover rounded-full"
                    />
                  </div>
                  {isEditing && (
                    <button 
                      onClick={() => fileInputRef.current.click()}
                      disabled={photoUploading}
                      className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-70"
                      title="Ganti Foto"
                    >
                      {photoUploading ? <Loader2 className="animate-spin w-4 h-4"/> : <Camera size={16} />}
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" />
                </div>

                {/* Basic Info Display */}
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-bold text-slate-800 mb-1">{profileData.name}</h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {isAdmin ? 'Admin' : 'Warga'}
                    </span>
                    <span className="text-slate-400 text-sm">•</span>
                    <span className="text-slate-500 text-sm">{profileData.email}</span>
                  </div>
                </div>
                
                {/* Edit Toggle Button (Visible when NOT editing) */}
                {!isEditing && (
                  <div className="md:ml-auto mt-4 md:mt-0">
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                      
                      Edit Profil
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Details / Edit Form - Scrollable */}
            <div className="p-8 overflow-y-auto flex-1">
              {!isEditing ? (
                /* --- VIEW MODE (Clean) --- */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 h-full content-start">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nama Lengkap</span>
                    <p className="text-lg font-medium text-slate-800">{profileData.name}</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email</span>
                    <p className="text-lg font-medium text-slate-800">{profileData.email}</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">No. Telepon</span>
                    <p className="text-lg font-medium text-slate-800">{profileData.phone || '-'}</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Wilayah</span>
                    <p className="text-lg font-medium text-slate-800">
                      {profileData.rt ? `RT ${profileData.rt}` : 'Surabaya'}
                    </p>
                  </div>
                </div>
              ) : (
                /* --- EDIT MODE --- */
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1: Personal Info */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        
                        Data Diri
                      </h3>
                      <InputGroup 
                        label="Nama Lengkap" 
                        name="name" 
                        icon={User} 
                        value={profileData.name} 
                        onChange={handleProfileChange} 
                        placeholder="Masukkan nama..."
                      />
                      <InputGroup 
                        label="Nomor Telepon" 
                        name="phone" 
                        icon={Phone} 
                        value={profileData.phone} 
                        onChange={handleProfileChange} 
                        placeholder="0812..."
                      />
                      <InputGroup 
                        label="Email (Tetap)" 
                        name="email" 
                        icon={Mail} 
                        value={profileData.email} 
                        readOnly 
                      />
                      
                      {/* RT Dropdown Section - Fixed */}
                      {isAdmin && (
                        <div className="mb-4">
                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Wilayah RT
                          </label>
                          <div className="relative">
                            <button
                              ref={rtRef}
                              type="button"
                              onClick={handleRTToggle}
                              className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 flex items-center justify-between gap-2 hover:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <MapPin size={18} className="text-slate-400" />
                                <span>{profileData.rt ? `RT ${profileData.rt}` : 'Pilih RT'}</span>
                              </div>
                              <ChevronDown size={16} className={`text-slate-400 transition-transform ${isRTOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Portal untuk dropdown - Fixed Position */}
                            {isRTOpen && createPortal(
                              <AnimatePresence>
                                <motion.div
                                  ref={dropdownRef}
                                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                  transition={{ duration: 0.15 }}
                                  style={{
                                    position: 'fixed',
                                    top: dropdownPos.top,
                                    left: dropdownPos.left,
                                    width: dropdownPos.width,
                                    zIndex: 9999,
                                  }}
                                  className="bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-300/50 overflow-hidden"
                                  onClick={(e) => e.stopPropagation()} // Prevent click from closing immediately
                                >
                                  {/* Scrollable container with fixed max height */}
                                  <div 
                                    className="overflow-y-auto"
                                    style={{ 
                                      maxHeight: dropdownPos.maxHeight || '240px',
                                      scrollBehavior: 'smooth'
                                    }}
                                  >
                                    {[1, 2, 3, 4, 5, 6].map((num) => {
                                      const rtValue = String(num).padStart(2, '0');
                                      const isSelected = profileData.rt === rtValue;
                                      return (
                                        <div
                                          key={num}
                                          onClick={() => {
                                            setProfileData({...profileData, rt: rtValue});
                                            setIsRTOpen(false);
                                          }}
                                          className={`px-4 py-3 text-sm cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between ${isSelected ? 'text-blue-600 font-medium bg-blue-50/50' : 'text-slate-600'}`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <MapPin size={14} className={isSelected ? 'text-blue-500' : 'text-slate-400'} />
                                            <span>RT {rtValue}</span>
                                          </div>

                                        </div>
                                      );
                                    })}
                                  </div>
                                  
                                  {/* Optional: Add a subtle gradient at bottom when scrolling */}
                                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white/80 to-transparent pointer-events-none"></div>
                                </motion.div>
                              </AnimatePresence>,
                              document.body
                            )}
                          </div>
                          
                          
                        </div>
                      )}
                    </div>

                    {/* Column 2: Security */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        
                        Ganti Password
                      </h3>
                      
                      <InputGroup 
                        label="Password Saat Ini" 
                        name="currentPassword" 
                        type="password"
                        icon={Lock} 
                        value={passwordData.currentPassword} 
                        onChange={handlePasswordChange} 
                        placeholder="••••••••"
                      />
                      <div className="grid grid-cols-1 gap-2">
                        <InputGroup 
                          label="Password Baru" 
                          name="newPassword" 
                          type="password"
                          icon={Lock} 
                          value={passwordData.newPassword} 
                          onChange={handlePasswordChange} 
                          placeholder="Min. 6 karakter"
                        />
                        <InputGroup 
                          label="Konfirmasi Password" 
                          name="confirmNewPassword" 
                          type="password"
                          icon={ShieldCheck} 
                          value={passwordData.confirmNewPassword} 
                          onChange={handlePasswordChange} 
                          placeholder="Ulangi password"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="px-6 py-3 rounded-xl text-slate-600 font-medium hover:bg-slate-100 transition-colors flex items-center gap-2"
                    >
                
                      Batal
                    </button>
                    <button 
                      type="button"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-slate-200 hover:shadow-xl active:scale-[0.98] flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                        
                          Simpan
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;