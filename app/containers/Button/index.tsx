import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import Touchable, { PlatformTouchableProps } from 'react-native-platform-touchable';

import { useTheme } from '../../theme';
import { themes } from '../../lib/constants';
import sharedStyles from '../../views/Styles';
import ActivityIndicator from '../ActivityIndicator';

interface IButtonProps extends PlatformTouchableProps {
	title: string;
	onPress: () => void;
	type?: string;
	backgroundColor?: string;
	loading?: boolean;
	color?: string;
	fontSize?: number;
	styleText?: StyleProp<TextStyle>[];
}

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 14,
		justifyContent: 'center',
		height: 48,
		borderRadius: 2,
		marginBottom: 12
	},
	text: {
		...sharedStyles.textMedium,
		...sharedStyles.textAlignCenter
	},
	disabled: {
		opacity: 0.3
	}
});

const Button = ({
	type = 'primary',
	disabled = false,
	loading = false,
	fontSize = 16,
	title,
	onPress,
	backgroundColor,
	color,
	style,
	styleText,
	...otherProps
}: IButtonProps): React.ReactElement => {
	const { theme } = useTheme();
	const isPrimary = type === 'primary';

	let textColor = isPrimary ? themes[theme!].buttonText : themes[theme!].bodyText;
	if (color) {
		textColor = color;
	}

	return (
		<Touchable
			onPress={onPress}
			disabled={disabled || loading}
			style={[
				styles.container,
				backgroundColor
					? { backgroundColor }
					: { backgroundColor: isPrimary ? themes[theme!].actionTintColor : themes[theme!].backgroundColor },
				disabled && styles.disabled,
				style
			]}
			accessibilityLabel={title}
			{...otherProps}>
			{loading ? (
				<ActivityIndicator color={textColor} />
			) : (
				<Text style={[styles.text, { color: textColor, fontSize }, styleText]} accessibilityLabel={title}>
					{title}
				</Text>
			)}
		</Touchable>
	);
};

export default Button;
