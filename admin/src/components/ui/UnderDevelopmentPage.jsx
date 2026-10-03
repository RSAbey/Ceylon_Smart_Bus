// Placeholder body for pages a member has not built yet; names the page and its owner.
import { Construction } from 'lucide-react';
import EmptyState from './EmptyState';

/**
 * "<pageTitle> is under development - Member 0X" card.
 * @param {object} props - Component props.
 * @param {string} props.pageTitle - Page name.
 * @param {string} props.ownerMember - Owner's member number, for example "04".
 * @returns {import('react').JSX.Element} Placeholder card.
 */
export default function UnderDevelopmentPage({ pageTitle, ownerMember }) {
  return (
    <div className="card">
      <EmptyState
        icon={Construction}
        title={`${pageTitle} is under development - Member ${ownerMember}`}
        message="This page is part of the Ceylon Smart Bus foundation and will be built by its owner."
      />
    </div>
  );
}
