import React, { useRef, useContext } from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import PropTypes from 'prop-types';

import ActionSheet from './ActionSheet';
import { useTheme } from '../../theme';

const context = React.createContext({
	showActionSheet: () => {},
	hideActionSheet: () => {}
});

export const useActionSheet = () => useContext(context);

const { Provider, Consumer } = context;

export const withActionSheet = (Component) => {
	const ConnectedActionSheet = props => (
		<Consumer>
			{contexts => <Component {...props} {...contexts} />}
		</Consumer>
	);
	hoistNonReactStatics(ConnectedActionSheet, Component);
	return ConnectedActionSheet;
};

export const ActionSheetProvider = React.memo(({ children }) => {
	const ref = useRef();
	const { theme } = useTheme();

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
	children: PropTypes.node
};
