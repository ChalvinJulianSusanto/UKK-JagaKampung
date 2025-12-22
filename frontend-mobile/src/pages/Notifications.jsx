import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trash2, ChevronLeft, X, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { notificationsAPI } from '../api';
import { Container } from '../components/layout';
import { Loading } from '../components/common';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

// Import icons from assets
import timeIcon from '../assets/time.png';
import setujuIcon from '../assets/setuju.png';
import tolakIcon from '../assets/tolak.png';
import bellIcon from '../assets/bell.png';
import noReachedIcon from '../assets/no reached.png';

// Helper function to translate notification content
const translateNotifTitle = (title, lang) => {
  const contentTitles = translations[lang]?.notifications?.contentTitles || {};
  return contentTitles[title] || title;
};

// Helper function to translate notification message
const translateNotifMessage = (message, lang) => {
  if (!message) return message;

  // Clean up the message - remove extra newlines and format properly
  let cleanMessage = message
    .replace(/\n+/g, ' ')  // Replace all newlines with single space
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .trim();

  if (lang === 'id') return cleanMessage;

  // Translation mappings for message parts
  const messageTranslations = {
    'Anda telah ditambahkan ke jadwal ronda': 'You have been added to the patrol schedule',
    'Jadwal telah diterbitkan ke jadwal ronda': 'Schedule has been published to the patrol schedule',
    'Jadwal ronda telah diperbarui': 'Patrol schedule has been updated',
    'Diperbarui pada': 'Updated on',
    'pada': 'on',
    'RT': 'RT',
    'Senin': 'Monday',
    'Selasa': 'Tuesday',
    'Rabu': 'Wednesday',
    'Kamis': 'Thursday',
    'Jumat': 'Friday',
    'Sabtu': 'Saturday',
    'Minggu': 'Sunday',
  };

  let translatedMessage = cleanMessage;
  Object.keys(messageTranslations).forEach(key => {
    translatedMessage = translatedMessage.replace(new RegExp(key, 'g'), messageTranslations[key]);
  });

  return translatedMessage;
};

