// Open/close state of the passenger drawer menu, shared so any screen's header can open it.
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const DrawerContext = createContext(null);

/**
 * Provides { isDrawerOpen, openDrawer, closeDrawer } to the passenger screens.
 * @param {object} props - Component props.
 * @param {import('react').ReactNode} props.children - Screens inside the passenger area.
 * @returns {import('react').JSX.Element} Context provider.
 */
export function DrawerProvider({ children }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const drawerState = useMemo(
    () => ({ isDrawerOpen, openDrawer, closeDrawer }),
    [isDrawerOpen, openDrawer, closeDrawer]
  );

  return <DrawerContext.Provider value={drawerState}>{children}</DrawerContext.Provider>;
}

/**
 * Reads the drawer state. Returns null outside the passenger area (drivers have no drawer),
 * so shared components can simply hide the menu button.
 * @returns {{isDrawerOpen: boolean, openDrawer: Function, closeDrawer: Function} | null} Drawer state.
 */
export function useDrawer() {
  return useContext(DrawerContext);
}
