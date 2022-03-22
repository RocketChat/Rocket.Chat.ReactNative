import hoistNonReactStatics from 'hoist-non-react-statics';
import React, { useMemo } from 'react';

import { colors as baseColors } from './constants/colors';
import { IThemePreference } from './definitions/ITheme';
import { TNavigationOptions } from './definitions/navigationTypes';

type TSupportedThemes = keyof typeof baseColors;
export type TColors = typeof baseColors[TSupportedThemes];

interface IThemeContextProps {
	theme: string;
	themePreferences?: IThemePreference;
	setTheme?: (newTheme?: {}) => void;
}

const handleColor = (contextTheme: string) => {
	const colors = useMemo(() => {
		const theme = contextTheme as TSupportedThemes;
		return baseColors[theme];
	}, [contextTheme]);
	return colors;
};

export const ThemeContext = React.createContext<IThemeContextProps>({ theme: 'light' });

// Add future HOC props here
const PropWrapper = ({ theme, ...props }: { theme: string; children: React.ReactElement }) => {
	const colors = handleColor(theme);
	return React.cloneElement(props.children, { colors });
};

export function withTheme<T extends object>(Component: React.ComponentType<T> & TNavigationOptions): typeof Component {
	const ThemedComponent = (props: T) => (
		<ThemeContext.Consumer>
			{contexts => (
				<PropWrapper theme={contexts.theme}>
					<Component {...props} {...contexts} />
				</PropWrapper>
			)}
		</ThemeContext.Consumer>
	);

	hoistNonReactStatics(ThemedComponent, Component);
	return ThemedComponent;
}

export const useTheme = (): IThemeContextProps & { colors: TColors } => {
	const context = React.useContext(ThemeContext);
	const colors = handleColor(context.theme);
	return { ...context, colors };
};
