// Dashboard frame: fixed sidebar + top bar + page content; under 900 px the sidebar becomes a toggle.
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

/**
 * Wraps every protected page (pages render through <Outlet />).
 * @returns {import('react').JSX.Element} The layout.
 */
export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="admin-layout">
      <Sidebar isOpen={isSidebarOpen} onNavigate={closeSidebar} />
      <button
        type="button"
        className={isSidebarOpen ? 'admin-layout__backdrop admin-layout__backdrop--visible' : 'admin-layout__backdrop'}
        onClick={closeSidebar}
        aria-label="Close menu"
        tabIndex={isSidebarOpen ? 0 : -1}
      />
      <div className="admin-layout__main">
        <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="admin-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
