import React from 'react';
import { StyleSheet } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
import PropTypes from 'prop-types';

import debounce from './debounce';

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

export const LayoutAnimation = ({ children }) => (
	<Transitioning.View
		style={styles.root}
		transition={transition}
		ref={layoutAnimationRef}
	>
		{children}
	</Transitioning.View>
);
LayoutAnimation.propTypes = {
	children: PropTypes.node
};

export const animateNextTransition = debounce(() => {
	layoutAnimationRef?.current?.animateNextTransition();
}, 200, true);
