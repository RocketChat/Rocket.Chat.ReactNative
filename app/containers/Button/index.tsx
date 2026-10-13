import { type FC } from 'react';
import { type Insets, type StyleProp, StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import ActivityIndicator from '../ActivityIndicator';
import { RectButton } from '../GestureButtons';

interface IButtonProps {
	title: string;
	testID?: string;
	hitSlop?: number | Insets;
	accessibilityLabel?: string;
	onPress: () => void;
	type?: 'primary' | 'secondary';
	backgroundColor?: string;
	loading?: boolean;
	color?: string;
	fontSize?: number;
	style?: StyleProp<ViewStyle> | StyleProp<ViewStyle>[];
	styleText?: StyleProp<TextStyle> | StyleProp<TextStyle>[];
	small?: boolean;
	disabled?: boolean;
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

const Button: FC<IButtonProps> = ({
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
	testID,
	hitSlop,
	accessibilityLabel
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
		<RectButton
			onPress={onPress}
			disabled={isDisabled}
			style={containerStyle}
			testID={testID}
			hitSlop={hitSlop}
			accessibilityLabel={accessibilityLabel ?? title}
			accessibilityRole='button'>
			{loading ? <ActivityIndicator color={resolvedTextColor} style={{ padding: 0 }} /> : <Text style={textStyle}>{title}</Text>}
		</RectButton>
	);
};

export default Button;
