import { createContext, use, type ReactElement, type ReactNode } from 'react';

import { useIsAccessibilityNavigationEnabled } from '../../../lib/hooks/useIsAccessibilityNavigationEnabled';

// One boolean per room: is accessibility navigation (screen reader OR external keyboard) active?
// Message rows read it to skip the react-native-a11y-order wrappers when nobody needs them.
// Defaults false so message leaves rendered outside a provider (stories, isolated tests) render
// gated-off — identical to how they render for a touch user with no assistive tech.
export const A11yGateContext = createContext<boolean>(false);

export const useA11yGate = (): boolean => use(A11yGateContext);

export const A11yGateProvider = ({ children }: { children: ReactNode }): ReactElement => {
	'use memo';

	const enabled = useIsAccessibilityNavigationEnabled();

	return <A11yGateContext.Provider value={enabled}>{children}</A11yGateContext.Provider>;
};
