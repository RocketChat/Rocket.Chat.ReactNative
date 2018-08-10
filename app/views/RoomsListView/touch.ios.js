import React from 'react';
import { TouchableHighlight } from 'react-native';
import PropTypes from 'prop-types';

const Touch = ({ children, onPress, ...props }) => (
	<TouchableHighlight
		underlayColor='#FFFFFF'
		activeOpacity={0.5}
		onPress={onPress}
		{...props}
	>
		{children}
	</TouchableHighlight>
);

Touch.propTypes = {
	children: PropTypes.node.isRequired,
	onPress: PropTypes.func.isRequired
};

export default Touch;
