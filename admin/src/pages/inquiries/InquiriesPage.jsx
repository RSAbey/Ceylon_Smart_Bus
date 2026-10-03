// Inquiries page (Member 03) — placeholder until the owner builds it.
import PageHeader from '../../components/layout/PageHeader';
import UnderDevelopmentPage from '../../components/ui/UnderDevelopmentPage';

/**
 * Placeholder for the Inquiries page.
 * @returns {import('react').JSX.Element} Page header + under-development card.
 */
export default function InquiriesPage() {
  return (
    <>
      <PageHeader title="Inquiries" subtitle="Reply to and close passenger and driver inquiries" />
      <UnderDevelopmentPage pageTitle="Inquiries" ownerMember="03" />
    </>
  );
}
