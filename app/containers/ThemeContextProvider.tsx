import { useMemo, type ReactNode } from 'react';

import { type IThemePreference } from '../definitions/ITheme';
import { colors } from '../lib/constants/colors';
import { type IThemeContextProps, type TSupportedThemes, ThemeContext } from '../theme';

// Memoized provider so dimension-driven App re-renders don't propagate to theme consumers.
const ThemeContextProvider = ({
	theme,
	themePreferences,
	setTheme,
	children
}: {
	theme: TSupportedThemes;
	themePreferences: IThemePreference;
	setTheme: IThemeContextProps['setTheme'];
	children: ReactNode;
}) => {
	const value = useMemo<IThemeContextProps>(
		() => ({ theme, themePreferences, setTheme, colors: colors[theme] }),
		[theme, themePreferences, setTheme]
	);
	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContextProvider;
