import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';

import { isTablet } from './utils/deviceInfo';

export const SplitContext = React.createContext(null);

export function withSplit(Component) {
	if (isTablet) {
		const SplitComponent = props => (
			<SplitContext.Consumer>
				{contexts => <Component {...props} {...contexts} />}
			</SplitContext.Consumer>
		);
		hoistNonReactStatics(SplitComponent, Component);
		return SplitComponent;
	}
	return Component;
}
