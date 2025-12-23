import { useState, useEffect, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { attendancesAPI, schedulesAPI, notificationsAPI } from '../api';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';

// --- IMPORT ASSETS ---
import checkIcon from '../assets/in.png';
import clockIcon from '../assets/out.png';
import mapPinIcon from '../assets/logo.png';
import refreshIcon from '../assets/reload.png';
import historyIcon from '../assets/open-folder.png';
import xCircleIcon from '../assets/x-circle.png';
import sendIcon from '../assets/send.png';
import downIcon from '../assets/down.png';
import imageIcon from '../assets/eye.png';
import camIcon from '../assets/cam.png';
import galleryIcon from '../assets/img.png';
import biruuBg from '../assets/biruu.png';

// Icon Status
import approvedIcon from '../assets/check-circle.png';
import rejectedIcon from '../assets/x-circle.png';
import pendingIcon from '../assets/clock.png';

// --- KONFIGURASI WARNA ---
const COLORS = {
  primary: '#3B82F6',
  secondary: '#1E40AF',
  masuk: { bg: 'bg-green-500', hover: 'hover:bg-green-600' },
  pulang: { bg: 'bg-orange-500', hover: 'hover:bg-orange-600' },
  izin: { bg: 'bg-pink-500', hover: 'hover:bg-pink-600' },

  pending: { bg: 'bg-amber-500', border: 'border-amber-500' },
  approved: { bg: 'bg-green-600', border: 'border-green-600' },
  rejected: { bg: 'bg-red-600', border: 'border-red-600' }
};

const HISTORY_COLORS = {
  APPROVED: '#10B981',
  ON_TIME: '#10B981',
  PENDING: '#F59E0B',
  REJECTED: '#EF4444',
  ABSENT: '#9CA3AF',
  LATE: '#F97316',
  LEAVE: '#EC4899',
};

const iconColorStyles = {
  white: { filter: 'brightness(0) invert(1)' },
  blue: { filter: 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(197deg) brightness(97%) contrast(98%)' },
  gray: { filter: 'brightness(0) saturate(100%) invert(50%) sepia(0%) saturate(0%)' },
};

// Header Component
const AnimatedHeaderMemo = memo(({ headerDate, showDefaultSubtitle, unreadCount, onNotifications, currentTime, user }) => (
  <div className="bg-white/80 backdrop-blur-md relative overflow-hidden">

    {/* Time with blue gradient box - centered */}
    <div className="flex flex-col items-center justify-center py-8 px-4 relative z-10">
      <div
        className="rounded-2xl px-8 py-4 shadow-lg bg-cover bg-center bg-no-repeat border-2 border-red-400"
        style={{ backgroundImage: `url(${biruuBg})` }}
      >
        <h2 className="text-5xl font-bold tracking-tight text-white font-mono drop-shadow-lg">
          {format(currentTime, "HH:mm:ss")}
        </h2>
      </div>
    </div>
  </div>
));

const Attendance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  // States
  const [loading, setLoading] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [todayAttendances, setTodayAttendances] = useState({ masuk: null, pulang: null, izin: null });
  const [photoPreview, setPhotoPreview] = useState(() => {
    // Restore photo preview from sessionStorage
    const saved = sessionStorage.getItem('attendance_photoPreview');
    return saved || null;
  });
  const [photoFile, setPhotoFile] = useState(() => {
    // Restore photo file from sessionStorage
    const saved = sessionStorage.getItem('attendance_photoData');
    if (saved) {
      try {
        const { data, name, type } = JSON.parse(saved);
        // Convert base64 back to File object
        const byteString = atob(data.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type });
        return new File([blob], name, { type });
      } catch (e) {
        console.error('Error restoring photo:', e);
        sessionStorage.removeItem('attendance_photoData');
        sessionStorage.removeItem('attendance_photoPreview');
        return null;
      }
    }
    return null;
  });

  const [location, setLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [showDefaultSubtitle, setShowDefaultSubtitle] = useState(true);
  const [headerDate, setHeaderDate] = useState(new Date());
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [showHistory, setShowHistory] = useState(() => {
    const saved = localStorage.getItem('attendance_showHistory');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySort, setHistorySort] = useState('latest');

  const [formData, setFormData] = useState(() => {
    // Restore attendance type from sessionStorage
    const savedStatus = sessionStorage.getItem('attendance_formStatus');
    const savedReason = sessionStorage.getItem('attendance_formReason');
    return {
      status: savedStatus || 'masuk',
      reason: savedReason || ''
    };
  });

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  // Photo options popup state
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const galleryInputRef = useRef(null);

  // Fullscreen photo preview modal state
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);
  const [previewPhotoLabel, setPreviewPhotoLabel] = useState('');

  // Webcam states for desktop
  const [showWebcam, setShowWebcam] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Effects
  useEffect(() => {
    fetchCurrentSchedule();
    getCurrentLocation();
    fetchUnreadCount();
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    const headerInterval = setInterval(() => {
      setShowDefaultSubtitle(prev => !prev);
      setHeaderDate(new Date());
    }, 10000);
    const notifInterval = setInterval(fetchUnreadCount, 30000);
    return () => {
      clearInterval(timeInterval);
      clearInterval(headerInterval);
      clearInterval(notifInterval);
    };
  }, []);

  // Persist photo to sessionStorage whenever it changes
  useEffect(() => {
    if (photoFile && photoPreview) {
      // Save photo data to sessionStorage
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoData = {
          data: reader.result,
          name: photoFile.name,
          type: photoFile.type
        };
        sessionStorage.setItem('attendance_photoData', JSON.stringify(photoData));
        sessionStorage.setItem('attendance_photoPreview', photoPreview);
      };
      reader.readAsDataURL(photoFile);
    } else if (!photoFile && !photoPreview) {
      // Clear sessionStorage when photo is removed
      sessionStorage.removeItem('attendance_photoData');
      sessionStorage.removeItem('attendance_photoPreview');
    }
  }, [photoFile, photoPreview]);

  // Persist formData status to sessionStorage
  useEffect(() => {
    if (formData.status) {
      sessionStorage.setItem('attendance_formStatus', formData.status);
    }
    if (formData.reason) {
      sessionStorage.setItem('attendance_formReason', formData.reason);
    } else {
      sessionStorage.removeItem('attendance_formReason');
    }
  }, [formData]);

  useEffect(() => {
    if (showHistory) fetchHistoryData();
  }, [showHistory]);

  // Persist showHistory state to localStorage
  useEffect(() => {
    localStorage.setItem('attendance_showHistory', JSON.stringify(showHistory));
  }, [showHistory]);

  // API Calls
  const fetchCurrentSchedule = async () => {
    try {
      const response = await schedulesAPI.getCurrentMonthSchedule();
      if (response.success && response.data) {
        setCurrentSchedule(response.data);
        checkTodayAttendance(response.data._id);
      }
    } catch (error) { console.error(error); }
  };

  const checkTodayAttendance = async (scheduleId) => {
    try {
      const response = await attendancesAPI.checkTodayAttendance(scheduleId);
      if (response.success) {
        const newToday = { masuk: null, pulang: null, izin: null };
        if (Array.isArray(response.attendances)) {
          response.attendances.forEach(att => {
            if (['masuk', 'pulang', 'izin'].includes(att.type)) newToday[att.type] = att;
            else if (att.status === 'hadir') !newToday.masuk ? newToday.masuk = att : newToday.pulang = att;
            else if (att.status === 'izin') newToday.izin = att;
          });
        }
        setTodayAttendances(newToday);
      }
    } catch (error) { console.error(error); }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      if (response.success) setUnreadCount(response.unreadCount);
    } catch (e) { console.error(e); }
  };

  const fetchHistoryData = async () => {
    setHistoryLoading(true);
    try {
      const response = await attendancesAPI.getMyAttendanceHistory();
      if (response.success) {
        const groupedHistory = response.data.reduce((acc, item) => {
          if (!item.date) return acc;
          const dateObject = parseISO(item.date);
          const dateKey = format(dateObject, 'yyyy-MM-dd');
          if (!acc[dateKey]) acc[dateKey] = { date: dateObject, entries: [] };
          acc[dateKey].entries.push(item);
          return acc;
        }, {});

        const processedHistory = Object.values(groupedHistory).map(group => {
          const masukEntry = group.entries.find(e => e.type === 'masuk');
          const pulangEntry = group.entries.find(e => e.type === 'pulang');
          const izinEntry = group.entries.find(e => e.type === 'izin');

          let status = t('attendance.notPresent');
          let statusTextColor = 'text-gray-500';
          let mainType = 'ABSENT';

          if (izinEntry) {
            mainType = 'IZIN';
            if (izinEntry.approved === false) {
              status = t('attendance.leaveRejected');
              statusTextColor = 'text-red-600';
              mainType = 'REJECTED';
            } else if (izinEntry.approved === true) {
              status = 'Izin/Sakit';
              statusTextColor = 'text-pink-600';
            } else {
              status = t('attendance.waitingApproval');
              statusTextColor = 'text-amber-500';
              mainType = 'PENDING';
            }
          } else if (masukEntry) {
            if (masukEntry.approved === false) {
              status = t('attendance.attendanceRejected');
              statusTextColor = 'text-red-600';
              mainType = 'REJECTED';
            } else if (masukEntry.approved === true) {
              if (masukEntry.schedule?.masukTime) {
                const entryTime = parseISO(masukEntry.date);
                const scheduleTime = parseISO(format(entryTime, 'yyyy-MM-dd') + 'T' + masukEntry.schedule.masukTime);
                if (isAfter(entryTime, scheduleTime)) {
                  status = t('attendance.late');
                  statusTextColor = 'text-orange-500';
                  mainType = 'LATE';
                } else {
                  status = t('attendance.onTime');
                  statusTextColor = 'text-green-600';
                  mainType = 'ON_TIME';
                }
              } else {
                status = t('attendance.present');
                statusTextColor = 'text-green-600';
                mainType = 'ON_TIME';
              }
            } else {
              status = t('attendance.waitingApproval');
              statusTextColor = 'text-amber-500';
              mainType = 'PENDING';
            }
          }
          return {
            date: group.date, status, statusTextColor,
            masukTime: masukEntry ? format(parseISO(masukEntry.date), 'HH:mm') : null,
            pulangTime: pulangEntry ? format(parseISO(pulangEntry.date), 'HH:mm') : null,
            shiftName: masukEntry?.schedule?.name || izinEntry?.schedule?.name || t('attendance.detailAttendance'),
            isIzin: !!izinEntry, mainType,
            // Store photo and location data for detail modal
            masukPhoto: masukEntry?.photo || null,
            pulangPhoto: pulangEntry?.photo || null,
            masukLocation: masukEntry?.location || null,
            pulangLocation: pulangEntry?.location || null,
            izinReason: izinEntry?.reason || null
          };
        });
        setAttendanceHistory(processedHistory);
      }
    } catch (error) { toast.error(t('attendance.failedToLoadHistory')); }
    finally { setHistoryLoading(false); }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error(t('attendance.geolocationNotSupported'));
    setGettingLocation(true);
    setLocationAddress(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLocation({ latitude, longitude, accuracy });

        try {
          // Use backend proxy to avoid CORS issues with Nominatim
          const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const response = await fetch(
            `${apiBaseUrl}/location/reverse-geocode?lat=${latitude.toFixed(7)}&lon=${longitude.toFixed(7)}`
          );

          const data = await response.json();

          if (data && data.address) {
            // Smart address formatting with fallbacks
            const addr = data.address;
            const parts = [];

            // Building/house number + road
            if (addr.house_number) parts.push(addr.house_number);
            if (addr.road) parts.push(addr.road);
            else if (addr.pedestrian) parts.push(addr.pedestrian);
            else if (addr.footway) parts.push(addr.footway);

            // Neighborhood/hamlet
            if (addr.hamlet) parts.push(addr.hamlet);
            else if (addr.neighbourhood) parts.push(addr.neighbourhood);
            else if (addr.suburb) parts.push(addr.suburb);
            else if (addr.village) parts.push(addr.village);

            // City/district
            if (addr.city) parts.push(addr.city);
            else if (addr.town) parts.push(addr.town);
            else if (addr.municipality) parts.push(addr.municipality);
            else if (addr.county) parts.push(addr.county);

            // State (optional, only if different from city)
            if (addr.state && !parts.includes(addr.state)) {
              parts.push(addr.state);
            }

            const formattedAddress = parts.filter(Boolean).join(', ') || data.display_name;
            setLocationAddress(formattedAddress);
          } else {
            // Fallback to display_name
            setLocationAddress(data.display_name || t('attendance.addressNotFound'));
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          setLocationAddress(t('attendance.failedToLoadAddress'));
        }
        finally { setGettingLocation(false); }
      },
      (err) => {
        setGettingLocation(false);
        console.error('Geolocation error:', err);

        // Better error messages
        if (err.code === 1) {
          toast.error(t('attendance.locationAccessDenied'));
        } else if (err.code === 2) {
          toast.error(t('attendance.locationNotAvailable'));
        } else if (err.code === 3) {
          toast.error(t('attendance.locationTimeout'));
        } else {
          toast.error(t('attendance.failedToLoadLocation'));
        }
      },
      {
        enableHighAccuracy: true, // Use GPS for best accuracy
        timeout: 15000, // 15 seconds timeout
        maximumAge: 0 // Don't use cached position
      }
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      // Save immediately to sessionStorage
      const photoData = {
        data: reader.result,
        name: file.name,
        type: file.type
      };
      sessionStorage.setItem('attendance_photoData', JSON.stringify(photoData));
      sessionStorage.setItem('attendance_photoPreview', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAttendanceTypeClick = (type) => {
    if (type === 'izin') {
      setFormData({ ...formData, status: 'izin' });
      setPhotoFile(null); setPhotoPreview(null);
    } else {
      setFormData({ ...formData, status: type, reason: '' });
      // Show photo options popup
      setShowPhotoOptions(true);
    }
  };

  // Handle select from gallery
  const handleSelectFromGallery = () => {
    setShowPhotoOptions(false);
    setTimeout(() => {
      if (galleryInputRef.current) {
        galleryInputRef.current.removeAttribute('capture');
        galleryInputRef.current.click();
      }
    }, 100);
  };

  // Handle take photo with camera
  const handleTakePhoto = () => {
    setShowPhotoOptions(false);

    // Deteksi device: mobile vs desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // Mobile: gunakan capture attribute
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.setAttribute('capture', 'environment');
          fileInputRef.current.click();
        }
      }, 100);
    } else {
      // Desktop: buka webcam modal
      setShowWebcam(true);
    }
  };

  // Start webcam
  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error(t('attendance.failedAccessWebcam'));
      console.error(error);
      setShowWebcam(false);
    }
  };

  // Stop webcam
  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Capture photo from webcam
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        const file = new File([blob], 'webcam-photo.jpg', { type: 'image/jpeg' });
        setPhotoFile(file);
        setPhotoPreview(canvas.toDataURL('image/jpeg'));
        stopWebcam();
        setShowWebcam(false);
        toast.success(t('attendance.photoSuccessCaptured'));
      }, 'image/jpeg', 0.9);
    }
  };

  // Close webcam modal
  const closeWebcam = () => {
    stopWebcam();
    setShowWebcam(false);
  };

  // Effect untuk start webcam saat modal dibuka
  useEffect(() => {
    if (showWebcam) {
      startWebcam();
    }
    return () => {
      if (stream) stopWebcam();
    };
  }, [showWebcam]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.status !== 'izin' && !photoFile) return toast.error(t('attendance.takePhotoFirst'));
    if (formData.status === 'masuk' && todayAttendances.masuk && todayAttendances.masuk.approved !== false) return toast.error(t('attendance.alreadyCheckIn'));
    if (formData.status === 'pulang') {
      if (todayAttendances.pulang && todayAttendances.pulang.approved !== false) return toast.error(t('attendance.alreadyCheckOut'));
      if (!todayAttendances.masuk || todayAttendances.masuk.approved === false) return toast.error(t('attendance.notCheckInYet'));
    }
    if (!currentSchedule || !location) return toast.error(t('attendance.dataNotReady'));

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('scheduleId', currentSchedule._id);
      fd.append('status', formData.status);
      fd.append('type', formData.status);
      fd.append('location', JSON.stringify(location));
      if (photoFile) fd.append('photo', photoFile);
      if (formData.status === 'izin') fd.append('reason', formData.reason);

      const res = await attendancesAPI.createAttendance(fd);
      if (res.success) {
        toast.success(t('attendance.sendAttendanceSuccess'));
        // Clear photo state and sessionStorage
        setPhotoFile(null);
        setPhotoPreview(null);
        sessionStorage.removeItem('attendance_photoData');
        sessionStorage.removeItem('attendance_photoPreview');
        sessionStorage.removeItem('attendance_formStatus');
        sessionStorage.removeItem('attendance_formReason');
        setFormData({ status: 'masuk', reason: '' });
        checkTodayAttendance(currentSchedule._id);
        fetchHistoryData();
      } else { toast.error(res.message); }
    } catch (e) { toast.error(t('attendance.connectionError')); }
    finally { setLoading(false); }
  };

  const renderStatusCard = (type, data) => {
    if (!data) return null;
    let statusKey = 'pending';
    let statusIcon = pendingIcon;
    let label = t('attendance.pending');
    let ringColor = 'border-amber-400 text-amber-700 bg-amber-50';

    if (data.approved === true) {
      statusKey = 'approved';
      statusIcon = approvedIcon;
      label = t('attendance.approved');
      ringColor = 'border-green-400 text-green-700 bg-green-50';
    } else if (data.approved === false) {
      statusKey = 'rejected';
      statusIcon = rejectedIcon;
      label = t('attendance.rejected');
      ringColor = 'border-red-400 text-red-700 bg-red-50';
    }

    return (
      <motion.div key={type} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`p-3 rounded-xl border-2 ${ringColor} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-full">
            <img src={statusIcon} className="w-5 h-5" style={{ filter: statusKey === 'approved' ? 'sepia(1) hue-rotate(80deg) saturate(5)' : statusKey === 'rejected' ? 'sepia(1) hue-rotate(330deg) saturate(10)' : 'sepia(1) hue-rotate(0deg) saturate(5)' }} alt="" />
          </div>
          <div><p className="text-xs opacity-90 font-medium uppercase">{type}</p><p className="font-bold text-sm">{label}</p></div>
        </div>
        <div className="text-right"><p className="text-sm font-mono font-bold">{format(new Date(data.date), "HH:mm")}</p></div>
      </motion.div>
    );
  };

  const renderHistoryCard = (item, idx) => {
    const { date, status, statusTextColor, masukTime, pulangTime, shiftName, isIzin, mainType, masukPhoto, pulangPhoto, masukLocation, pulangLocation, izinReason } = item;
    let timeRange = masukTime ? `${masukTime} - ${pulangTime || '--:--'}` : (isIzin ? t('attendance.allDay') : '--:--');

    // Check if there's any detail to show
    const hasDetail = masukPhoto || pulangPhoto || masukLocation || pulangLocation || izinReason;

    let borderColor;
    switch (mainType) {
      case 'IZIN': borderColor = HISTORY_COLORS.LEAVE; break;
      case 'PENDING': borderColor = HISTORY_COLORS.PENDING; break;
      case 'REJECTED': borderColor = HISTORY_COLORS.REJECTED; break;
      case 'LATE': borderColor = HISTORY_COLORS.LATE; break;
      case 'ON_TIME': borderColor = HISTORY_COLORS.ON_TIME; break;
      default: borderColor = HISTORY_COLORS.ABSENT;
    }

    const handleOpenDetail = () => {
      if (hasDetail) {
        setSelectedDetail({
          date,
          status,
          masukTime,
          pulangTime,
          masukPhoto,
          pulangPhoto,
          masukLocation,
          pulangLocation,
          izinReason,
          isIzin
        });
        setShowDetailModal(true);
      }
    };

    return (
      <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
        className="relative bg-white rounded-xl shadow-sm p-3 sm:p-4 border border-gray-100 mb-3"
        style={{ borderLeft: `4px solid ${borderColor}` }}
      >
        <div className="flex justify-between items-start gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">{format(date, "MMM dd", { locale: id })}</p>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 capitalize">{format(date, "EEEE", { locale: id })}</p>
            </div>
            <p className={`font-extrabold text-base sm:text-lg capitalize ${statusTextColor} leading-tight`}>{status}</p>
            {/* Detail Absensi with photo icon */}
            <div className="flex items-center gap-2 mt-2">
              <p className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">{t('attendance.detailAttendance')}</p>
              {hasDetail && (
                <button
                  onClick={handleOpenDetail}
                  className="p-1 -m-1 hover:bg-gray-50 transition-colors active:scale-95"
                  title="Lihat Detail"
                >
                  <img src={imageIcon} alt="Detail" className="w-4 h-4" style={{ filter: 'grayscale(100%) opacity(0.5)' }} />
                </button>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-sm sm:text-base text-gray-800 font-mono whitespace-nowrap">{timeRange}</p>
            <p className="text-[10px] sm:text-xs text-gray-400">{format(date, "yyyy")}</p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AnimatedHeaderMemo
        headerDate={headerDate} showDefaultSubtitle={showDefaultSubtitle}
        unreadCount={unreadCount} onNotifications={() => navigate('/notifications')}
        currentTime={currentTime} user={user}
      />

      <div>
        <div className="px-4 -mt-6 relative z-20">
          <div className="bg-white rounded-2xl shadow-xl p-5 mb-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">{t('attendance.today')}</h3>

            <div className="flex items-center justify-between mb-6 px-2">
              <div className="text-center flex-1">
                <p className="text-xs text-gray-500 mb-1">{t('attendance.checkInLabel')}</p>
                <p className={`font-bold text-xl ${todayAttendances.masuk ? 'text-black' : 'text-gray-300'}`}>
                  {todayAttendances.masuk ? format(new Date(todayAttendances.masuk.date), "HH:mm") : '--:--'}
                </p>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="text-center flex-1">
                <p className="text-xs text-gray-500 mb-1">{t('attendance.checkOutLabel')}</p>
                <p className={`font-bold text-xl ${todayAttendances.pulang ? 'text-black' : 'text-gray-300'}`}>
                  {todayAttendances.pulang ? format(new Date(todayAttendances.pulang.date), "HH:mm") : '--:--'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => handleAttendanceTypeClick('masuk')}
                  className={`${COLORS.masuk.bg} ${COLORS.masuk.hover} rounded-xl p-4 text-white transition-all active:scale-95 h-20 flex flex-col justify-center items-center gap-1 shadow-sm`}>
                  <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center"><img src={checkIcon} className="w-4 h-4" style={iconColorStyles.white} alt="" /></div>
                  <span className="font-bold text-sm">{t('attendance.checkIn')}</span>
                </button>
                <button type="button" onClick={() => handleAttendanceTypeClick('pulang')}
                  className={`${COLORS.pulang.bg} ${COLORS.pulang.hover} rounded-xl p-4 text-white transition-all active:scale-95 h-20 flex flex-col justify-center items-center gap-1 shadow-sm`}>
                  <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center"><img src={clockIcon} className="w-4 h-4" style={iconColorStyles.white} alt="" /></div>
                  <span className="font-bold text-sm">{t('attendance.checkOut')}</span>
                </button>
              </div>

              <button type="button" onClick={() => handleAttendanceTypeClick('izin')}
                className={`${COLORS.izin.bg} ${COLORS.izin.hover} w-full rounded-xl p-3 text-white transition-all active:scale-95 flex items-center gap-3 shadow-sm`}>
                <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center"><img src={xCircleIcon} className="w-4 h-4" style={iconColorStyles.white} alt="" /></div>
                <div className="text-left"><p className="font-bold text-sm">{t('attendance.leave')}</p><p className="text-xs opacity-90">{t('attendance.leaveSubtitle')}</p></div>
              </button>

              <AnimatePresence>
                {(photoPreview || formData.status === 'izin') && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-gray-50 rounded-xl p-3 border border-gray-200 overflow-hidden mt-3">
                    {photoPreview && formData.status !== 'izin' && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-semibold text-gray-700">{t('attendance.proofPhoto')}</p>
                          <button type="button" onClick={() => { setPhotoPreview(null); setPhotoFile(null); }} className="text-xs text-red-500 font-semibold">{t('attendance.delete')}</button>
                        </div>
                        <div
                          className="relative group cursor-pointer"
                          onClick={() => {
                            setPreviewPhotoUrl(photoPreview);
                            setPreviewPhotoLabel('Preview Foto Absensi');
                            setShowPhotoPreview(true);
                          }}
                        >
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg border border-gray-300 transition-all group-hover:opacity-90 group-hover:shadow-lg"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-lg transition-all">
                            <div className="bg-white/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 text-center">{t('attendance.tapToEnlarge')}</p>
                      </div>
                    )}
                    {formData.status === 'izin' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-gray-700">{t('attendance.leaveReason')}</label>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ status: 'masuk', reason: '' });
                            }}
                            className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {t('common.cancel')}
                          </button>
                        </div>
                        <textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} className="w-full p-3 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-pink-400 outline-none text-sm" placeholder="Alasan..." rows="3" />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* --- CARD LOKASI (Redesigned) --- */}
          <div className="bg-white rounded-2xl shadow-md p-5 mb-4 border border-blue-100">
            {/* Header with Refresh Button */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img src={mapPinIcon} className="w-8 h-8" alt="" />
                <div>
                  <h1 className="font-semibold text-gray-700 text-base">Lokasimu Saat ini</h1>

                </div>
              </div>
              {/* Refresh Button - Icon Only */}
              {location && (
                <button
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="p-1.5 hover:opacity-70 transition-all active:scale-95 disabled:opacity-30"
                  title="Refresh lokasi"
                >
                  <img src={refreshIcon} className={`w-6 h-6 opacity-50 ${gettingLocation ? 'animate-spin' : ''}`} alt="Refresh" />
                </button>
              )}
            </div>

            {/* Location Content */}
            {location ? (
              <div>
                {/* Single Card with All Info */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  {/* Alamat Section */}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('attendance.address')}</p>
                    <p className="font-medium text-sm text-gray-800 leading-relaxed break-words mb-2">
                      {locationAddress || <span className="text-gray-400 italic">{t('attendance.loadingAddress')}</span>}
                    </p>
                    {/* Maps Link as Text */}
                    <a
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=18`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {t('attendance.viewOnGoogleMaps') || 'View on Google Maps'}
                    </a>
                  </div>

                  {/* Divider Line */}
                  <div className="border-t border-gray-200 my-3"></div>

                  {/* Coordinates & Accuracy Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">{t('attendance.coordinates')}</p>
                      <p className="text-xs font-mono font-semibold text-gray-700">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">{t('attendance.accuracy')}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${location.accuracy < 50 ? 'bg-green-500' : location.accuracy < 200 ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`}></span>
                        <p className="text-xs font-bold text-gray-700">±{location.accuracy?.toFixed(0)}m</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 border border-dashed border-gray-200">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <img src={mapPinIcon} className="w-6 h-6 opacity-40" alt="" />
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Lokasi belum terdeteksi</p>
                  <button
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-xl text-sm transition-all active:scale-95 inline-flex items-center gap-2"
                  >
                    {gettingLocation ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Mencari...
                      </>
                    ) : (
                      <>
                        <img src={mapPinIcon} className="w-4 h-4" style={iconColorStyles.white} alt="" />
                        Aktifkan Lokasi
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <AnimatePresence>
            <div className="space-y-3 mb-4">
              {todayAttendances.masuk && renderStatusCard(t('attendance.checkInTitle'), todayAttendances.masuk)}
              {todayAttendances.pulang && renderStatusCard(t('attendance.checkOutTitle'), todayAttendances.pulang)}
              {todayAttendances.izin && renderStatusCard(t('attendance.leave'), todayAttendances.izin)}
            </div>
          </AnimatePresence>

          {/* Riwayat Absensi */}
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className='flex items-center gap-2'>
                <img src={historyIcon} className="w-5 h-5 opacity-70" alt="" />
                <span className="text-gray-800 text-base font-semibold">{t('attendance.history')}</span>
              </div>
              <motion.button
                onClick={() => setShowHistory(!showHistory)}
                whileTap={{ scale: 0.9 }}
                className="p-1"
              >
                <img src={downIcon} className="w-4 h-4 opacity-50" style={{ transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)' }} alt="" />
              </motion.button>
            </div>

            <AnimatePresence>
              {showHistory && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">

                  {/* Sort Controls - Moved here for better layout on mobile */}
                  <div className="flex justify-end mb-3">
                    <div className="bg-gray-100 rounded-lg p-0.5 flex">
                      {['latest', 'oldest'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setHistorySort(type)}
                          className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${historySort === type
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                          {type === 'latest' ? t('common.newest') : t('common.oldest')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className='max-h-80 overflow-y-auto pr-1 custom-scrollbar'>
                    {historyLoading ? (
                      <div className="text-center p-4 text-sm text-gray-400">Memuat data...</div>
                    ) : attendanceHistory.length > 0 ? (
                      attendanceHistory
                        .sort((a, b) => historySort === 'latest' ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime())
                        .map((item, idx) => renderHistoryCard(item, idx))
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-xs text-gray-400">Belum ada riwayat</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating Send Button with Tooltip */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 group">
        <button onClick={handleSubmit} disabled={loading}
          className={`w-14 h-14 ${loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} rounded-full shadow-xl flex items-center justify-center transition-all border-4 border-white`}>
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <img src={sendIcon} className="w-5 h-5" style={iconColorStyles.white} alt="Send" />}
        </button>
        {/* Tooltip on hover */}
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg">
          Kirim
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>

      {/* Webcam Modal for Desktop */}
      <AnimatePresence>
        {showWebcam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center p-4"
            onClick={closeWebcam}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Ambil Foto</h3>
                <button onClick={closeWebcam} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="bg-gray-900 rounded-xl overflow-hidden mb-4 relative aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!stream && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm">Membuka webcam...</p>
                      </div>
                    </div>
                  )}
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <div className="flex gap-3">
                  <button
                    onClick={closeWebcam}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={capturePhoto}
                    disabled={!stream}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ambil Foto
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Detail Attendance Modal */}
        {showDetailModal && selectedDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{t('attendance.detailAttendance')}</h3>
                    <p className="text-blue-100 text-sm">
                      {format(selectedDetail.date, "EEEE, dd MMMM yyyy", { locale: id })}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="p-4 overflow-y-auto max-h-[calc(85vh-120px)] space-y-4">
                {/* Izin Reason Section */}
                {selectedDetail.isIzin && selectedDetail.izinReason && (
                  <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                    <p className="text-xs font-bold text-pink-600 uppercase mb-2">Alasan Izin</p>
                    <p className="text-sm text-gray-700">{selectedDetail.izinReason}</p>
                  </div>
                )}

                {/* Masuk Section */}
                {selectedDetail.masukTime && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <img src={checkIcon} className="w-4 h-4" style={iconColorStyles.white} alt="" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">{t('attendance.checkInTitle')}</p>
                        <p className="font-bold text-lg text-gray-800">{selectedDetail.masukTime}</p>
                      </div>
                    </div>

                    {/* Masuk Photo */}
                    {selectedDetail.masukPhoto && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Foto Bukti:</p>
                        <div
                          className="relative group cursor-pointer"
                          onClick={() => {
                            setPreviewPhotoUrl(selectedDetail.masukPhoto);
                            setPreviewPhotoLabel(t('attendance.checkInPhoto'));
                            setShowPhotoPreview(true);
                          }}
                        >
                          <img
                            src={selectedDetail.masukPhoto}
                            alt="Foto Masuk"
                            className="w-full h-40 object-cover rounded-lg border border-gray-200 transition-all group-hover:opacity-90 group-hover:shadow-lg"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-lg transition-all">
                            <div className="bg-white/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-center">Tap untuk memperbesar</p>
                      </div>
                    )}

                    {/* Masuk Location */}
                    {selectedDetail.masukLocation && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Lokasi:</p>
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-xs text-gray-600">
                            {selectedDetail.masukLocation.latitude?.toFixed(6)}, {selectedDetail.masukLocation.longitude?.toFixed(6)}
                          </p>
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${selectedDetail.masukLocation.latitude},${selectedDetail.masukLocation.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Buka di Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Pulang Section */}
                {selectedDetail.pulangTime && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                        <img src={clockIcon} className="w-4 h-4" style={iconColorStyles.white} alt="" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">{t('attendance.checkOutTitle')}</p>
                        <p className="font-bold text-lg text-gray-800">{selectedDetail.pulangTime}</p>
                      </div>
                    </div>

                    {/* Pulang Photo */}
                    {selectedDetail.pulangPhoto && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Foto Bukti:</p>
                        <div
                          className="relative group cursor-pointer"
                          onClick={() => {
                            setPreviewPhotoUrl(selectedDetail.pulangPhoto);
                            setPreviewPhotoLabel(t('attendance.checkOutPhoto'));
                            setShowPhotoPreview(true);
                          }}
                        >
                          <img
                            src={selectedDetail.pulangPhoto}
                            alt="Foto Pulang"
                            className="w-full h-40 object-cover rounded-lg border border-gray-200 transition-all group-hover:opacity-90 group-hover:shadow-lg"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-lg transition-all">
                            <div className="bg-white/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-center">Tap untuk memperbesar</p>
                      </div>
                    )}

                    {/* Pulang Location */}
                    {selectedDetail.pulangLocation && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Lokasi:</p>
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-xs text-gray-600">
                            {selectedDetail.pulangLocation.latitude?.toFixed(6)}, {selectedDetail.pulangLocation.longitude?.toFixed(6)}
                          </p>
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${selectedDetail.pulangLocation.latitude},${selectedDetail.pulangLocation.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Buka di Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* No Data Message */}
                {!selectedDetail.masukPhoto && !selectedDetail.pulangPhoto && !selectedDetail.masukLocation && !selectedDetail.pulangLocation && !selectedDetail.izinReason && (
                  <div className="text-center py-8 text-gray-400">
                    <img src={imageIcon} alt="" className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Tidak ada detail yang tersedia</p>
                  </div>
                )}
              </div>



            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Gallery Input */}
      <input
        type="file"
        ref={galleryInputRef}
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result);
            reader.readAsDataURL(file);
          }
        }}
        accept="image/*"
        className="hidden"
      />

      {/* Photo Options Popup */}
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

              </div>

              {/* Title with close button */}
              <div className="px-6 pb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">{t('home.selectMethod')}</h3>
                <button
                  onClick={() => setShowPhotoOptions(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Options */}
              <div className="px-6 pb-6">
                {/* Pilih dari galeri */}
                <button
                  onClick={handleSelectFromGallery}
                  className="w-full flex items-center gap-4 py-4 border-b border-gray-100"
                >
                  <img
                    src={galleryIcon}
                    alt="Gallery"
                    className="w-6 h-6"
                    style={{ filter: 'invert(55%) sepia(89%) saturate(438%) hue-rotate(166deg) brightness(92%) contrast(89%)' }}
                  />
                  <span className="text-base text-gray-700">{t('home.viewGallery')}</span>
                </button>

                {/* Ambil foto */}
                <button
                  onClick={handleTakePhoto}
                  className="w-full flex items-center gap-4 py-4"
                >
                  <img
                    src={camIcon}
                    alt="Camera"
                    className="w-6 h-6"
                    style={{ filter: 'invert(55%) sepia(89%) saturate(438%) hue-rotate(166deg) brightness(92%) contrast(89%)' }}
                  />
                  <span className="text-base text-gray-700">{t('home.takePhoto')}</span>
                </button>

                {/* Info text */}
                <p className="text-xs text-gray-400 mt-4">*Foto harus tampak wajah dan tempat lokasi</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Fullscreen Photo Preview Modal */}
        {showPhotoPreview && previewPhotoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center"
            onClick={() => setShowPhotoPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative w-full h-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
                <h3 className="text-white font-semibold text-lg">{previewPhotoLabel}</h3>
                <button
                  onClick={() => setShowPhotoPreview(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Photo Container */}
              <div className="flex-1 flex items-center justify-center p-4 pt-16 pb-20">
                <img
                  src={previewPhotoUrl}
                  alt={previewPhotoLabel}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  onClick={() => setShowPhotoPreview(false)}
                />
              </div>

              {/* Footer Instructions */}
              <div className="px-4 py-4 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0">
                <p className="text-white/80 text-sm text-center">Tap foto atau tombol × untuk menutup</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Attendance;