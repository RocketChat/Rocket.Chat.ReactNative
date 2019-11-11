import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';

export const SplitContext = React.createContext(null);

export function withSplit(Component) {
	const SplitComponent = props => (
		<SplitContext.Consumer>
			{contexts => <Component {...props} {...contexts} />}
		</SplitContext.Consumer>
	);
	hoistNonReactStatics(SplitComponent, Component);
	return SplitComponent;
}
