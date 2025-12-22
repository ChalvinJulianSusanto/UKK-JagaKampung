import { Outlet } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Main Content */}
      <main className="w-full">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default MainLayout;
