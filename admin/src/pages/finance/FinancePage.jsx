// Tickets & Finance page (Member 03) — placeholder until the owner builds it.
import PageHeader from '../../components/layout/PageHeader';
import UnderDevelopmentPage from '../../components/ui/UnderDevelopmentPage';

/**
 * Placeholder for the Tickets & Finance page.
 * @returns {import('react').JSX.Element} Page header + under-development card.
 */
export default function FinancePage() {
  return (
    <>
      <PageHeader title="Tickets & Finance" subtitle="Monitor ticket sales, payments and refunds" />
      <UnderDevelopmentPage pageTitle="Tickets & Finance" ownerMember="03" />
    </>
  );
}
