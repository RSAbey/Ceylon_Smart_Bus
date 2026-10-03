// Buses page (Member 02) — placeholder until the owner builds it.
import PageHeader from '../../components/layout/PageHeader';
import UnderDevelopmentPage from '../../components/ui/UnderDevelopmentPage';

/**
 * Placeholder for the Buses page.
 * @returns {import('react').JSX.Element} Page header + under-development card.
 */
export default function BusesPage() {
  return (
    <>
      <PageHeader title="Buses" subtitle="Register buses and assign drivers and routes" />
      <UnderDevelopmentPage pageTitle="Buses" ownerMember="02" />
    </>
  );
}
