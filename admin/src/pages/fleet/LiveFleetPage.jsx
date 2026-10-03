// Live Fleet page (Member 02) — placeholder until the owner builds it.
import PageHeader from '../../components/layout/PageHeader';
import UnderDevelopmentPage from '../../components/ui/UnderDevelopmentPage';

/**
 * Placeholder for the Live Fleet page.
 * @returns {import('react').JSX.Element} Page header + under-development card.
 */
export default function LiveFleetPage() {
  return (
    <>
      <PageHeader title="Live Fleet" subtitle="See every bus on an ongoing trip on the map" />
      <UnderDevelopmentPage pageTitle="Live Fleet" ownerMember="02" />
    </>
  );
}
