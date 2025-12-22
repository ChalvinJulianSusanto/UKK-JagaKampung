import { useState, useEffect } from 'react';
import { Bell, Menu, ArrowLeft, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationsAPI } from '../../api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const Header = ({
  title,
  subtitle,
  showBack = false,
  showNotification = true,
  onMenuClick,
  action,
  className = '',
  user, // New prop for user-centric header
}) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showGreeting, setShowGreeting] = useState(true); // Toggle between greeting and date
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch unread count periodically
  useEffect(() => {
    if (showNotification) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [showNotification]);

  // Toggle text every 10 seconds and update date
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        setShowGreeting(prev => !prev);
        setCurrentDate(new Date()); // Update current date
      }, 10000); // 10 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

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

  // Get formatted date
  const getFormattedDate = () => {
    return format(currentDate, 'EEEE, dd MMMM yyyy', { locale: id });
  };

  // User-centric header layout
  if (user) {
    return (
      <header className={`fixed top-0 left-0 right-0 bg-primary text-white safe-area-top z-50 ${className}`}>
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            {/* Left side - Avatar and User Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Avatar */}
              <motion.div
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/profile')}
                className="flex-shrink-0 cursor-pointer"
              >
                {user.photo ? (
                  <img
                    src={user.photo}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
              </motion.div>

              {/* User Info with Animation */}
              <div className="flex-1 min-w-0 pt-0.5 overflow-hidden" style={{ height: '44px' }}>
                <AnimatePresence mode="wait">
                  {showGreeting ? (
                    <motion.div
                      key="greeting"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                    >
                      <p className="text-base font-semibold truncate">
                        Halo, {user.name}
                      </p>
                      <p className="text-sm text-white/80">
                        RT {user.rt}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="date"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                    >
                      <p className="text-base font-semibold truncate">
                        {format(currentDate, 'EEEE', { locale: id })}
                      </p>
                      <p className="text-sm text-white/80 truncate">
                        {format(currentDate, 'dd MMMM yyyy', { locale: id })}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right side - Notification */}
            {showNotification && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="relative p-2 -mr-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="w-6 h-6" />
                {/* Notification badge */}
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-error rounded-full px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </header>
    );
  }

  // Default title-based header layout (backward compatible)
  return (
    <header className={`fixed top-0 left-0 right-0 bg-primary text-white safe-area-top z-50 ${className}`}>
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {showBack && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </motion.button>
            )}

            {!showBack && onMenuClick && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onMenuClick}
                className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </motion.button>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{title}</h1>
              {subtitle && (
                <p className="text-sm text-white/80 truncate">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {action}

            {showNotification && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="w-6 h-6" />
                {/* Notification badge */}
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-error rounded-full px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;