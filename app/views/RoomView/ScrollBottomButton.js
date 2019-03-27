import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { isNotch } from '../../utils/deviceInfo';
import { CustomIcon } from '../../lib/Icons';
import { COLOR_BUTTON_PRIMARY } from '../../constants/colors';

const styles = StyleSheet.create({
	button: {
		position: 'absolute',
		width: 42,
		height: 42,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#EAF2FE',
		borderRadius: 21,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1
		},
		shadowOpacity: 0.20,
		shadowRadius: 1.41,
		elevation: 2
	}
});

let right;
let bottom = 80;
if (isNotch) {
	bottom = 120;
}

const ScrollBottomButton = React.memo(({ show, onPress, landscape }) => {
	if (show) {
		if (landscape) {
			right = 45;
		} else {
			right = 30;
		}
		return (
			<TouchableOpacity
				activeOpacity={0.8}
				style={[styles.button, { right, bottom }]}
				onPress={onPress}
			>
				<CustomIcon name='arrow-down' color={COLOR_BUTTON_PRIMARY} size={30} />
			</TouchableOpacity>
		);
	}
	return null;
});

ScrollBottomButton.propTypes = {
	show: PropTypes.bool.isRequired,
	onPress: PropTypes.func.isRequired,
	landscape: PropTypes.bool
};
export default ScrollBottomButton;
