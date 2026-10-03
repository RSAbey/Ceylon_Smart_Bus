// Status pill with an icon AND text (never colour alone); same statuses as the mobile StatusBadge.
import { Ban, CircleCheck, CircleDot, CircleX, Clock, ShieldCheck, TriangleAlert } from 'lucide-react';
import { ICON_SIZES } from '../../theme/iconSizes';

const STATUS_APPEARANCES = Object.freeze({
  onTime: { label: 'On time', tone: 'success', icon: CircleCheck },
  delayed: { label: 'Delayed', tone: 'warning', icon: Clock },
  disrupted: { label: 'Disrupted', tone: 'error', icon: TriangleAlert },
  valid: { label: 'Valid', tone: 'success', icon: ShieldCheck },
  invalid: { label: 'Invalid', tone: 'error', icon: CircleX },
  active: { label: 'Active', tone: 'information', icon: CircleDot },
  cancelled: { label: 'Cancelled', tone: 'error', icon: Ban },
});

/**
 * Small status badge.
 * @param {object} props - Component props.
 * @param {'onTime'|'delayed'|'disrupted'|'valid'|'invalid'|'active'|'cancelled'} props.status - Status to show.
 * @param {string} [props.label] - Override text, for example "Delayed 15 min".
 * @returns {import('react').JSX.Element} The badge.
 */
export default function StatusBadge({ status, label }) {
  const statusAppearance = STATUS_APPEARANCES[status] || STATUS_APPEARANCES.active;
  const StatusIcon = statusAppearance.icon;
  return (
    <span className={`status-badge status-badge--${statusAppearance.tone}`}>
      <StatusIcon size={ICON_SIZES.badge} aria-hidden="true" />
      {label || statusAppearance.label}
    </span>
  );
}
