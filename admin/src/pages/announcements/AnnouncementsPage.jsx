// Announcements page (Member 04) — placeholder until the owner builds it.
import PageHeader from '../../components/layout/PageHeader';
import UnderDevelopmentPage from '../../components/ui/UnderDevelopmentPage';

/**
 * Placeholder for the Announcements page.
 * @returns {import('react').JSX.Element} Page header + under-development card.
 */
export default function AnnouncementsPage() {
  return (
    <>
      <PageHeader title="Announcements" subtitle="Create, publish and archive passenger announcements" />
      <UnderDevelopmentPage pageTitle="Announcements" ownerMember="04" />
    </>
  );
}
