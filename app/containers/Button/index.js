import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import { themes } from '../../constants/colors';
import sharedStyles from '../../views/Styles';
import ActivityIndicator from '../ActivityIndicator';

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
	text_primary: {
		...sharedStyles.textMedium
	},
	text_secondary: {
		...sharedStyles.textBold
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
		theme: PropTypes.string,
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
			title, type, onPress, disabled, backgroundColor, loading, style, theme, ...otherProps
		} = this.props;
		const isPrimary = type === 'primary';
		return (
			<RectButton
				onPress={onPress}
				enabled={!(disabled || loading)}
				style={[
					styles.container,
					backgroundColor
						? { backgroundColor }
						: { backgroundColor: isPrimary ? themes[theme].actionTintColor : 'transparent' },
					disabled && { backgroundColor: themes[theme].borderColor },
					style
				]}
				{...otherProps}
			>
				{
					loading
						? <ActivityIndicator color={isPrimary ? themes[theme].buttonText : themes[theme].actionTintColor} />
						: (
							<Text
								style={[
									styles.text,
									styles[`text_${ type }`],
									{ color: isPrimary ? themes[theme].buttonText : themes[theme].actionTintColor }
								]}
							>
								{title}
							</Text>
						)
				}
			</RectButton>
		);
	}
}
