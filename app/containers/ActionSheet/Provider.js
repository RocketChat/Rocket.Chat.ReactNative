import React, { useRef, useContext } from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import PropTypes from 'prop-types';

import ActionSheet from './index';
import { withTheme } from '../../theme';

const context = React.createContext({
	showActionSheet: () => {},
	hideActionSheet: () => {}
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

const ActionSheetProvider = React.memo(({ children, theme }) => {
	const ref = useRef();

	const getContext = () => ({
		showActionSheet: (options) => {
			ref.current?.showActionSheet(options);
		},
		hideActionSheet: () => {
			ref.current?.hideActionSheet();
		}
	});

	return (
		<Provider value={getContext()}>
			<ActionSheet ref={ref} theme={theme}>
				{children}
			</ActionSheet>
		</Provider>
	);
});
ActionSheetProvider.propTypes = {
	children: PropTypes.node,
	theme: PropTypes.string
};
export default withTheme(ActionSheetProvider);
