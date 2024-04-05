import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import Touchable, { PlatformTouchableProps } from 'react-native-platform-touchable';

import { useTheme } from '../../theme';
import sharedStyles from '../../views/Styles';
import ActivityIndicator from '../ActivityIndicator';

interface IButtonProps extends PlatformTouchableProps {
	title: string;
	onPress: () => void;
	type?: string; // primary | secondary
	backgroundColor?: string;
	loading?: boolean;
	color?: string;
	fontSize?: number;
	styleText?: StyleProp<TextStyle> | StyleProp<TextStyle>[];
}

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 14,
		justifyContent: 'center',
		height: 48,
		borderRadius: 4,
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

const Button: React.FC<IButtonProps> = ({
	type = 'primary',
	disabled,
	loading,
	fontSize = 16,
	title,
	onPress,
	backgroundColor,
	color,
	style,
	styleText,
	...otherProps
}) => {
	const { colors } = useTheme();
	const isPrimary = type === 'primary';
	const isDisabled = disabled || loading;

	const defaultBackgroundColor = isPrimary ? colors.buttonBackgroundPrimaryDefault : colors.buttonBackgroundSecondaryDefault;
	const disabledBackgroundColor = isPrimary ? colors.buttonBackgroundPrimaryDisabled : colors.buttonBackgroundSecondaryDisabled;

	const resolvedBackgroundColor = backgroundColor || defaultBackgroundColor;
	const resolvedTextColor = color || (isPrimary ? colors.fontWhite : colors.fontDefault);

	const containerStyle = [
		styles.container,
		{ backgroundColor: isDisabled ? disabledBackgroundColor : resolvedBackgroundColor },
		isDisabled && backgroundColor ? styles.disabled : {},
		style
	];

	const textStyle = [styles.text, { color: isDisabled ? colors.fontDisabled : resolvedTextColor, fontSize }, styleText];

	return (
		<Touchable onPress={onPress} disabled={isDisabled} style={containerStyle} accessibilityLabel={title} {...otherProps}>
			{loading ? <ActivityIndicator color={resolvedTextColor} /> : <Text style={textStyle}>{title}</Text>}
		</Touchable>
	);
};

export default Button;
