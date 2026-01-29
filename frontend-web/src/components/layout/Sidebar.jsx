import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { lazyComponents } from '../../App';

// Import icon images dari assets
import dashboardIcon from '../../assets/grid.png';
import wargaIcon from '../../assets/group.png';
import jadwalIcon from '../../assets/jadwal.png';
import kehadiranIcon from '../../assets/kehadiran.png';
import laporanIcon from '../../assets/laporan.png';
import kegiatanIcon from '../../assets/status.png';
import keluarIcon from '../../assets/keluar.png';
import settingIcon from '../../assets/setting.png'; // Pastikan file ini ada
import moneyIcon from '../../assets/money.png';
import manageIcon from '../../assets/manage.png';

const Sidebar = ({ sidebarOpen, setSidebarOpen, isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const { logout, isAdmin } = useAuth();

  // State untuk dropdown sections
  const [sectionsOpen, setSectionsOpen] = useState({
    absensi: true,
    kampung: true
  });

  // Toggle collapse function
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Toggle section dropdown
  const toggleSection = (sectionName) => {
    setSectionsOpen(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Menu items dengan kategori
  const menuSections = [
    {
      id: 'main',
      title: null, // No dropdown, just regular items
      items: [
        {
          icon: wargaIcon,
          isImage: true,
          label: 'Warga',
          path: '/users',
          componentName: 'Users',
          adminOnly: true
        },
      ]
    },
    {
      id: 'absensi',
      title: 'Informasi Absensi',
      items: [
        {
          icon: dashboardIcon,
          isImage: true,
          label: 'Dashboard',
          path: '/dashboard',
          componentName: 'Dashboard'
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
          icon: laporanIcon,
          isImage: true,
          label: 'Laporan',
          path: '/reports',
          componentName: 'Reports',
          adminOnly: true
        },
      ]
    },
    {
      id: 'kampung',
      title: 'Informasi Kampung',
      items: [
        {
          icon: kegiatanIcon,
          isImage: true,
          label: 'Kegiatan',
          path: '/activities',
          componentName: 'Activities',
          adminOnly: true
        },
        {
          icon: moneyIcon,
          isImage: true,
          label: 'Keuangan',
          path: '/finances',
          componentName: 'Finances'
        },
        {
          icon: manageIcon,
          isImage: true,
          label: 'Kelola Keuangan',
          path: '/finance-management',
          componentName: 'FinanceManagement',
          adminOnly: true
        },
      ]
    },
    {
      id: 'settings',
      title: null,
      items: [
        {
          icon: settingIcon,
          isImage: true,
          label: 'Setting',
          path: '/settings',
          componentName: 'Settings'
        },
      ]
    }
  ];

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
          .sidebar-tooltip {
            visibility: hidden;
            opacity: 0;
            transition: all 0.2s ease-in-out;
          }
          .sidebar-item:hover .sidebar-tooltip {
            visibility: visible;
            opacity: 1;
          }
        `}
      </style>
      <div className={`h-screen bg-primary text-white fixed left-0 top-0 flex flex-col z-40 shadow-2xl
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo & Toggle Button */}
        <div className={`p-4 border-b border-primary-light flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <h1 className="text-xl font-bold whitespace-nowrap">JagaKampung</h1>
            <p className="text-xs text-primary-light mt-1 whitespace-nowrap">Dashboard Admin RW 01</p>
          </div>

          {/* Toggle Button - Only visible on large screens */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-primary-dark hover:bg-primary-light/20 transition-colors duration-200"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight size={18} className="text-white" />
            ) : (
              <ChevronLeft size={18} className="text-white" />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav
          className={`flex-1 py-6 space-y-2 overflow-y-auto hide-scrollbar transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}
          style={{
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* IE and Edge */
          }}
        >
          {menuSections.map((section) => {
            // Filter items based on adminOnly
            const visibleItems = section.items.filter(item => !item.adminOnly || isAdmin);

            // Don't render section if no visible items
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.id} className="mb-2">
                {/* Section Title - Dropdown Header */}
                {section.title && !isCollapsed && (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-white/60 hover:text-white/80 transition-colors uppercase tracking-wider"
                  >
                    <span>{section.title}</span>
                    {sectionsOpen[section.id] ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                )}

                {/* Menu Items in Section */}
                <div className={`space-y-1 transition-all duration-300 overflow-hidden ${section.title && !sectionsOpen[section.id] && !isCollapsed ? 'max-h-0' : 'max-h-96'
                  }`}>
                  {visibleItems.map((item) => {
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
                            sidebar-item relative flex items-center rounded-lg overflow-hidden
                            group cursor-pointer transition-all duration-200
                            ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'}
                            ${isActive
                              ? 'bg-white text-primary font-semibold shadow-lg'
                              : 'text-white/80 hover:bg-primary-dark hover:text-white'
                            }
                          `}
                        >
                          {/* Active indicator bar */}
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                          )}

                          {/* Icon - Image atau Lucide React */}
                          <div className="relative z-10 flex-shrink-0">
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

                          {/* Label with transition */}
                          <span className={`relative z-10 whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                            {item.label}
                          </span>

                          {/* Tooltip when collapsed */}
                          {isCollapsed && (
                            <div className="sidebar-tooltip absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-50 shadow-lg">
                              {item.label}
                              <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className={`border-t border-primary-light transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <button
            onClick={handleLogout}
            className={`
              sidebar-item relative flex items-center rounded-lg w-full text-white/80 
              hover:bg-primary-dark hover:text-white transition-all duration-200 overflow-hidden group
              ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'}
            `}
          >
            <img
              src={keluarIcon}
              alt="Keluar"
              className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity relative z-10 flex-shrink-0"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <span className={`relative z-10 font-medium whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
              Keluar
            </span>

            {/* Tooltip when collapsed */}
            {isCollapsed && (
              <div className="sidebar-tooltip absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-50 shadow-lg">
                Keluar
                <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
};


export default Sidebar;