import React from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import PropTypes from 'prop-types';

import debounce from './debounce';
import { isIOS } from './deviceInfo';
import sharedStyles from '../views/Styles';

const transition = (
	<Transition.Together>
		<Transition.In type='fade' />
		<Transition.Out type='fade' />
		<Transition.Change interpolation='easeInOut' />
	</Transition.Together>
);

const TRANSITION_REF = React.createRef();

export const animateNextTransition = debounce(() => {
	if (isIOS) {
		TRANSITION_REF.current.animateNextTransition();
	}
}, 200, true);

const LayoutAnimation = ({ children }) => {
	if (isIOS) {
		return (
			<Transitioning.View
				style={sharedStyles.root}
				transition={transition}
				ref={TRANSITION_REF}
			>
				{children}
			</Transitioning.View>
		);
	}
	return children;
};

LayoutAnimation.propTypes = {
	children: PropTypes.node
};

export default LayoutAnimation;
