// Drivers page (Member 01) — placeholder until the owner builds it.
import PageHeader from '../../components/layout/PageHeader';
import UnderDevelopmentPage from '../../components/ui/UnderDevelopmentPage';

/**
 * Placeholder for the Drivers page.
 * @returns {import('react').JSX.Element} Page header + under-development card.
 */
export default function DriversPage() {
  return (
    <>
      <PageHeader title="Drivers" subtitle="Register drivers, edit their details and block or remove accounts" />
      <UnderDevelopmentPage pageTitle="Drivers" ownerMember="01" />
    </>
  );
}
