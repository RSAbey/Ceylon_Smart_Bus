// Overview page (Member 04) — placeholder until the owner builds it.
import PageHeader from '../../components/layout/PageHeader';
import UnderDevelopmentPage from '../../components/ui/UnderDevelopmentPage';

/**
 * Placeholder for the Overview page.
 * @returns {import('react').JSX.Element} Page header + under-development card.
 */
export default function OverviewPage() {
  return (
    <>
      <PageHeader title="Overview" subtitle="Key statistics for today at a glance" />
      <UnderDevelopmentPage pageTitle="Overview" ownerMember="04" />
    </>
  );
}
