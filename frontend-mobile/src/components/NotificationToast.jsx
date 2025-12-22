import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Bell, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

const NotificationToast = ({ notification, onClose, onNavigate }) => {
    useEffect(() => {
        if (!notification) return;

        console.log('📢 NotificationToast mounted with:', notification);

        const timer = setTimeout(() => {
            console.log('⏰ Auto-dismissing toast');
            onClose();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => {
            console.log('🧹 Cleaning up toast timer');
            clearTimeout(timer);
        };
    }, [notification, onClose]);

    if (!notification) {
        console.log('❌ No notification to display');
        return null;
    }

    // Determine icon and color based on notification type
    const getNotificationStyle = (type) => {
        switch (type) {
            case 'schedule':
                return {
                    icon: <Calendar className="w-5 h-5" />,
                    bgColor: 'bg-blue-500',
                    textColor: 'text-blue-500'
                };
            case 'approval':
                return {
                    icon: <CheckCircle className="w-5 h-5" />,
                    bgColor: 'bg-green-500',
                    textColor: 'text-green-500'
                };
            case 'rejection':
                return {
                    icon: <AlertCircle className="w-5 h-5" />,
                    bgColor: 'bg-red-500',
                    textColor: 'text-red-500'
                };
            default:
                return {
                    icon: <Bell className="w-5 h-5" />,
                    bgColor: 'bg-gray-700',
                    textColor: 'text-gray-700'
                };
        }
    };

    const style = getNotificationStyle(notification.type);

    console.log('✅ Rendering toast with style:', style);

    return (
        <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-4 left-4 right-4 z-[9999] mx-auto max-w-md"
            onClick={() => onNavigate(notification)}
        >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden cursor-pointer border border-gray-100">
                {/* Colored top bar */}
                <div className={`${style.bgColor} h-1 w-full`}></div>

                <div className="p-4 flex items-start gap-3">
                    {/* Icon */}
                    <div className={`${style.bgColor} rounded-full p-2 flex-shrink-0`}>
                        <div className="text-white">
                            {style.icon}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm mb-0.5 truncate">
                            {notification.title}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-2">
                            {notification.message}
                        </p>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default NotificationToast;
