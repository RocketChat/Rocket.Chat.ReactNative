import React from 'react';
import { type StyleProp, StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';
import Touchable, { type PlatformTouchableProps } from 'react-native-platform-touchable';

import { useTheme } from '../../theme';
import sharedStyles from '../../views/Styles';
import ActivityIndicator from '../ActivityIndicator';

// @ts-ignore
interface IButtonProps extends PlatformTouchableProps {
	title: string;
	onPress: () => void;
	type?: 'primary' | 'secondary';
	backgroundColor?: string;
	loading?: boolean;
	color?: string;
	fontSize?: number;
	style?: StyleProp<ViewStyle> | StyleProp<ViewStyle>[];
	styleText?: StyleProp<TextStyle> | StyleProp<TextStyle>[];
	small?: boolean;
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 12,
		borderRadius: 4
	},
	normalButton: {
		paddingVertical: 14,
		paddingHorizontal: 16,
		justifyContent: 'center'
	},
	smallButton: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		alignSelf: 'center'
	},
	text: {
		...sharedStyles.textMedium,
		...sharedStyles.textAlignCenter
	},
	smallText: {
		...sharedStyles.textBold,
		fontSize: 12,
		lineHeight: 18
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
	small,
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
		small ? styles.smallButton : styles.normalButton,
		styles.container,
		{ backgroundColor: isDisabled ? disabledBackgroundColor : resolvedBackgroundColor },
		isDisabled && backgroundColor ? styles.disabled : {},
		style
	];

	const textStyle = [
		{ color: isDisabled ? colors.buttonPrimaryDisabled : resolvedTextColor, fontSize },
		small ? styles.smallText : styles.text,
		styleText
	];

	return (
		<Touchable
			onPress={onPress}
			disabled={isDisabled}
			// @ts-ignore
			style={containerStyle}
			accessibilityLabel={title}
			accessibilityRole='button'
			{...otherProps}>
			{loading ? <ActivityIndicator color={resolvedTextColor} style={{ padding: 0 }} /> : <Text style={textStyle}>{title}</Text>}
		</Touchable>
	);
};

export default Button;
