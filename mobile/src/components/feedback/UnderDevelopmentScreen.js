// Placeholder used by every stub screen so the app navigates end-to-end before members build their screens.
import { useRouter } from 'expo-router';
import ScreenContainer from '../ui/ScreenContainer';
import AppHeader from '../navigation/AppHeader';
import { useDrawer } from '../navigation/DrawerContext';
import EmptyState from './EmptyState';

/**
 * Header + empty state naming the screen and the member who owns it.
 * @param {object} props - Component props.
 * @param {string} props.screenTitle - Screen name shown in the header, for example "My Tickets".
 * @param {string} props.ownerMember - Owner's member number, for example "03".
 * @returns {import('react').JSX.Element} Placeholder screen.
 */
export default function UnderDevelopmentScreen({ screenTitle, ownerMember }) {
  const router = useRouter();
  const drawer = useDrawer();
  const canGoBack = router.canGoBack();

  return (
    <ScreenContainer
      header={
        <AppHeader
          variant="back"
          title={screenTitle}
          onBackPress={canGoBack ? router.back : undefined}
          onMenuPress={drawer ? drawer.openDrawer : undefined}
        />
      }
    >
      <EmptyState
        iconName="construct-outline"
        title={`${screenTitle} is under development - Member ${ownerMember}`}
        message="This screen is part of the Ceylon Smart Bus foundation and will be built by its owner."
      />
    </ScreenContainer>
  );
}
