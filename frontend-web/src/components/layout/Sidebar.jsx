import { Link, useLocation } from 'react-router-dom';
// import { Settings } from 'lucide-react'; // Dihapus karena sudah diganti gambar
import { useAuth } from '../../context/AuthContext';
import { lazyComponents } from '../../App';

// Import icon images dari assets
import dashboardIcon from '../../assets/grid.png';
import wargaIcon from '../../assets/group.png';
import jadwalIcon from '../../assets/jadwal.png';
import kehadiranIcon from '../../assets/kehadiran.png';
import analisisIcon from '../../assets/analisis.png';
import laporanIcon from '../../assets/laporan.png';
import keluarIcon from '../../assets/keluar.png';
import settingIcon from '../../assets/setting.png'; // Pastikan file ini ada

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const { logout, isAdmin } = useAuth();

  const allMenuItems = [
    {
      icon: dashboardIcon,
      isImage: true,
      label: 'Dashboard',
      path: '/dashboard',
      componentName: 'Dashboard'
    },
    {
      icon: wargaIcon,
      isImage: true,
      label: 'Warga',
      path: '/users',
      componentName: 'Users',
      adminOnly: true
    },
    {
      icon: jadwalIcon,
      isImage: true,
      label: 'Jadwal',
      path: '/schedules',
      componentName: 'Schedules'
    },
    {
      icon: kehadiranIcon,
      isImage: true,
      label: 'Kehadiran',
      path: '/attendances',
      componentName: 'Attendances'
    },
    {
      icon: analisisIcon,
      isImage: true,
      label: 'Analisis',
      path: '/analytics',
      componentName: 'Analytics'
    },
    {
      icon: laporanIcon,
      isImage: true,
      label: 'Laporan',
      path: '/reports',
      componentName: 'Reports',
      adminOnly: true
    },
    {
      icon: settingIcon, // Menggunakan icon dari assets
      isImage: true,     // Diubah menjadi true
      label: 'Setting',
      path: '/settings',
      componentName: 'Settings'
    },
  ];

  // Filter menu berdasarkan role user
  const menuItems = allMenuItems.filter(item => !item.adminOnly || isAdmin);

  // Prefetch component saat hover untuk transisi lebih smooth
  const handlePrefetch = (componentName) => {
    const component = lazyComponents[componentName];
    if (component && component.preload) {
      component.preload();
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleLinkClick = () => {
    if (setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <div className={`h-screen w-64 bg-primary text-white fixed left-0 top-0 flex flex-col z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Logo */}
        <div className="p-6 border-b border-primary-light">
          <h1 className="text-2xl font-bold">JagaKampung</h1>
          <p className="text-sm text-primary-light mt-1">Dashboard Admin RW 01</p>
        </div>

        {/* Menu Items */}
        <nav
          className="flex-1 px-4 py-6 space-y-2 overflow-y-auto hide-scrollbar"
          style={{
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* IE and Edge */
          }}
        >
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                onMouseEnter={() => handlePrefetch(item.componentName)}
              >
                <div
                  className={`
                  relative flex items-center gap-3 px-4 py-3 rounded-lg overflow-hidden
                  group cursor-pointer
                  ${isActive
                      ? 'bg-white text-primary font-semibold shadow-lg'
                      : 'text-white/80 hover:bg-primary-dark hover:text-white transition-colors duration-150'
                    }
                `}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}

                  {/* Icon - Image atau Lucide React */}
                  <div className="relative z-10">
                    {item.isImage ? (
                      <img
                        src={item.icon}
                        alt={item.label}
                        className={`w-5 h-5 transition-all duration-150 ${isActive
                          ? ''
                          : 'opacity-80 group-hover:opacity-100'
                          }`}
                        style={
                          isActive
                            ? {
                              filter: 'invert(38%) sepia(77%) saturate(2656%) hue-rotate(191deg) brightness(95%) contrast(101%)'
                            }
                            : { filter: 'brightness(0) invert(1)' }
                        }
                      />
                    ) : (
                      // Fallback jika ada item masa depan yang pakai lucide
                      <item.icon size={20} />
                    )}
                  </div>

                  <span className="relative z-10">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-primary-light">
          <button
            onClick={handleLogout}
            className="relative flex items-center gap-3 px-4 py-3 rounded-lg w-full text-white/80 hover:bg-primary-dark hover:text-white transition-colors duration-150 overflow-hidden group"
          >
            <img
              src={keluarIcon}
              alt="Keluar"
              className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity relative z-10"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <span className="relative z-10 font-medium">Keluar</span>
          </button>
        </div>
      </div>
    </>
  );
};


export default Sidebar;