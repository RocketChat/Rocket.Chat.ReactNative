import hoistNonReactStatics from 'hoist-non-react-statics';
import { type ComponentType } from 'react';

import { type IThemePreference } from './definitions/ITheme';
import { type TNavigationOptions } from './definitions/navigationTypes';
import { colors } from './lib/constants/colors';
import { getTheme } from './lib/methods/helpers/theme';
import { useThemePreferencesStore } from './lib/theme/themePreferencesStore';

export type TSupportedThemes = keyof typeof colors;
export type TColors = (typeof colors)[TSupportedThemes];

export interface IThemeContextProps {
	theme: TSupportedThemes;
	themePreferences?: IThemePreference;
	setTheme?: (newTheme?: {}) => void;
	colors: TColors;
}

export const useTheme = (): IThemeContextProps => {
	const themePreferences = useThemePreferencesStore(state => state.themePreferences);
	const setTheme = useThemePreferencesStore(state => state.setTheme);
	const theme = getTheme(themePreferences);
	return { theme, colors: colors[theme], themePreferences, setTheme };
};

export function withTheme<T extends object>(Component: ComponentType<T> & TNavigationOptions): typeof Component {
	const ThemedComponent = (props: T) => {
		const themeProps = useTheme();
		return <Component {...props} {...themeProps} />;
	};

	hoistNonReactStatics(ThemedComponent, Component as any);
	return ThemedComponent as unknown as typeof Component;
}
