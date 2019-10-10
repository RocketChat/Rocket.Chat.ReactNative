import React from 'react';

export const ThemeContext = React.createContext(null);

export function withTheme(Component) {
	return function ThemeComponent(props) {
		return (
			<ThemeContext.Consumer>
				{contexts => <Component {...props} {...contexts} />}
			</ThemeContext.Consumer>
		);
	};
}
