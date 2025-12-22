import { useState, useEffect, useRef } from 'react';
import { Bell, User, Menu, ChevronDown, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationPanel from '../notifications/NotificationPanel';
import InfoModal from '../common/InfoModal';
import { notificationsAPI } from '../../api/notifications';
import biruLogo from '../../assets/birulogo.png';
import bundarIcon from '../../assets/bundar.png';
import keluarIcon from '../../assets/keluar.png';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const dropdownRef = useRef(null);

  // --- 1. State & Logic Waktu Real-time ---
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formattedTime = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  }).format(currentTime);

  const addressText = "Jl. Manukan Lor IV I No.51, Banjar Sugihan, Kec. Tandes, Surabaya, Jawa Timur 60185";

  // --- 2. Logic Notifikasi ---
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isNotificationOpen) {
      fetchUnreadCount();
    }
  }, [isNotificationOpen]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-neutral-light px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* CSS Animasi Slider ke Kiri */}
      <style>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-left {
          display: inline-block;
          white-space: nowrap;
          animation: marquee-left 35s linear infinite;
        }
        .marquee-container:hover .animate-marquee-left {
          animation-play-state: paused;
        }
      `}</style>

      <div className="flex items-center gap-4 overflow-hidden">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-neutral hover:text-neutral-dark hover:bg-neutral-light rounded-lg transition-colors flex-shrink-0"
        >
          <Menu size={24} />
        </button>

        {/* Logo and Brand */}
        <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
          <img
            src={biruLogo}
            alt="JagaKampung Logo"
            className="h-8 w-auto md:h-10 object-contain flex-shrink-0"
          />
          <div className="border-l border-gray-300 h-8 md:h-10 hidden sm:block flex-shrink-0"></div>
          
          <div className="hidden sm:block overflow-hidden">
            <h2 className="text-lg md:text-1xl font-bold text-primary">
              RW 01
            </h2>
            
            {/* AREA ANIMASI TEKS */}
            <div className="w-[300px] lg:w-[500px] overflow-hidden relative marquee-container">
              <div className="whitespace-nowrap text-xs text-neutral">
                {/* Container Animasi */}
                <div className="inline-block animate-marquee-left">
                  
                  {/* Bagian 1 (Loop Awal) */}
                  <span className="mr-3">{addressText}</span>
                  <span className="mr-3">|</span>
                  <span className="mr-10">{formattedTime}</span> {/* Jarak antar loop agak jauh (mr-12) */}

                  {/* Bagian 2 (Loop Kedua - Duplikasi untuk efek tanpa putus) */}
                  <span className="mr-3">{addressText}</span>
                  <span className="mr-3">|</span>
                  <span className="mr-10">{formattedTime}</span>

                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {/* Notifications */}
        <button
          onClick={() => setIsNotificationOpen(true)}
          className="relative p-2 text-neutral hover:text-neutral-dark hover:bg-neutral-light rounded-lg transition-colors"
        >
          <Bell size={20} className="md:w-6 md:h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-error rounded-full px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-lg hover:bg-neutral-light transition-colors cursor-pointer border border-transparent hover:border-gray-100"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden shadow-md ring-2 ring-white hover:ring-primary transition-all relative">
              {user?.photo ? (
                <img
                  key={user.photo}
                  src={user.photo.startsWith('http') ? user.photo : `http://localhost:5000${user.photo}`}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div className={`w-full h-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-semibold ${user?.photo ? 'hidden' : ''}`}>
                {user?.name?.charAt(0).toUpperCase() || <User size={20} />}
              </div>
            </div>
            <div className="hidden sm:block text-left">
              <p className="font-medium text-neutral-dark text-sm">{user?.name || 'Admin'}</p>
              <p className="text-xs text-neutral capitalize">{user?.role || 'Administrator'}</p>
            </div>
            <ChevronDown 
              size={16} 
              className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                <p className="font-medium text-gray-900">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'Administrator'}</p>
              </div>
              
              <div className="p-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-black hover:bg-black/5 rounded-lg transition-all"
                >
                  <div className="w-8 h-8 flex items-center justify-center">
                    <img src={bundarIcon} alt="Pengaturan" className="w-5 h-5 object-contain" />
                  </div>
                  <span className="font-medium">Pengaturan Profil</span>
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsInfoOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-black hover:bg-black/5 rounded-lg transition-all mt-1"
                >
                   <div className="w-8 h-8 flex items-center justify-center text-black">
                    <Info size={20} />
                  </div>
                  <span className="font-medium">Info</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-black hover:bg-black/5 rounded-lg transition-all mt-1"
                >
                  <div className="w-8 h-8 flex items-center justify-center">
                    <img src={keluarIcon} alt="Keluar" className="w-5 h-5 object-contain" />
                  </div>
                  <span className="font-medium">Keluar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <NotificationPanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />

      <InfoModal 
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </header>
  );
};

export default Header;