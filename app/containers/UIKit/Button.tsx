import { type FC } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import sharedStyles from '../../views/Styles';
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
	loading?: boolean;
	style?: StyleProp<ViewStyle>;
}

const UIKitButton: FC<IUIKitButtonProps> = ({ title, onPress, type = 'primary', loading, style }) => {
	const { colors } = useTheme();
	const isPrimary = type === 'primary';
	const backgroundColor = isPrimary ? colors.buttonBackgroundPrimaryDefault : colors.buttonBackgroundSecondaryDefault;
	const color = isPrimary ? colors.fontWhite : colors.fontDefault;

	return (
		<Pressable
			onPress={onPress}
			disabled={loading}
			accessibilityLabel={title}
			accessibilityRole='button'
			style={({ pressed }) => [styles.container, { backgroundColor }, style, pressed && styles.pressed]}>
			{loading ? <ActivityIndicator color={color} style={{ padding: 0 }} /> : <Text style={[styles.text, { color }]}>{title}</Text>}
		</Pressable>
	);
};

export default UIKitButton;
