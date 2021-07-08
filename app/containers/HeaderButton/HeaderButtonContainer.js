import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	left: {
		marginLeft: 5
	},
	right: {
		marginRight: 5
	}
});

const Container = ({ children, left }) => (
	<View style={[styles.container, left ? styles.left : styles.right]}>
		{children}
	</View>
);

Container.propTypes = {
	children: PropTypes.oneOfType([
		PropTypes.arrayOf(PropTypes.element),
		PropTypes.object
	]),
	left: PropTypes.bool
};

Container.defaultProps = {
	left: false
};

Container.displayName = 'HeaderButton.Container';

export default Container;
