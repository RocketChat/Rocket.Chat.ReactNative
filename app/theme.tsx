import React, { useMemo } from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';

import { TNavigationOptions } from './definitions/navigationTypes';
import { IThemePreference } from './definitions/ITheme';
import { colors as baseColors } from './constants/colors';

type TSupportedThemes = keyof typeof baseColors;
export type TColors = typeof baseColors[TSupportedThemes];

interface IThemeContextProps {
	theme: string;
	themePreferences?: IThemePreference;
	setTheme?: (newTheme?: {}) => void;
}

const handleColor = (context: IThemeContextProps) => {
	const colors = useMemo(() => {
		const theme = context.theme as TSupportedThemes;
		return baseColors[theme];
	}, [context.theme]);
	return colors;
};

export const ThemeContext = React.createContext<IThemeContextProps>({ theme: 'light' });

export function withTheme<T extends object>(Component: React.ComponentType<T> & TNavigationOptions): typeof Component {
	const ThemedComponent = (props: T) => (
		<ThemeContext.Consumer>{contexts => <Component {...props} {...contexts} />}</ThemeContext.Consumer>
	);

	hoistNonReactStatics(ThemedComponent, Component);
	return ThemedComponent;
}

export const useTheme = (): IThemeContextProps & { colors: TColors } => {
	const context = React.useContext(ThemeContext);
	const colors = handleColor(context);
	return { ...context, colors };
};
