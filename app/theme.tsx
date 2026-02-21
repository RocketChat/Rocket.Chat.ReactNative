import hoistNonReactStatics from 'hoist-non-react-statics';
import { type ComponentType, createContext, useContext } from 'react';

import type { IThemePreference } from './definitions/ITheme';
import type { TNavigationOptions } from './definitions/navigationTypes';
import { colors } from './lib/constants/colors';

export type TSupportedThemes = keyof typeof colors;
export type TColors = (typeof colors)[TSupportedThemes];

export interface IThemeContextProps {
	theme: TSupportedThemes;
	themePreferences?: IThemePreference;
	setTheme?: (newTheme?: {}) => void;
	colors: TColors;
}

export const ThemeContext = createContext<IThemeContextProps>({ theme: 'light', colors: colors.light });

export function withTheme<T extends object>(Component: ComponentType<T> & TNavigationOptions): typeof Component {
	const ThemedComponent = (props: T) => (
		<ThemeContext.Consumer>{contexts => <Component {...props} {...contexts} />}</ThemeContext.Consumer>
	);

	hoistNonReactStatics(ThemedComponent, Component as any);
	return ThemedComponent;
}

export const useTheme = (): IThemeContextProps => useContext(ThemeContext);
