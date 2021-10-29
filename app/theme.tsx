import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';

interface IThemeContextProps {
	theme: string;
	themePreferences?: {
		currentTheme: 'automatic' | 'light';
		darkLevel: string;
	};
	setTheme?: (newTheme?: {}) => void;
}

export const ThemeContext = React.createContext<IThemeContextProps>({ theme: 'light' });

export function withTheme<P extends object>(Component: React.ComponentType<P>): (props: any) => JSX.Element {
	const ThemedComponent = (props: any) => (
		<ThemeContext.Consumer>{contexts => <Component {...props} {...contexts} />}</ThemeContext.Consumer>
	);
	hoistNonReactStatics(ThemedComponent, Component);
	return ThemedComponent;
}

export const useTheme = (): Partial<IThemeContextProps> => React.useContext(ThemeContext);
