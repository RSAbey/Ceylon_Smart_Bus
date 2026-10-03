// Performance page (Member 04) — placeholder until the owner builds it.
import PageHeader from '../../components/layout/PageHeader';
import UnderDevelopmentPage from '../../components/ui/UnderDevelopmentPage';

/**
 * Placeholder for the Performance page.
 * @returns {import('react').JSX.Element} Page header + under-development card.
 */
export default function PerformancePage() {
  return (
    <>
      <PageHeader title="Performance" subtitle="Punctuality and service performance charts" />
      <UnderDevelopmentPage pageTitle="Performance" ownerMember="04" />
    </>
  );
}
