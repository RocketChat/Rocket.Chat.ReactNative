import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, Text, Platform } from 'react-native';

import { COLOR_BUTTON_PRIMARY, COLOR_TEXT } from '../../constants/colors';
import Touch from '../../utils/touch';

const colors = {
	backgroundPrimary: COLOR_BUTTON_PRIMARY,
	backgroundSecondary: 'white',

	textColorPrimary: 'white',
	textColorSecondary: COLOR_TEXT
};

/* eslint-disable react-native/no-unused-styles */
const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 15,
		paddingVertical: 10
	},
	text: {
		textAlign: 'center',
		fontWeight: '700'
	},
	background_primary: {
		backgroundColor: colors.backgroundPrimary
	},
	background_secondary: {
		backgroundColor: colors.backgroundSecondary
	},
	text_color_primary: {
		color: colors.textColorPrimary
	},
	text_color_secondary: {
		color: colors.textColorSecondary
	},
	margin: {
		marginBottom: 10
	},
	disabled: {
		opacity: 0.5
	},
	border: {
		borderRadius: 2
	}
});

export default class Button extends React.PureComponent {
	static propTypes = {
		title: PropTypes.string,
		type: PropTypes.string,
		onPress: PropTypes.func,
		disabled: PropTypes.bool,
		margin: PropTypes.any,
		backgroundColor: PropTypes.string
	}

	static defaultProps = {
		title: 'Press me!',
		type: 'primary',
		onPress: () => alert('It works!'),
		disabled: false
	}

	render() {
		const {
			title, type, onPress, disabled, margin, backgroundColor, ...otherProps
		} = this.props;
		return (
			<Touch
				onPress={onPress}
				accessibilityTraits='button'
				style={Platform.OS === 'ios' && [(margin || styles.margin), styles.border]}
				disabled={disabled}
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
					<Text style={[styles.text, styles[`text_color_${ type }`]]}>{title}</Text>
				</View>
			</Touch>
		);
	}
}
