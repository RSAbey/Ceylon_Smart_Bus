// Top bar: menu toggle (small screens), current page name and the signed-in admin.
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ADMIN_NAVIGATION_ITEMS } from '../../config/navigationItems';
import { useAuth } from '../../context/AuthContext';
import { ICON_SIZES } from '../../theme/iconSizes';

const MAX_INITIALS = 2;

/**
 * Builds avatar initials from a full name ("Dilani Jayasekara" -> "DJ").
 * @param {string} [fullName] - Admin's full name.
 * @returns {string} Up to two uppercase letters.
 */
function getNameInitials(fullName = '') {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_INITIALS)
    .map((namePart) => namePart[0].toUpperCase())
    .join('');
}

/**
 * Finds the sidebar label of the current page.
 * @param {string} pathname - Current URL path.
 * @returns {string} Page label, or an empty string.
 */
function findCurrentPageLabel(pathname) {
  const matchingItem = ADMIN_NAVIGATION_ITEMS.find((navigationItem) =>
    navigationItem.path === '/' ? pathname === '/' : pathname.startsWith(navigationItem.path)
  );
  return matchingItem ? matchingItem.label : '';
}

/**
 * Sticky bar above every page.
 * @param {object} props - Component props.
 * @param {Function} props.onMenuClick - Opens the sidebar on small screens.
 * @returns {import('react').JSX.Element} The top bar.
 */
export default function TopBar({ onMenuClick }) {
  const { user } = useAuth();
  const currentLocation = useLocation();

  return (
    <header className="topbar">
      <button type="button" className="icon-button topbar__menu-button" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={ICON_SIZES.large} aria-hidden="true" />
      </button>
      <p className="topbar__page text-section-heading text-muted">{findCurrentPageLabel(currentLocation.pathname)}</p>
      {/* The signed-in name is where people look for their own account, so it opens it. */}
      <Link className="topbar__admin" to="/profile">
        <span className="avatar" aria-hidden="true">
          {getNameInitials(user?.fullName)}
        </span>
        <span>{user?.fullName}</span>
      </Link>
    </header>
  );
}
