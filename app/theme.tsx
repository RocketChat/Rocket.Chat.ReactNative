import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { StackNavigationOptions } from '@react-navigation/stack';

interface IThemeContextProps {
	theme: string;
	themePreferences?: {
		currentTheme: 'automatic' | 'light';
		darkLevel: string;
	};
	setTheme?: (newTheme?: {}) => void;
}

type TOptions = {
	navigationOptions?: StackNavigationOptions;
};

export const ThemeContext = React.createContext<IThemeContextProps>({ theme: 'light' });

export function withTheme<T extends object>(Component: React.ComponentType<T> & TOptions): typeof Component {
	const ThemedComponent = (props: any) => (
		<ThemeContext.Consumer>{contexts => <Component {...props} {...contexts} />}</ThemeContext.Consumer>
	);
	ThemedComponent.navigationOptions = Component.navigationOptions;
	hoistNonReactStatics(ThemedComponent, Component);
	return ThemedComponent;
}

export const useTheme = () => React.useContext(ThemeContext);
