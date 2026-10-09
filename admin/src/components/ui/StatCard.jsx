// KPI card for the Statistics-First dashboard: icon, label, big figure and an optional helper line.
import { ICON_SIZES } from '../../theme/iconSizes';

/**
 * One statistic, for example "Active trips · 12".
 * @param {object} props - Component props.
 * @param {string} props.label - What is measured.
 * @param {string|number} props.statValue - The figure shown large.
 * @param {import('react').ComponentType} [props.icon] - lucide icon component.
 * @param {string} [props.helperText] - Context such as "3 more than yesterday".
 * @param {'primary'|'warning'|'success'|'error'} [props.accent] - Colours a bar down the left edge,
 *   used on the dashboard where the figure's tone is part of the message.
 * @returns {import('react').JSX.Element} The card.
 */
export default function StatCard({ label, statValue, icon: IconComponent, helperText, accent }) {
  return (
    <article
      className={accent ? `card stat-card stat-card--${accent}` : 'card stat-card'}
      aria-label={`${label}: ${statValue}`}
    >
      {IconComponent && (
        <span className="stat-card__icon" aria-hidden="true">
          <IconComponent size={ICON_SIZES.large} />
        </span>
      )}
      <div>
        <p className="text-label text-muted">{label}</p>
        <p className="stat-card__figure">{statValue}</p>
        {helperText && <p className="text-caption text-muted">{helperText}</p>}
      </div>
    </article>
  );
}
