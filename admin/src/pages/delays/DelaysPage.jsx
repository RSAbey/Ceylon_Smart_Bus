// Delay Reports page (Member 04) — placeholder until the owner builds it.
import PageHeader from '../../components/layout/PageHeader';
import UnderDevelopmentPage from '../../components/ui/UnderDevelopmentPage';

/**
 * Placeholder for the Delay Reports page.
 * @returns {import('react').JSX.Element} Page header + under-development card.
 */
export default function DelaysPage() {
  return (
    <>
      <PageHeader title="Delay Reports" subtitle="Review, acknowledge and resolve driver-reported delays" />
      <UnderDevelopmentPage pageTitle="Delay Reports" ownerMember="04" />
    </>
  );
}
