import { type FC } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import ActivityIndicator from '../ActivityIndicator';

const styles = StyleSheet.create({
	container: {
		borderRadius: 4,
		paddingVertical: 14,
		paddingHorizontal: 16,
		justifyContent: 'center'
	},
	text: {
		...sharedStyles.textMedium,
		...sharedStyles.textAlignCenter
	},
	pressed: {
		opacity: 0.7
	}
});

interface IUIKitButtonProps {
	title: string;
	onPress: () => void;
	type?: 'primary' | 'secondary';
	backgroundColor?: string;
	color?: string;
	loading?: boolean;
	disabled?: boolean;
	testID?: string;
	style?: StyleProp<ViewStyle>;
}

const UIKitButton: FC<IUIKitButtonProps> = ({
	title,
	onPress,
	type = 'primary',
	backgroundColor,
	color,
	loading,
	disabled,
	testID,
	style
}) => {
	const { colors } = useTheme();
	const isPrimary = type === 'primary';
	const resolvedBackgroundColor =
		backgroundColor || (isPrimary ? colors.buttonBackgroundPrimaryDefault : colors.buttonBackgroundSecondaryDefault);
	const resolvedColor = color || (isPrimary ? colors.fontWhite : colors.fontDefault);
	const isDisabled = disabled || loading;

	return (
		<Pressable
			onPress={onPress}
			disabled={isDisabled}
			testID={testID}
			accessibilityLabel={title}
			accessibilityRole='button'
			accessibilityState={{ disabled: isDisabled }}
			style={({ pressed }) => [styles.container, { backgroundColor: resolvedBackgroundColor }, style, pressed && styles.pressed]}>
			{loading ? (
				<ActivityIndicator color={resolvedColor} style={{ padding: 0 }} />
			) : (
				<Text style={[styles.text, { color: resolvedColor }]}>{title}</Text>
			)}
		</Pressable>
	);
};

export default UIKitButton;
