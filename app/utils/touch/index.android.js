import React from 'react';
import { TouchableNativeFeedback, View } from 'react-native';
import PropTypes from 'prop-types';

const Touch = ({
	children, style, onPress, ...props
}) => (
	<TouchableNativeFeedback
		onPress={onPress}
		{...props}
	>
		<View style={style}>
			{children}
		</View>
	</TouchableNativeFeedback>
);

Touch.propTypes = {
	children: PropTypes.node.isRequired,
	style: PropTypes.any,
	onPress: PropTypes.func.isRequired
};

export default Touch;
