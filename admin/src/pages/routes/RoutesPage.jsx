// Routes page (Member 02) — placeholder until the owner builds it.
import PageHeader from '../../components/layout/PageHeader';
import UnderDevelopmentPage from '../../components/ui/UnderDevelopmentPage';

/**
 * Placeholder for the Routes page.
 * @returns {import('react').JSX.Element} Page header + under-development card.
 */
export default function RoutesPage() {
  return (
    <>
      <PageHeader title="Routes" subtitle="Create and edit routes, their ordered stops and fares" />
      <UnderDevelopmentPage pageTitle="Routes" ownerMember="02" />
    </>
  );
}
