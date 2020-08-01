import React, { useRef, useContext, forwardRef } from 'react';
import PropTypes from 'prop-types';

import ReactionSheet from './ReactionSheet';
import { useTheme } from '../../theme';

const context = React.createContext({
	showReactionSheet: () => {},
	hideReactionSheet: () => {}
});

export const useReactionSheet = () => useContext(context);

const { Provider } = context;

export const ReactionSheetProvider = React.memo(({ children }) => {
	const ref = useRef();
	const { theme } = useTheme();

	const getContext = () => ({
		showReactionSheet: (data) => {
			ref.current?.showReactionSheet(data);
		},
		hideReactionSheet: () => {
			ref.current?.hideReactionSheet();
		}
	});

	return (
		<Provider value={getContext()}>
			<ReactionSheet ref={ref} theme={theme}>
				{children}
			</ReactionSheet>
		</Provider>
	);
});
ReactionSheetProvider.propTypes = {
	children: PropTypes.node
};
