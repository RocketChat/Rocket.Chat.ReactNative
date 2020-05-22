import React, { useRef, useContext } from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import PropTypes from 'prop-types';

import ActionSheet from './containers/ActionSheet';
import { withTheme } from './theme';

const context = React.createContext({
	show: () => {},
	hide: () => {}
});

export function useActionSheet() {
	return useContext(context);
}

const { Provider, Consumer } = context;

export function connectActionSheet(Component) {
	const ConnectedActionSheet = props => (
		<Consumer>
			{contexts => <Component {...props} {...contexts} />}
		</Consumer>
	);
	hoistNonReactStatics(ConnectedActionSheet, Component);
	return ConnectedActionSheet;
}

const ActionSheetProvider = ({ children, theme }) => {
	const ref = useRef();

	const getContext = () => ({
		show: (options) => {
			ref.current?.show(options);
		},
		hide: () => {
			ref.current?.hide();
		}
	});

	return (
		<Provider value={getContext()}>
			<ActionSheet ref={ref} theme={theme}>
				{children}
			</ActionSheet>
		</Provider>
	);
};
ActionSheetProvider.propTypes = {
	children: PropTypes.node,
	theme: PropTypes.string
};
export default withTheme(ActionSheetProvider);
