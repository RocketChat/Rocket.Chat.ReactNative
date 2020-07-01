import React, { useRef, useContext, forwardRef } from 'react';
import PropTypes from 'prop-types';

import ActionSheet from './ActionSheet';
import { useTheme } from '../../theme';

const context = React.createContext({
	showActionSheet: () => {},
	hideActionSheet: () => {}
});

export const useActionSheet = () => useContext(context);

const { Provider, Consumer } = context;

export const withActionSheet = Component => forwardRef((props, ref) => (
	<Consumer>
		{contexts => <Component {...props} {...contexts} ref={ref} />}
	</Consumer>
));

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
