import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';

import { TNavigationOptions } from './definitions/navigationTypes';
import { IThemePreference } from './definitions/ITheme';
import { TColors } from './lib/hooks/useColors';

interface IThemeContextProps {
	theme: keyof TColors | string;
	themePreferences?: IThemePreference;
	setTheme?: (newTheme?: {}) => void;
}

export const ThemeContext = React.createContext<IThemeContextProps>({ theme: 'light' });

export function withTheme<T extends object>(Component: React.ComponentType<T> & TNavigationOptions): typeof Component {
	const ThemedComponent = (props: T) => (
		<ThemeContext.Consumer>{contexts => <Component {...props} {...contexts} />}</ThemeContext.Consumer>
	);

	hoistNonReactStatics(ThemedComponent, Component);
	return ThemedComponent;
}

export const useTheme = (): IThemeContextProps => React.useContext(ThemeContext);
