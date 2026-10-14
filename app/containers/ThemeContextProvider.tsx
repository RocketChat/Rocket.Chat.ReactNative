import { useMemo, type ReactNode } from 'react';

import { type IThemePreference } from '../definitions/ITheme';
import { colors } from '../lib/constants/colors';
import { type IThemeContextProps, type TSupportedThemes, ThemeContext } from '../theme';

// Memoized value so unrelated App re-renders don't change context identity and re-render theme consumers.
const ThemeContextProvider = ({
	theme,
	themePreferences,
	children
}: {
	theme: TSupportedThemes;
	themePreferences: IThemePreference;
	children: ReactNode;
}) => {
	const value = useMemo<IThemeContextProps>(
		() => ({ theme, themePreferences, colors: colors[theme] }),
		[theme, themePreferences]
	);
	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContextProvider;
