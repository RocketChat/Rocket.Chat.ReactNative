import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, ActivityIndicator } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import { COLOR_BUTTON_PRIMARY } from '../../constants/colors';
import sharedStyles from '../../views/Styles';

const colors = {
	background_primary: COLOR_BUTTON_PRIMARY,
	background_secondary: 'white',

	text_color_primary: 'white',
	text_color_secondary: COLOR_BUTTON_PRIMARY
};

/* eslint-disable react-native/no-unused-styles */
const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 15,
		justifyContent: 'center',
		height: 48,
		borderRadius: 2,
		marginBottom: 10
	},
	text: {
		fontSize: 18,
		textAlign: 'center'
	},
	background_primary: {
		backgroundColor: colors.background_primary
	},
	background_secondary: {
		backgroundColor: colors.background_secondary
	},
	text_primary: {
		...sharedStyles.textMedium,
		color: colors.text_color_primary
	},
	text_secondary: {
		...sharedStyles.textBold,
		color: colors.text_color_secondary
	},
	disabled: {
		backgroundColor: '#e1e5e8'
	}
});

export default class Button extends React.PureComponent {
	static propTypes = {
		title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
		type: PropTypes.string,
		onPress: PropTypes.func,
		disabled: PropTypes.bool,
		backgroundColor: PropTypes.string,
		loading: PropTypes.bool,
		style: PropTypes.any
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
			title, type, onPress, disabled, backgroundColor, loading, style, ...otherProps
		} = this.props;
		return (
			<RectButton
				onPress={onPress}
				enabled={!(disabled || loading)}
				style={[
					styles.container,
					backgroundColor ? { backgroundColor } : styles[`background_${ type }`],
					disabled && styles.disabled,
					style
				]}
				{...otherProps}
			>
				{
					loading
						? <ActivityIndicator color={colors[`text_color_${ type }`]} />
						: <Text style={[styles.text, styles[`text_${ type }`]]}>{title}</Text>
				}
			</RectButton>
		);
	}
}
