import React from 'react';
import PropTypes from 'prop-types';
import {
	StyleSheet, View, Text, Platform, ActivityIndicator
} from 'react-native';

import { COLOR_BUTTON_PRIMARY, COLOR_TEXT } from '../../constants/colors';
import Touch from '../../utils/touch';
import { scale, moderateScale, verticalScale } from '../../utils/scaling';

const colors = {
	background_primary: COLOR_BUTTON_PRIMARY,
	background_secondary: 'white',

	text_color_primary: 'white',
	text_color_secondary: COLOR_TEXT
};

/* eslint-disable react-native/no-unused-styles */
const styles = StyleSheet.create({
	container: {
		paddingHorizontal: scale(15),
		justifyContent: 'center',
		height: scale(48)
	},
	text: {
		fontSize: moderateScale(18),
		height: verticalScale(20),
		lineHeight: verticalScale(20),
		textAlign: 'center',
		fontWeight: '500'
	},
	background_primary: {
		backgroundColor: colors.background_primary
	},
	background_secondary: {
		backgroundColor: colors.background_secondary
	},
	text_color_primary: {
		color: colors.text_color_primary
	},
	text_color_secondary: {
		color: colors.text_color_secondary
	},
	margin: {
		marginBottom: verticalScale(10)
	},
	disabled: {
		opacity: 0.5
	},
	border: {
		borderRadius: scale(2)
	}
});

export default class Button extends React.PureComponent {
	static propTypes = {
		title: PropTypes.string,
		type: PropTypes.string,
		onPress: PropTypes.func,
		disabled: PropTypes.bool,
		margin: PropTypes.any,
		backgroundColor: PropTypes.string,
		loading: PropTypes.bool
	}

	static defaultProps = {
		title: 'Press me!',
		type: 'primary',
		onPress: () => alert('It works!'),
		disabled: false,
		loading: false
	}

	render() {
		const {
			title, type, onPress, disabled, margin, backgroundColor, loading, ...otherProps
		} = this.props;
		return (
			<Touch
				onPress={onPress}
				accessibilityTraits='button'
				style={Platform.OS === 'ios' && [(margin || styles.margin), styles.border]}
				disabled={disabled || loading}
				{...otherProps}
			>
				<View
					style={[
						styles.container,
						styles.border,
						backgroundColor ? { backgroundColor } : styles[`background_${ type }`],
						Platform.OS === 'android' && (margin || styles.margin),
						disabled && styles.disabled
					]}
				>
					{
						loading
							? <ActivityIndicator color={colors[`text_color_${ type }`]} />
							: <Text style={[styles.text, styles[`text_color_${ type }`]]}>{title}</Text>
					}
				</View>
			</Touch>
		);
	}
}
