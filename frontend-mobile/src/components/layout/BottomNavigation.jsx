import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import homeIcon from '../../assets/home.png';
import scheduleIcon from '../../assets/schedule.png';
import checkIcon from '../../assets/scan.png';
import analisisIcon from '../../assets/analisis.png';
import userIcon from '../../assets/user (2).png';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    {
      path: '/',
      icon: homeIcon,
      label: t('bottomNav.home'),
    },
    {
      path: '/schedule',
      icon: scheduleIcon,
      label: t('bottomNav.schedule'),
    },
    {
      path: '/attendance',
      icon: checkIcon,
      label: t('bottomNav.attendance'),
    },
    {
      path: '/analytics',
      icon: analisisIcon,
      label: t('bottomNav.activity'),
    },
    {
      path: '/profile',
      icon: userIcon,
      label: t('bottomNav.profile'),
    },
  ];

  const isActive = (path) => {
    // Special handling for attendance-calendar - should only activate Home
    if (location.pathname === '/attendance-calendar') {
      return path === '/';
    }

    // Special handling for activity detail pages - should activate Home
    if (location.pathname.startsWith('/activity/')) {
      return path === '/';
    }

    if (path === '/') {
      return location.pathname === '/';
    }

    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-bottom-nav safe-area-bottom z-40">
      <div className="flex items-center justify-around h-16 relative overflow-hidden">
        {navItems.map((item, index) => {
          const active = isActive(item.path);

          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${active ? 'text-primary' : 'text-gray-500'
                }`}
            >
              <img
                src={item.icon}
                alt={item.label}
                className={`w-6 h-6 transition-all ${active ? 'brightness-0 saturate-100' : 'opacity-40'
                  }`}
                style={active ? {
                  filter: 'invert(35%) sepia(89%) saturate(1789%) hue-rotate(198deg) brightness(95%) contrast(101%)'
                } : {}}
              />
              <span
                className={`text-xs mt-1 font-medium ${active ? 'text-primary' : 'text-gray-500'
                  }`}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
