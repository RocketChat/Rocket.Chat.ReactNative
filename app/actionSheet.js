import React, { useRef, useContext } from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import PropTypes from 'prop-types';

import ActionSheet from './containers/ActionSheet';

const context = React.createContext({
	showActionSheetWithOptions: () => { }
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

const ActionSheetProvider = React.memo(({ children }) => {
	const ref = useRef();

	const getContext = () => ({
		showActionSheetWithOptions: (options, callback) => {
			ref.current?.showActionSheetWithOptions(options, callback);
		}
	});

	return (
		<Provider value={getContext()}>
			<ActionSheet ref={ref} theme='light'>
				{children}
			</ActionSheet>
		</Provider>
	);
});
ActionSheetProvider.propTypes = {
	children: PropTypes.node
};
export default ActionSheetProvider;
