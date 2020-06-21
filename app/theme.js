import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';

export const ThemeContext = React.createContext({ theme: 'light' });

export function withTheme(Component) {
	const ThemedComponent = props => (
		<ThemeContext.Consumer>
			{contexts => <Component {...props} {...contexts} />}
		</ThemeContext.Consumer>
	);
	hoistNonReactStatics(ThemedComponent, Component);
	return ThemedComponent;
}

export const useTheme = () => React.useContext(ThemeContext);
