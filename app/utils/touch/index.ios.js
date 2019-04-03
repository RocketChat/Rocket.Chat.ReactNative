import React from 'react';
import { TouchableHighlight } from 'react-native';
import PropTypes from 'prop-types';
import { COLOR_WHITE } from '../../constants/colors';

const Touch = ({ children, onPress, ...props }) => (
	<TouchableHighlight
		underlayColor={COLOR_WHITE}
		activeOpacity={0.5}
		onPress={onPress}
		{...props}
	>
		{children}
	</TouchableHighlight>
);

Touch.propTypes = {
	children: PropTypes.node.isRequired,
	onPress: PropTypes.func
};

export default Touch;
