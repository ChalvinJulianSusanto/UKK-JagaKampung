
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import {
  Bell,
  Clock,
  User,
  Check, // Icon Centang
  X,     // Icon Silang
  Loader2,
  MapPin,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

// --- ASSETS ---
import checkIcon from '../assets/check.png';
import iconKehadiran from '../assets/centang.png';
import bgrImage from '../assets/bgr.png';
import gambarIcon from '../assets/gambar.png';
import logoPutih from '../assets/putih.png';

import IconCamera from '../assets/cam.png';
import iconIn from '../assets/in.png';
import iconOut from '../assets/out.png';
import galleryIcon from '../assets/img.png';
import removeIcon from '../assets/remove.png';
import heartIcon from '../assets/heart.png';
import sedihIcon from '../assets/broken.png';
import hatiIcon from '../assets/heart.png';
import ngananIcon from '../assets/nganan.png';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
// Gunakan authAPI untuk update profil, dashboardAPI untuk statistik
import { attendancesAPI, authAPI, notificationsAPI, schedulesAPI, activitiesAPI, financeAPI } from '../api';
import { getTodayPartner } from '../api/schedules';
import { Button, Badge, Loading, EmptyState, Modal } from '../components/common';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isBefore, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

// --- HELPER COMPONENTS ---
import FinancialReportsSection from '../components/FinancialReportsSection';

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

const getTimeBasedGreeting = (language = 'id') => {
  const hour = new Date().getHours();
  if (language === 'en') {
    if (hour >= 0 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 15) return 'Good Afternoon';
    return 'Good Evening';
  }
  // Indonesian
  if (hour >= 0 && hour < 12) return 'Selamat Pagi';
  if (hour >= 12 && hour < 15) return 'Selamat Siang';
  return 'Selamat Malam';
};

// --- ANIMASI TEKS ---
const AnimatedInfoText = () => {
  const { t } = useLanguage();
  const [showDate, setShowDate] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowDate((prev) => !prev);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const dateText = format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id });
  const staticText = t('home.rwText');

  return (
    <div className="h-6 overflow-hidden relative flex items-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={showDate ? 'date' : 'static'}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="text-sm font-medium text-blue-50/90 absolute w-full tracking-wide"
        >
          {showDate ? <span>{dateText}</span> : <span>{staticText}</span>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const AnimatedNavbarText = ({ userRt }) => {
  const { t } = useLanguage();
  const [showRt, setShowRt] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowRt((prev) => !prev);
    }, 50000);
    return () => clearInterval(interval);
  }, []);

  // Assuming userRt is just the number/identifier "05" etc.
  // If it's missing, default to "05" (matching original fallback logic roughly)
  const rtValue = userRt || '05';

  return (
    <div className="h-5 overflow-hidden relative flex items-center justify-start min-w-[50px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={showRt ? 'rt' : 'rw'}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {showRt ? <span>{t('home.rt')} {rtValue}</span> : <span>{t('home.rw')} 01</span>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};


// --- 1. HEADER PROFIL (DENGAN BOTTOM SHEET UPLOAD PHOTO) ---
const ProfileHeader = ({ user, navigate, unreadCount = 0, t }) => {
  const { updateUser } = useAuth();
  const { currentLanguage } = useLanguage(); // Get language at component level
  const [greeting, setGreeting] = useState('');

  // STATE untuk gambar
  const [displayImage, setDisplayImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // STATE untuk bottom sheet popup
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Effect: Sinkronisasi saat user load
  useEffect(() => {
    if (user?.photo && !selectedFile) {
      const timestamp = new Date().getTime();
      let photoUrl = user.photo;
      if (photoUrl.startsWith('/') && !photoUrl.startsWith('http')) {
        const apiBaseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
        photoUrl = `${apiBaseUrl}${photoUrl}`;
      }

      const symbol = photoUrl.includes('?') ? '&' : '?';
      setDisplayImage(`${photoUrl}${symbol}t=${timestamp}`);
    }

    // Update greeting based on time
    const hour = new Date().getHours();
    let timeKey = 'morning';
    if (hour >= 12 && hour < 15) timeKey = 'afternoon';
    else if (hour >= 15) timeKey = 'evening';

    setGreeting(t(`home.greeting.${timeKey}`));
  }, [user?.photo, currentLanguage, t]);

  // Effect: Body scroll lock for modal
  useEffect(() => {
    if (showPhotoOptions) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPhotoOptions]);

  const handlePhotoClick = () => {
    if (!isUploading) {
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
      toast.error(t('home.noPhotoToRemove'));
      return;
    }

    try {
      setIsUploading(true);
      const response = await authAPI.updateProfile({ removePhoto: true });

      if (response.success) {
        toast.success(t('home.photoRemoved'));
        if (updateUser) {
          updateUser(response.data);
        }
        setDisplayImage(null);
        setSelectedFile(null);
      } else {
        toast.error(response.message || t('home.photoRemoveFailed'));
      }
    } catch (error) {
      console.error("Remove photo error:", error);
      toast.error(t('home.errorRemovingPhoto'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(t('home.invalidFile'));
        return;
      }
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setDisplayImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelPreview = () => {
    setSelectedFile(null);
    if (user?.photo) {
      const timestamp = new Date().getTime();
      let photoUrl = user.photo;
      if (photoUrl.startsWith('/') && !photoUrl.startsWith('http')) {
        const apiBaseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
        photoUrl = `${apiBaseUrl}${photoUrl}`;
      }
      setDisplayImage(`${photoUrl}?t=${timestamp}`);
    } else {
      setDisplayImage(null);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleSavePhoto = async (e) => {
    e.stopPropagation();
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('photo', selectedFile);

    try {
      const response = await authAPI.updateProfile(formData);

      if (response.success) {
        toast.success(t('home.photoSaved'));

        if (updateUser) {
          updateUser(response.data);
        }

        let newPhotoUrl = response.data.photo;
        if (newPhotoUrl.startsWith('/') && !newPhotoUrl.startsWith('http')) {
          const apiBaseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
          newPhotoUrl = `${apiBaseUrl}${newPhotoUrl}`;
        }

        const timestamp = new Date().getTime();
        const symbol = newPhotoUrl.includes('?') ? '&' : '?';
        const finalUrl = `${newPhotoUrl}${symbol}t=${timestamp}`;

        setDisplayImage(finalUrl);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";

      } else {
        toast.error(response.message || t('home.photoSaveFailed'));
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t('home.errorUploading'));
      handleCancelPreview();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="text-white relative overflow-hidden pb-24 rounded-b-2xl"
      style={{ backgroundImage: `url(${bgrImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>

      <div className="px-5 pt-6 pb-2 flex justify-between items-center relative z-10">
        <div className="w-8"></div>
        <div className="flex items-center space-x-2 text-white font-semibold text-base">
          <img src={logoPutih} alt="Logo" className="h-6 w-auto" />
          <div className="h-5 border-r border-white/50 ml-1"></div>
          <AnimatedNavbarText userRt={user?.rt} />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-full hover:bg-white/20 transition-colors"
          onClick={() => navigate('/notifications')}
        >
          <Bell className="w-5 h-5 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-red-500 rounded-full px-1 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </motion.button>
      </div>

      <div className="px-6 pt-4 flex items-center justify-between relative z-10">
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-blue-100 text-sm mb-1 font-medium">
            {t('home.helloComma')} {greeting}
          </p>
          <h1 className="text-2xl font-bold truncate leading-tight mb-2">
            {user?.name || t('home.user')}
          </h1>
          <div className="mt-1">
            <AnimatedInfoText />
          </div>
        </div>

        {/* KANAN: Foto Profil */}
        <div className="flex-shrink-0 relative group">
          <div
            className="w-24 h-24 rounded-full p-1 bg-white/20 backdrop-blur-sm shadow-xl relative overflow-hidden cursor-pointer"
            onClick={handlePhotoClick}
          >
            {displayImage ? (
              <img
                key={displayImage}
                src={displayImage}
                alt="Profil"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                className={`w-full h-full object-cover rounded-full border-2 border-white bg-white transition-opacity ${isUploading ? 'opacity-50' : 'group-hover:opacity-80'}`}
              />
            ) : null}

            {/* Fallback Icon User */}
            <div
              className={`w-full h-full rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-white group-hover:bg-blue-400 transition-colors ${displayImage ? 'hidden' : 'flex'}`}
            >
              <User size={32} />
            </div>

            {!selectedFile && !isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-md">
                  <MaskedIcon src={gambarIcon} size={24} color="#FFFFFF" alt="Edit Foto" />
                </div>
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>

          {selectedFile && !isUploading ? (
            <div className="absolute -bottom-2 -left-2 w-[120%] flex justify-center gap-2 z-20">
              <motion.button
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                onClick={(e) => { e.stopPropagation(); handleCancelPreview(); }}
                className="p-2 bg-red-500 rounded-full text-white shadow-lg hover:bg-red-600 border-2 border-white"
              >
                <X size={16} strokeWidth={3} />
              </motion.button>

              <motion.button
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                onClick={handleSavePhoto}
                className="p-2 bg-green-500 rounded-full text-white shadow-lg hover:bg-green-600 border-2 border-white"
              >
                <Check size={16} strokeWidth={3} />
              </motion.button>
            </div>
          ) : (
            !isUploading && (
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

      {/* BOTTOM SHEET POPUP - Upload Photo Options */}
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
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.2 }}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 100 || velocity.y > 500) {
                  setShowPhotoOptions(false);
                }
              }}
              className="bg-white w-full max-w-md rounded-t-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
              </div>

              {/* Title */}
              <div className="px-6 pb-4">
                <h3 className="text-lg font-semibold text-gray-800">{t('home.selectMethod')}</h3>
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
                  <span className="text-base text-gray-700">{t('home.viewGallery')}</span>
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
                  <span className="text-base text-gray-700">{t('home.takePhoto')}</span>
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
                    {t('home.removePhoto')}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- 2. STAT & JADWAL (SAMA SEPERTI SEBELUMNYA) ---
const JadwalCard = ({ title, time, icon, variant = 'white', iconColor = '#000000', attendance = null, type = null }) => {
  // Check if user has completed attendance for this type
  const hasAttendance = attendance && attendance.approved !== false;

  // Determine dynamic styling based on attendance
  let bgClass, textClass, displayIconColor, displayTime, displayTitle;

  if (hasAttendance) {
    // User has completed attendance - show actual time with colored background
    displayTime = format(new Date(attendance.date), "HH:mm");

    if (type === 'masuk') {
      bgClass = 'bg-green-500';
      textClass = 'text-white';
      displayIconColor = '#FFFFFF';
      displayTitle = title; // Keep original title
    } else if (type === 'pulang') {
      bgClass = 'bg-red-500';
      textClass = 'text-white';
      displayIconColor = '#FFFFFF';
      displayTitle = title;
    } else {
      // Fallback for other types
      bgClass = variant === 'white' ? 'bg-white' : 'bg-[#FFFDE7]';
      textClass = variant === 'white' ? 'text-gray-800' : 'text-yellow-900';
      displayIconColor = iconColor;
      displayTitle = title;
      displayTime = time;
    }
  } else {
    // No attendance yet - show scheduled time with white background
    bgClass = variant === 'white' ? 'bg-white' : 'bg-[#FFFDE7]';
    textClass = variant === 'white' ? 'text-gray-800' : 'text-yellow-900';
    displayIconColor = iconColor;
    displayTitle = title;
    displayTime = time; // Show scheduled time
  }

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`${bgClass} rounded-2xl p-4 shadow-sm relative overflow-hidden h-24 flex items-center justify-between transition-all duration-300`}
    >
      <div className="flex flex-col justify-center">
        <span className={`text-sm font-medium mb-0.5 ${hasAttendance ? 'text-white/90' : 'text-gray-500'}`}>
          {displayTitle}
        </span>
        <h3 className={`text-2xl font-bold ${textClass} tracking-tight`}>
          {displayTime}
        </h3>
      </div>
      <div className="flex items-center justify-center">
        <MaskedIcon src={icon} color={displayIconColor} size={26} alt={title} />
      </div>
    </motion.div>
  );
};




// --- 3. PARTNER CARD ---
// Helper to separate logic for a single partner item
const PartnerItem = ({ partner }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    const apiBaseUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : 'http://localhost:5000';
    return `${apiBaseUrl}${photoPath}`;
  };

  const photoUrl = getPhotoUrl(partner.photo);


  return (
    <div className="flex items-center px-3 relative overflow-hidden flex-1 min-w-0 py-2">
      {/* Profile Photo */}
      <div className="flex-shrink-0 mr-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm overflow-hidden relative shadow-sm border-2 border-white">
          {photoUrl && (
            <img
              src={photoUrl}
              alt={partner.guardName}
              className="w-full h-full object-cover absolute inset-0"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          )}
          <span className={`${photoUrl ? 'hidden' : 'flex'}`}>{getInitials(partner.guardName)}</span>
        </div>
      </div>

      {/* Info - Name Only */}
      <div className="flex-1 flex justify-center">
        <h3 className="text-base font-roboto sans-serif font-semibold text-gray-800 truncate">{partner.guardName}</h3>
      </div>
    </div>
  );
};

// Component to render a row (card) containing up to 2 partners
const PartnerRow = ({ partners }) => {
  const [p1, p2] = partners;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl px-2 py-2 shadow-sm border border-gray-100 flex items-center relative overflow-hidden"
    >
      <PartnerItem partner={p1} />

      {p2 && (
        <>
          <div className="h-8 w-px bg-gray-200 mx-1"></div>
          <PartnerItem partner={p2} />
        </>
      )}

      {/* If only 1 partner, add empty space to maintain layout if needed, or let it take up space. 
          For now, allowing the single item to sit on the left is fine. */}
    </motion.div>
  );
};

// --- 4. ATTENDANCE CALENDAR CARD ---
const AttendanceCalendar = ({ navigate }) => {
  const { currentLanguage, t } = useLanguage();
  const [monthlyAttendances, setMonthlyAttendances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthlyAttendances();
  }, []);

  const fetchMonthlyAttendances = async () => {
    try {
      setLoading(true);
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());

      const response = await attendancesAPI.getMyAttendanceHistory({
        limit: 100,
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd')
      });

      if (response.success && response.data) {
        setMonthlyAttendances(response.data);
      }
    } catch (error) {
      console.error('Error fetching monthly attendances:', error);
    } finally {
      setLoading(false);
    }
  };

  // Day names (Indonesian short)
  const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  // Get current week (7 days starting from Monday of current week)
  const today = new Date();
  const currentDayOfWeek = getDay(today);

  // Calculate days to subtract to get to Monday (if Sunday, go back 6 days)
  const daysToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

  // Get the Monday of current week
  const mondayOfWeek = new Date(today);
  mondayOfWeek.setDate(today.getDate() - daysToMonday);

  // Generate 7 days starting from Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(mondayOfWeek);
    day.setDate(mondayOfWeek.getDate() + i);
    return day;
  });

  // Check if user attended on a specific date
  const getAttendanceStatus = (date) => {
    const today = startOfDay(new Date());
    const checkDate = startOfDay(date);

    // Future dates
    if (isBefore(today, checkDate)) {
      return 'future';
    }

    // Check if user has attendance on this date
    const attendance = monthlyAttendances.find(att =>
      isSameDay(new Date(att.date), checkDate)
    );

    if (attendance) {
      // Check if it's an approved attendance (hadir)
      if (attendance.status === 'hadir' && attendance.approved !== false) {
        return 'attended';
      }
      // If there's an attendance but status is not 'hadir' or not approved
      return 'absent';
    }

    // Past dates without attendance
    return 'absent';
  };

  // Count attendance days this month
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const attendedDays = daysInMonth.filter(day => getAttendanceStatus(day) === 'attended').length;

  // Check if day is today
  const isToday = (date) => isSameDay(date, new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      {/* Calendar Card with Blue Background */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-500">
        {/* Title and Link at Top Inside Blue Container */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-800">{t('home.attendanceCalendarTitle')}</h2>
          </div>
          {/* See More Link */}
          <button
            onClick={() => navigate('/attendance-calendar')}
            className="text-sm text-blue-600 font-medium hover:text-blue-700"
          >
            {t('home.seeMore')}
          </button>
        </div>
        {/* White Calendar Card */}
        <div className="bg-white rounded-xl p-4 mb-3">
          {/* Heart Icon + Stats Inside White Card */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <MaskedIcon
                src={hatiIcon}
                color="#155fffff"
                size={32}
                alt="Heart"
              />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">{attendedDays} hari</p>
              <p className="text-xs text-gray-500">
                {format(new Date(), 'MMMM yyyy', { locale: id })}
              </p>
            </div>
          </div>

          {/* Day names header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day, idx) => (
              <div key={idx} className="text-center text-xs font-semibold text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Week days with hearts */}
          <div className="grid grid-cols-7 gap-2">

            {weekDays.map((day, idx) => {
              const status = getAttendanceStatus(day);
              const isTodayDay = isToday(day);
              const showTodaySpecial = isTodayDay && status !== 'attended';
              let icon, iconColor;

              if (status === 'attended') {
                icon = heartIcon;
                iconColor = '#2563EB'; // Blue
              } else if (status === 'absent') {
                icon = sedihIcon;
                iconColor = '#c0c1c2ff'; // Light gray
              } else { // future
                icon = hatiIcon;
                iconColor = '#E5E7EB'; // Very light gray
              }

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center py-2"
                >

                  {showTodaySpecial ? (
                    /* Today's cell: Heart with scanning border */
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      {/* Animated border wrapper with inline styles for better compatibility */}
                      <div
                        className="absolute inset-0 rounded-xl"
                        style={{
                          border: '3px dashed #2563eb',
                          animation: 'border-scan 1.5s ease-in-out infinite'
                        }}
                      />
                      {/* Heart icon as base */}
                      <MaskedIcon
                        src={heartIcon}
                        color="#7e93ffff"
                        size={24}
                        alt="Status"
                      />
                    </div>
                  ) : status === 'attended' ? (
                    /* Attended: Blue heart */
                    <div className="relative w-7 h-7 flex items-center justify-center">
                      <MaskedIcon
                        src={heartIcon}
                        color="#2563EB"
                        size={20}
                        alt="Status"
                      />
                    </div>
                  ) : status === 'absent' ? (
                    /* Absent: Gray rounded square background */
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      <MaskedIcon
                        src={icon}
                        color={iconColor}
                        size={20}
                        alt="Status"
                      />
                    </div>
                  ) : (
                    /* Future: Light gray heart */
                    <div className="relative w-7 h-7 flex items-center justify-center">
                      <MaskedIcon
                        src={icon}
                        color={iconColor}
                        size={20}
                        alt="Status"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Action Button */}
        <button
          onClick={() => navigate('/schedule')}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-between shadow-md"
        >
          <span>{t('home.checkScheduleNow')}</span>
          <MaskedIcon src={ngananIcon} color="#FFFFFF" size={20} alt="Next" />
        </button>
      </div>

    </motion.div>
  );
};

// --- 5. ATTENDANCE RECAP CARD ---
const AttendanceRecap = () => {
  const { t } = useLanguage();
  const [selectedRT, setSelectedRT] = useState('all');
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const rtOptions = [t('home.allRT'), 'RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06'];

  useEffect(() => {
    fetchRecentRecaps();
  }, []);

  const fetchRecentRecaps = async () => {
    try {
      setLoading(true);
      const { getAllRecaps } = await import('../api/attendanceRecap');
      // Fetch recent 20 recaps (not limited to today only)
      const response = await getAllRecaps({ limit: 20 });

      if (response.success && response.data) {
        // Get API base URL - exactly matching admin component logic
        const apiBaseUrl = (import.meta.env.VITE_API_URL ||
          (window.location.hostname.includes('vercel.app')
            ? 'https://ukk-jagakampung.onrender.com/api'
            : 'http://localhost:5000/api')).replace('/api', '');

        // Format data untuk display
        const formattedData = response.data.map(recap => {
          let photoUrl = recap.photo;

          // Only process if photo exists and is not already a full URL or data URI
          if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('data:')) {
            // Normalize path separators (Windows to Unix)
            photoUrl = photoUrl.replace(/\\/g, '/');

            // Ensure single leading slash
            if (!photoUrl.startsWith('/')) {
              photoUrl = `/${photoUrl}`;
            }

            // Construct full URL with base URL
            photoUrl = `${apiBaseUrl}${photoUrl}`;
          }

          return {
            id: recap._id,
            rt: recap.rt,
            guards: recap.guards,
            photo: photoUrl,
            time: recap.time,
            date: format(new Date(recap.date), 'dd MMMM yyyy', { locale: id })
          };
        });

        setAttendanceData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching recaps:', error);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = selectedRT === 'all'
    ? attendanceData
    : attendanceData.filter(item => item.rt === selectedRT);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      {/* Title */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('home.recapTitle')}</h2>

      {/* RT Filter Buttons */}
      <div
        className="flex gap-2 overflow-x-auto pb-3 mb-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {rtOptions.map((rt, index) => {
          const rtValue = index === 0 ? 'all' : rt;
          const isSelected = selectedRT === rtValue;

          return (
            <motion.button
              key={rt}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedRT(rtValue)}
              className={`relative flex-shrink-0 px-5 py-2 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap ${isSelected
                ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                : 'bg-white text-gray-500 border border-gray hover:bg-gray-50 '
                }`}
            >
              {rt}
              {isSelected && (
                <motion.div
                  layoutId="activeRTFilter"
                  className="absolute inset-0 border border-blue-200 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Attendance Cards */}
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style>{`
            .flex.gap - 3::-webkit-scrollbar {
          display: none;
          }
        `}</style>
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center w-full">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Memuat data rekap...</p>
          </div>
        ) : filteredData.length > 0 ? (
          filteredData.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex-shrink-0 w-72"
            >
              <div className="relative h-40 bg-gray-100 flex items-center justify-center">
                {/* Fallback Icon */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <MaskedIcon src={galleryIcon} size={32} color="#9CA3AF" alt="No Image" />
                </div>

                <img
                  src={item.photo}
                  alt={`Kehadiran ${item.rt}`}
                  className="w-full h-full object-cover relative z-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                {/* Top Left Badge - RT (Like "1841 hari lagi") */}
                <div className="absolute top-0 left-0 bg-blue-600 text-white px-3 py-1.5 rounded-br-2xl font-bold text-xs shadow-sm z-10">
                  {item.rt}
                </div>

                {/* Bottom Left Badge - Date (Like "REKOMENDASI") */}
                <div className="absolute bottom-0 left-0 bg-[#FFECEC] text-red-500 px-3 py-1 rounded-tr-lg text-[10px] font-bold tracking-wide shadow-sm z-10 mb-0">
                  {item.date}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{t('home.guards')}</p>
                    <p className="font-semibold text-sm text-gray-800">{item.guards.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{t('common.time')}</p>
                    <p className="font-semibold text-sm text-blue-600">{item.time}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center w-full">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">{t('home.noAttendanceData')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('home.for')} {selectedRT === 'all' ? t('home.allRT') : selectedRT}</p>
          </div>
        )}
      </div>
    </motion.div >
  );
};

// --- 5.5 ACTIVITY DOCUMENTATION SLIDER ---
const ActivityDocumentation = () => {
  const { t } = useLanguage();
  const [docs, setDocs] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Gunakan ref untuk melacak state mounted agar aman saat async
  const isMounted = useRef(true);
  const containerRef = useRef(null);
  const x = useMotionValue(0);
  const isDragging = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    fetchDocumentation();
    return () => { isMounted.current = false; };
  }, []);

  const fetchDocumentation = async () => {
    try {
      setLoading(true);
      const response = await activitiesAPI.getAll({ isDocumentationFeed: 'true', limit: 10 });
      if (isMounted.current) {
        if (response.data && response.data.data) {
          // FLATTEN: Convert activities with multiple photos into multiple slide items
          const rawDocs = response.data.data;
          const slides = [];

          rawDocs.forEach(doc => {
            if (doc.documentation && doc.documentation.length > 0) {
              // Activity has multiple photos in 'documentation' array
              doc.documentation.forEach(photoPath => {
                slides.push({
                  ...doc,
                  displayPhotoPath: photoPath // Specific photo for this slide
                });
              });
            } else if (doc.photo) {
              // Activity has single photo
              slides.push({
                ...doc,
                displayPhotoPath: doc.photo
              });
            }
          });

          setDocs(slides);
        } else {
          setDocs([]);
        }
      }
    } catch (error) {
      console.error('Error fetching documentation:', error);
      if (isMounted.current) setDocs([]);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http') || photoPath.startsWith('https')) return photoPath;
    if (photoPath.startsWith('data:')) return photoPath;

    // Pastikan environment variables terbaca dengan benar
    const apiBaseUrl = (import.meta.env.VITE_API_URL ||
      (window.location.hostname.includes('vercel.app')
        ? 'https://ukk-jagakampung.onrender.com/api'
        : 'http://localhost:5000/api')).replace('/api', '');

    let normalizedPath = photoPath.replace(/\\/g, '/');
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`;
    }
    return `${apiBaseUrl}${normalizedPath}`;
  };

  // Calculate indices without modulo wrap-around for rendering logic
  const prevIndex = index - 1;
  const nextIndex = index + 1;

  // Logic to move slider programmatically
  const slideTo = (direction) => {
    if (!containerRef.current) return;
    const width = containerRef.current.offsetWidth;
    const newIndex = index + direction;

    // Check bounds - disable loop
    if (newIndex < 0 || newIndex >= docs.length) {
      // Snap back if out of bounds
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
      return;
    }

    // Animate x to -width (next) or width (prev)
    animate(x, -direction * width, {
      type: "spring", stiffness: 300, damping: 30
    }).then(() => {
      if (!isMounted.current) return;
      x.set(0);
      setIndex(newIndex);
    });
  };

  // Auto slide - stop at end
  useEffect(() => {
    if (docs.length <= 1) return;

    const interval = setInterval(() => {
      // Only auto slide if not at the end
      if (!isHovered && !isDragging.current && index < docs.length - 1) {
        slideTo(1);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [docs.length, index, isHovered]);

  // Drag End Handler
  const handleDragEnd = (e, { offset, velocity }) => {
    isDragging.current = false;
    if (!containerRef.current || docs.length <= 1) {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
      return;
    }

    const width = containerRef.current.offsetWidth;
    const swipe = offset.x;
    const threshold = width * 0.25;

    if (swipe < -threshold && index < docs.length - 1) {
      // Swipe Left -> Next (only if not at end)
      slideTo(1);
    } else if (swipe > threshold && index > 0) {
      // Swipe Right -> Prev (only if not at start)
      slideTo(-1);
    } else {
      // Snap back
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  };

  if (loading) return null;
  if (docs.length === 0) return null;

  const renderSlide = (docIndex, positionOffset) => {
    // Boundary check for rendering
    if (docIndex < 0 || docIndex >= docs.length) return null;

    const doc = docs[docIndex];
    if (!doc) return null;

    const displayPhoto = getPhotoUrl(doc.displayPhotoPath);

    return (
      <div
        className="absolute top-0 w-full h-full bg-gray-200"
        style={{ left: `${positionOffset * 100}%` }}
        key={`slide-${docIndex}`}
      >
        {displayPhoto ? (
          <img
            src={displayPhoto}
            alt={doc.title || 'Dokumentasi'}
            className="w-full h-full object-cover pointer-events-none select-none"
            draggable="false"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}

        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-400"
          style={{ display: displayPhoto ? 'none' : 'flex' }}
        >
          <MaskedIcon src={galleryIcon} size={32} color="#9CA3AF" alt="No Image" />
        </div>
      </div>
    );
  };

  const currentDoc = docs[index];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 -mx-5"
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-3 px-5">{t('home.activityRecapTitle')}</h2>

      <div
        ref={containerRef}
        className="relative w-full aspect-video overflow-hidden bg-gray-200 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          className="relative w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
          style={{ x }}
          drag={docs.length > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => { isDragging.current = true; }}
          onDragEnd={handleDragEnd}
        >
          {docs.length > 1 ? (
            <>
              {renderSlide(prevIndex, -1)}
              {renderSlide(index, 0)}
              {renderSlide(nextIndex, 1)}
            </>
          ) : (
            renderSlide(0, 0)
          )}
        </motion.div>

        {/* Overlay Info */}
        {currentDoc && (
          <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-5 transition-opacity duration-300 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <h3 className="text-white font-bold text-lg leading-tight mb-1 line-clamp-2">
              {currentDoc.title}
            </h3>
            <p className="text-blue-200 text-sm font-medium">
              {currentDoc.eventDate ? format(new Date(currentDoc.eventDate), 'dd MMMM yyyy', { locale: id }) : '-'}
            </p>
          </div>
        )}

        {/* Indicators */}
        {docs.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-auto">
            {docs.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent drag triggering
                  setIndex(idx);
                  x.set(0);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === index
                  ? 'w-8 bg-white'
                  : 'w-1.5 bg-white/60 hover:bg-white/80'
                  }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};


// --- 6. ACTIVITIES SECTION (KEGIATAN RW 01) ---
const ActivitiesSection = ({ navigate }) => {
  const { t } = useLanguage();
  const [selectedRT, setSelectedRT] = useState('RW-01');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const rtOptions = ['RW-01', 'RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06'];

  useEffect(() => {
    fetchActivities();
  }, [selectedRT]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = { limit: 10, category: 'activity' }; // Only fetch regular activities, not documentation
      if (selectedRT && selectedRT === 'RW-01') {
        // RW-01 means activities that are for all RTs (RW level)
        params.rt = 'RW-01';
      } else if (selectedRT && selectedRT !== 'RW-01') {
        // Extract RT number (e.g., 'RT 01' -> '01')
        params.rt = selectedRT.split(' ')[1];
      }

      console.log('[Activities] Fetching with params:', params);
      const response = await activitiesAPI.getAll(params);
      console.log('[Activities] API Response:', response);

      // Axios response structure: response.data.data
      if (response.data && response.data.success && response.data.data) {
        console.log('[Activities] Setting activities:', response.data.data.length, 'items');
        setActivities(response.data.data);
      } else {
        console.log('[Activities] No data in response');
        setActivities([]);
      }
    } catch (error) {
      console.error('[Activities] Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    const diffTime = event - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return null; // Don't show for past events
    if (diffDays === 0) return t('home.today');
    if (diffDays === 1) return t('home.tomorrow');
    return `${diffDays} ${t('home.daysLeft')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'dd MM yyyy', { locale: id });
  };

  const getComputedStatus = (activity) => {
    let status = activity.status;
    if (activity.time && activity.eventDate) {
      const now = new Date();
      const eventISODate = new Date(activity.eventDate).toISOString().split('T')[0];
      const todayISODate = now.toISOString().split('T')[0];
      const dateCompare = new Date(eventISODate) - new Date(todayISODate);

      if (dateCompare > 0) status = 'upcoming';
      else if (dateCompare < 0) status = 'completed';
      else {
        const [h, m] = activity.time.split(':');
        const eventTime = new Date();
        eventTime.setHours(h, m, 0);
        status = now >= eventTime ? 'ongoing' : 'upcoming';
      }
    }
    return status;
  };

  const getStatusConfig = (status) => {
    const statusMap = {
      upcoming: { label: t('home.statusUpcoming'), bg: 'bg-blue-500', text: 'text-white' },
      ongoing: { label: t('home.statusOngoing'), bg: 'bg-green-500', text: 'text-white' },
      completed: { label: t('home.statusCompleted'), bg: 'bg-gray-500', text: 'text-white' }
    };
    return statusMap[status] || statusMap.upcoming;
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;

    const apiBaseUrl = (import.meta.env.VITE_API_URL ||
      (window.location.hostname.includes('vercel.app')
        ? 'https://ukk-jagakampung.onrender.com/api'
        : 'http://localhost:5000/api')).replace('/api', '');

    return `${apiBaseUrl}${photoPath}`;
  };

  const handleActivityClick = (activity) => {
    navigate(`/activity/${activity._id}`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        {/* Header */}
        <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('home.activityInfoTitle')}</h2>

        {/* RT Filter Tabs */}
        <div
          className="flex gap-2 overflow-x-auto pb-3 mb-4"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {rtOptions.map((rt) => {
            const isSelected = selectedRT === rt;

            return (
              <motion.button
                key={rt}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedRT(rt)}
                className={`relative flex-shrink-0 px-5 py-2 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap ${isSelected
                  ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                  : 'bg-white text-gray-500 border border-gray hover:bg-gray-50 '
                  }`}
              >
                {rt}
                {isSelected && (
                  <motion.div
                    layoutId="activeActivityFilter"
                    className="absolute inset-0 border border-blue-200 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Activities Cards - Horizontal Scroll */}
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {loading ? (
            <div className="bg-white rounded-2xl p-8 text-center w-full">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Memuat kegiatan...</p>
            </div>
          ) : activities.length > 0 ? (
            activities.map((activity) => {
              const daysRemaining = getDaysRemaining(activity.eventDate);
              const photoUrl = getPhotoUrl(activity.photo || (activity.documentation && activity.documentation.length > 0 ? activity.documentation[0] : null));

              return (
                <motion.div
                  key={activity._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => handleActivityClick(activity)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex-shrink-0 w-72 cursor-pointer hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="relative h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    {(() => {
                      const computedStatus = getComputedStatus(activity);
                      const statusConfig = getStatusConfig(computedStatus);
                      return (
                        <div className="absolute top-3 left-3 z-10">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide shadow-sm ${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      );
                    })()}
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={activity.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="text-gray-400">
                        <MaskedIcon src={gambarIcon} size={32} color="#9CA3AF" alt="No Image" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 pb-4">
                    {/* Title */}
                    <h3 className="font-semibold text-base text-gray-800 mb-2 line-clamp-2 leading-snug h-[2.5rem]">
                      {activity.title}
                    </h3>

                    {/* Date & Time */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                      <Calendar size={14} className="shrink-0" />
                      <span>{format(new Date(activity.eventDate), 'dd MMM yyyy', { locale: id })}</span>
                      {activity.time && (
                        <>
                          <span className="text-gray-300">|</span>
                          <Clock size={14} className="shrink-0" />
                          <span>{activity.time}</span>
                        </>
                      )}
                    </div>

                    {/* Location */}
                    {(activity.location || activity.rt) && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin size={14} className="shrink-0" />
                        <span className="truncate">{activity.location ? activity.location : `RT ${activity.rt}`}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center w-full">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">{t('home.noActivity')}</p>
              <p className="text-gray-400 text-sm mt-1">{t('home.for')} {selectedRT || t('home.allRT')}</p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};



const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [recentAttendances, setRecentAttendances] = useState([]);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [todayAttendances, setTodayAttendances] = useState({ masuk: null, pulang: null });
  const [partners, setPartners] = useState([]);
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchRecentAttendances(), fetchUnreadCount(), fetchCurrentSchedule(), fetchPartners()]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await getTodayPartner();
      if (response.success && response.data) {
        setPartners(response.data || []);
      } else {
        setPartners([]);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      setPartners([]);
    }
  };

  // Fetch unread count periodically
  useEffect(() => {
    const interval = setInterval(fetchUnreadCount, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };



  const fetchRecentAttendances = async () => {
    try {
      const response = await attendancesAPI.getMyAttendanceHistory({ limit: 5 });
      if (response.success) setRecentAttendances(response.data?.slice(0, 5) || []);
      else setRecentAttendances([]);
    } catch (e) { setRecentAttendances([]) }
  };

  const fetchCurrentSchedule = async () => {
    try {
      const response = await schedulesAPI.getCurrentMonthSchedule();
      if (response.success && response.data) {
        setCurrentSchedule(response.data);
        checkTodayAttendance(response.data._id);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  const checkTodayAttendance = async (scheduleId) => {
    try {
      const response = await attendancesAPI.checkTodayAttendance(scheduleId);
      if (response.success) {
        const newToday = { masuk: null, pulang: null };
        if (Array.isArray(response.attendances)) {
          response.attendances.forEach(att => {
            if (att.type === 'masuk') newToday.masuk = att;
            else if (att.type === 'pulang') newToday.pulang = att;
            else if (att.status === 'hadir') !newToday.masuk ? newToday.masuk = att : newToday.pulang = att;
          });
        }
        setTodayAttendances(newToday);
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
    }
  };

  const handleViewDetail = (attendance) => {
    setSelectedAttendance(attendance);
    setShowDetailModal(true);
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loading size="lg" /></div>;



  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <ProfileHeader user={user} navigate={navigate} unreadCount={unreadCount} t={t} />

      <div className="px-4 relative z-20 -mt-12">
        {/* Schedule/Attendance Cards - Dynamically change when user completes attendance */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <JadwalCard
            title={t('home.checkIn')}
            time="21:00"
            icon={iconIn}
            variant="white"
            iconColor="#16A34A"
            attendance={todayAttendances.masuk}
            type="masuk"
          />
          <JadwalCard
            title={t('home.checkOut')}
            time="03:00"
            icon={iconOut}
            variant="white"
            iconColor="#EA580C"
            attendance={todayAttendances.pulang}
            type="pulang"
          />
        </motion.div>

        {/* Partner Ronda Section */}
        {partners.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-6"
          >
            <h2 className="text-lg font-bold text-gray-800 mb-3">Partner jaga hari ini</h2>
            <div className="space-y-3">
              {Array.from({ length: Math.ceil(partners.length / 2) }).map((_, index) => (
                <PartnerRow key={index} partners={partners.slice(index * 2, index * 2 + 2)} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Attendance Calendar Section */}
        <AttendanceCalendar navigate={navigate} />

        {/* Attendance Recap Section */}
        <AttendanceRecap />

        {/* Activity Documentation Section */}
        <ActivityDocumentation />

        {/* Activities Section (Kegiatan RW 01) */}
        <ActivitiesSection navigate={navigate} />

        {/* Financial Reports Section */}
        <FinancialReportsSection />


      </div>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Detail Kehadiran">
        {selectedAttendance && (
          <div className="space-y-4 p-2">
            <div className="text-center pb-4 border-b border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800">{format(new Date(selectedAttendance.createdAt), "HH:mm", { locale: id })}</h3>
              <p className="text-gray-500 text-sm">Waktu Pencatatan</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Tanggal</p>
                <p className="font-semibold text-sm text-gray-800">{format(new Date(selectedAttendance.date), 'dd MMMM yyyy', { locale: id })}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <Badge variant={selectedAttendance.status === 'hadir' ? 'success' : 'error'}>{selectedAttendance.status === 'hadir' ? 'Hadir' : 'Tidak Hadir'}</Badge>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Home;