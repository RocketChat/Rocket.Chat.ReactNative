import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';

import { IThemePreference } from './definitions/ITheme';

interface IThemeContextProps {
	theme: string;
	themePreferences?: IThemePreference;
	setTheme?: (newTheme?: {}) => void;
}

export const ThemeContext = React.createContext<IThemeContextProps>({ theme: 'light' });

export function withTheme(Component: any): any {
	const ThemedComponent = (props: any) => (
		<ThemeContext.Consumer>{contexts => <Component {...props} {...contexts} />}</ThemeContext.Consumer>
	);
	hoistNonReactStatics(ThemedComponent, Component);
	return ThemedComponent;
}

export const useTheme = () => React.useContext(ThemeContext);
