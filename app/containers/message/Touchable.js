import React, { useContext } from 'react';
import Touchable from 'react-native-platform-touchable';
import PropTypes from 'prop-types';

import MessageContext from './Context';

const RCTouchable = React.memo(({ children, ...props }) => {
	const { onLongPress } = useContext(MessageContext);

	return (
		<Touchable
			onLongPress={onLongPress}
			{...props}
		>
			{children}
		</Touchable>
	);
});
RCTouchable.propTypes = {
	children: PropTypes.node
};
RCTouchable.Ripple = (...args) => Touchable.Ripple(...args);
RCTouchable.SelectableBackgroundBorderless = () => Touchable.SelectableBackgroundBorderless();

export default RCTouchable;
