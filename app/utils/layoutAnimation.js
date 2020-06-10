import React from 'react';
import { StyleSheet } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
import PropTypes from 'prop-types';

import debounce from './debounce';
import { isIOS } from './deviceInfo';

const layoutAnimationRef = React.createRef();

export const transition = (
	<Transition.Together>
		<Transition.In type='fade' />
		<Transition.Out type='fade' />
		<Transition.Change interpolation='easeInOut' />
	</Transition.Together>
);

const styles = StyleSheet.create({
	root: {
		flex: 1
	}
});

export const LayoutAnimation = ({ children }) => {
	if (isIOS) {
		return (
			<Transitioning.View
				style={styles.root}
				transition={transition}
				ref={layoutAnimationRef}
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

export const animateNextTransition = debounce(() => {
	if (isIOS) {
		layoutAnimationRef?.current?.animateNextTransition();
	}
}, 200, true);