const Notifications = () => {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Selection mode states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchNotifications();

    // Scroll listener for glassmorphism effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationsAPI.getNotifications({ limit: 50 });
      if (response.success) {
        setNotifications(response.data);
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error(t('notifications.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  // Selection handlers
  const toggleSelection = (id) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds([id]);
    } else {
      setSelectedIds(prev =>
        prev.includes(id)
          ? prev.filter(selectedId => selectedId !== id)
          : [...prev, id]
      );
    }
  };

  const selectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n._id));
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;

    try {
      const deletePromises = selectedIds.map(id =>
        notificationsAPI.deleteNotification(id)
      );

      await Promise.all(deletePromises);

      setNotifications(notifications.filter(n => !selectedIds.includes(n._id)));

      // Update unread count
      const deletedUnreadCount = notifications.filter(
        n => selectedIds.includes(n._id) && !n.read
      ).length;
      setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount));

      toast.success(`${selectedIds.length} ${t('notifications.deleteSuccess')}`);
      exitSelectionMode();
    } catch (error) {
      console.error('Error deleting selected:', error);
      toast.error(t('notifications.deleteFailed'));
    }
  };

  const markSelectedAsRead = async () => {
    if (selectedIds.length === 0) return;

    try {
      const markPromises = selectedIds.map(id =>
        notificationsAPI.markAsRead(id)
      );

      await Promise.all(markPromises);

      setNotifications(notifications.map(notif =>
        selectedIds.includes(notif._id) ? { ...notif, read: true } : notif
      ));

      // Update unread count
      const markedUnreadCount = notifications.filter(
        n => selectedIds.includes(n._id) && !n.read
      ).length;
      setUnreadCount(prev => Math.max(0, prev - markedUnreadCount));

      toast.success(`${selectedIds.length} ${t('notifications.markReadSuccess')}`);
      exitSelectionMode();
    } catch (error) {
      console.error('Error marking selected as read:', error);
      toast.error(t('notifications.markReadFailed'));
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await notificationsAPI.markAllAsRead();
      if (response.success) {
        setNotifications(notifications.map(notif => ({ ...notif, read: true })));
        setUnreadCount(0);
        toast.success(t('notifications.allMarkedAsRead'));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error(t('notifications.markAllFailed'));
    }
  };

  // Get icon based on notification content/type
  const getNotificationIcon = (notification) => {
    const title = notification.title?.toLowerCase() || '';
    const message = notification.message?.toLowerCase() || '';
    const combined = `${title} ${message}`;

    // Check for schedule/jadwal related
    if (combined.includes('jadwal') || combined.includes('schedule') || combined.includes('ronda')) {
      return timeIcon;
    }
    // Check for approved/disetujui
    if (combined.includes('disetujui') || combined.includes('approved') || combined.includes('diterima')) {
      return setujuIcon;
    }
    // Check for rejected/ditolak
    if (combined.includes('ditolak') || combined.includes('rejected') || combined.includes('reject')) {
      return tolakIcon;
    }
    // Default icon
    return bellIcon;
  };

  // Get formatted date text - "Senin, 15/12/2025" format for subtext
  const getFormattedDate = (date) => {
    const notifDate = new Date(date);
    return format(notifDate, 'EEEE, dd/MM/yyyy', { locale: id });
  };

  // Get relative time text for notification timestamp
  const getRelativeTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInMs = now - notifDate;
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) return t('notifications.justNow');
    if (diffInMinutes < 60) return `${diffInMinutes} ${t('notifications.minutesAgo')}`;
    if (diffInHours < 24) return `${diffInHours} ${t('notifications.hoursAgo')}`;
    if (diffInDays <= 6) return `${diffInDays} ${t('notifications.daysAgo')}`;
    // More than 6 days, show full date format
    return format(notifDate, 'EEEE, dd/MM/yyyy', { locale: id });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <motion.header
        initial={false}
        animate={{
          backgroundColor: isScrolled ? 'rgba(249, 250, 251, 0.7)' : 'rgba(249, 250, 251, 1)',
        }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-sm' : 'shadow-none'
          }`}
        style={{
          backdropFilter: isScrolled ? 'blur(16px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(16px) saturate(180%)' : 'none',
        }}
      >
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (selectionMode) {
                  exitSelectionMode();
                } else {
                  // Go back to previous page in history
                  // If no history exists (e.g., direct URL access), fallback to home
                  if (window.history.state && window.history.state.idx > 0) {
                    navigate(-1);
                  } else {
                    navigate('/');
                  }
                }
              }}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              {selectionMode ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              )}
            </motion.button>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900">{t('notifications.title')}</h1>
              <p className="text-xs text-gray-500">
                {selectionMode
                  ? `${selectedIds.length} ${t('notifications.selected')}`
                  : `${unreadCount} ${t('notifications.unread')}`
                }
              </p>
            </div>

            {/* Select All Button in selection mode */}
            {selectionMode && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={selectAll}
                className="text-xs font-medium text-blue-600 px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {t('notifications.selectAll')}
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="pt-20">
        <Container>
          {/* Mark All as Read Button - Only when NOT in selection mode */}
          {!selectionMode && unreadCount > 0 && notifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={markAllAsRead}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all shadow-sm"
              >
                <CheckCheck className="w-5 h-5 stroke-[2.5]" />
                <span className="tracking-wide">{t('notifications.markAllAsRead')}</span>
              </motion.button>
            </motion.div>
          )}

          {/* Notifications List */}
          {loading ? (
            <Loading size="lg" text={t('notifications.loadingNotifications')} className="py-20" />
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <img
                src={noReachedIcon}
                alt="No notifications"
                className="w-48 h-48 object-contain mb-4"
              />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {t('notifications.noNotifications')}
              </h3>
              <p className="text-sm text-gray-500 text-center max-w-xs">
                {t('notifications.noNotificationsDesc')}
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              <AnimatePresence>
                {notifications.map((notif, index) => {
                  const isSelected = selectedIds.includes(notif._id);
                  const notifIcon = getNotificationIcon(notif);

                  return (
                    <motion.div
                      key={notif._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.02 }}
                      layout
                      onClick={() => toggleSelection(notif._id)}
                      className={`border-b-2 first:rounded-t-2xl last:rounded-b-2xl last:border-b-0 transition-all cursor-pointer ${isSelected
                        ? 'bg-red-50 border-red-100'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-start gap-3 p-4">
                        {/* Icon / Checkbox */}
                        <div
                          className="flex-shrink-0 relative"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelection(notif._id);
                          }}
                        >
                          {selectionMode ? (
                            /* Selection Checkbox */
                            isSelected ? (
                              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                                <Check className="w-4 h-4 text-white stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 border-2 border-gray-300 rounded-full"></div>
                            )
                          ) : (
                            /* Notification Icon */
                            <div className="relative w-12 h-12 flex items-center justify-center">
                              <img
                                src={notifIcon}
                                alt="notification"
                                className="w-10 h-10 object-contain"
                              />
                              {!notif.read && (
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <h3 className={`text-sm font-bold leading-tight mb-1 ${!notif.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                            {translateNotifTitle(notif.title, currentLanguage)}
                          </h3>

                          {/* Message/Description - Enhanced formatting */}
                          <p className="text-xs text-gray-600 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
                            {translateNotifMessage(notif.message, currentLanguage)}
                          </p>

                          {/* JagaKampung label */}
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            {t('notifications.appLabel')}
                          </span>
                        </div>

                        {/* Timestamp */}
                        <div className="flex-shrink-0 text-right">
                          <span className="text-[10px] text-gray-400">
                            {getRelativeTime(notif.createdAt)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </Container>

        {/* Bottom Action Bar - Show when items selected */}
        <AnimatePresence>
          {selectionMode && selectedIds.length > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-24 left-0 right-0 z-40 flex justify-center px-4"
            >
              {/* Delete Selected Button - Red Rounded Pill */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={deleteSelected}
                className="flex items-center justify-center gap-2 py-3 px-8 bg-error text-white rounded-full font-semibold text-sm hover:bg-error-dark transition-all shadow-lg"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('notifications.deleteSelected')}</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Notifications;
