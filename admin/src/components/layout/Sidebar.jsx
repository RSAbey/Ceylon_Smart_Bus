// Sidebar: brand, menu from config/navigationItems.js (active = Primary 100 bg + Primary 600 text), destructive Logout.
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, UserCog } from 'lucide-react';
import { ADMIN_NAVIGATION_ITEMS } from '../../config/navigationItems';
import { useAuth } from '../../context/AuthContext';
import { ICON_SIZES } from '../../theme/iconSizes';
import ConfirmDialog from '../ui/ConfirmDialog';

/**
 * Builds the className for a menu link (react-router passes isActive).
 * @param {{isActive: boolean}} linkState - NavLink state.
 * @returns {string} Class names.
 */
function getNavigationLinkClassName({ isActive }) {
  return isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link';
}

/**
 * Left navigation. On screens under 900 px it slides in when `isOpen` is true.
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the collapsed sidebar is shown (small screens).
 * @param {Function} props.onNavigate - Called after a link is chosen (closes the sidebar on small screens).
 * @returns {import('react').JSX.Element} The sidebar.
 */
export default function Sidebar({ isOpen, onNavigate }) {
  const { logout } = useAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  return (
    <aside className={isOpen ? 'sidebar sidebar--open' : 'sidebar'} aria-label="Main navigation">
      <div className="sidebar__brand">
        <img src="/logo.png" alt="" className="sidebar__logo" />
        <div>
          <p className="text-heading3">Ceylon Smart Bus</p>
          <p className="text-caption text-muted">Admin dashboard</p>
        </div>
      </div>

      <nav className="sidebar__nav">
        {ADMIN_NAVIGATION_ITEMS.map((navigationItem) => {
          const NavigationIcon = navigationItem.icon;
          return (
            <NavLink
              key={navigationItem.key}
              to={navigationItem.path}
              end={navigationItem.path === '/'}
              className={getNavigationLinkClassName}
              onClick={onNavigate}
            >
              <NavigationIcon size={ICON_SIZES.medium} aria-hidden="true" />
              {navigationItem.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <NavLink to="/profile" className={getNavigationLinkClassName} onClick={onNavigate}>
          <UserCog size={ICON_SIZES.medium} aria-hidden="true" />
          My profile
        </NavLink>
        <button type="button" className="sidebar__logout" onClick={() => setIsLogoutDialogOpen(true)}>
          <LogOut size={ICON_SIZES.medium} aria-hidden="true" />
          Logout
        </button>
      </div>

      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        title="Log out?"
        message="You will need to sign in again to manage the fleet."
        confirmLabel="Logout"
        isDestructive
        onConfirm={logout}
        onCancel={() => setIsLogoutDialogOpen(false)}
      />
    </aside>
  );
}
