import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';

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
		textAlign: 'center',
		...sharedStyles.textMedium
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
			<Touchable
				onPress={onPress}
				disabled={disabled || loading}
				style={[
					styles.container,
					backgroundColor
						? { backgroundColor }
						: { backgroundColor: isPrimary ? themes[theme].actionTintColor : themes[theme].auxiliaryBackground },
					disabled && { backgroundColor: themes[theme].borderColor },
					style
				]}
				background={Touchable.Ripple(themes[theme].bannerBackground)}
				{...otherProps}
			>
				{
					loading
						? <ActivityIndicator color={isPrimary ? themes[theme].buttonText : themes[theme].bodyText} />
						: (
							<Text
								style={[
									styles.text,
									{ color: isPrimary ? themes[theme].buttonText : themes[theme].bodyText }
								]}
							>
								{title}
							</Text>
						)
				}
			</Touchable>
		);
	}
}
