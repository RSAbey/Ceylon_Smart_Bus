// Page title block: heading, subtitle and optional action buttons on the right.

/**
 * Header at the top of every admin page.
 * @param {object} props - Component props.
 * @param {string} props.title - Page title.
 * @param {string} [props.subtitle] - One-line description.
 * @param {import('react').ReactNode} [props.actions] - Buttons such as "New announcement".
 * @returns {import('react').JSX.Element} Page header.
 */
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="text-heading1">{title}</h1>
        {subtitle && <p className="text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
}
