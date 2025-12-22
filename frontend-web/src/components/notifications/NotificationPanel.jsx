import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Bell, Check, Trash2, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { notificationsAPI } from '../../api/notifications';

const NotificationPanel = ({ isOpen, onClose, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Notify parent when unread count changes
  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

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
      toast.error('Gagal memuat notifikasi');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const response = await notificationsAPI.markAsRead(id);
      if (response.success) {
        setNotifications(notifications.map(notif =>
          notif._id === id ? { ...notif, read: true } : notif
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Gagal menandai sebagai dibaca');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await notificationsAPI.markAllAsRead();
      if (response.success) {
        setNotifications(notifications.map(notif => ({ ...notif, read: true })));
        setUnreadCount(0);
        toast.success('Semua notifikasi ditandai sebagai dibaca');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Gagal menandai semua sebagai dibaca');
    }
  };

  const deleteNotification = async (id) => {
    try {
      const response = await notificationsAPI.deleteNotification(id);
      if (response.success) {
        const deletedNotif = notifications.find(n => n._id === id);
        setNotifications(notifications.filter(notif => notif._id !== id));
        if (deletedNotif && !deletedNotif.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        toast.success('Notifikasi dihapus');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Gagal menghapus notifikasi');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-success" size={20} />;
      case 'warning':
        return <AlertCircle className="text-warning" size={20} />;
      case 'error':
        return <AlertCircle className="text-error" size={20} />;
      default:
        return <Info className="text-primary" size={20} />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-success/10 border-success/20';
      case 'warning':
        return 'bg-warning/10 border-warning/20';
      case 'error':
        return 'bg-error/10 border-error/20';
      default:
        return 'bg-primary/10 border-primary/20';
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Notifikasi</h2>
                    <p className="text-sm text-white/80">
                      {unreadCount} belum dibaca
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Mark all as read */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors w-full justify-center"
                >
                  <Check size={16} />
                  Tandai semua telah dibaca
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-neutral">Memuat notifikasi...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="mx-auto text-neutral/30 mb-4" size={48} />
                  <p className="text-neutral">Tidak ada notifikasi</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <motion.div
                    key={notif._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className={`p-4 rounded-lg border-2 ${getBgColor(notif.type)} ${
                      !notif.read ? 'border-l-4' : ''
                    } transition-all`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-semibold text-sm ${
                            !notif.read ? 'text-neutral-dark' : 'text-neutral'
                          }`}>
                            {notif.title}
                          </h3>
                          {!notif.read && (
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-neutral mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-xs text-neutral/60 mt-2">
                          {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(notif._id)}
                              className="text-xs text-primary hover:text-primary-dark font-medium"
                            >
                              Tandai dibaca
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif._id)}
                            className="text-xs text-error hover:text-error/80 font-medium ml-auto"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default NotificationPanel;
