import { type ReactElement } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CustomIcon } from '~/containers/CustomIcon';
import ActivityIndicator from '~/containers/ActivityIndicator';
import styles from './styles';
import { useTheme } from '~/theme';

interface IInput {
	children?: ReactElement;
	onPress: () => void;
	inputStyle?: object;
	disabled?: boolean;
	placeholder?: string;
	loading?: boolean;
	innerInputStyle?: object;
	testID?: string;
}

const Input = ({ children, onPress, loading, inputStyle, placeholder, disabled, innerInputStyle, testID }: IInput) => {
	const { colors } = useTheme();
	return (
		<Pressable
			onPress={onPress}
			testID={testID}
			disabled={disabled}
			accessibilityRole='button'
			style={({ pressed }) => [
				{ backgroundColor: colors.surfaceRoom },
				styles.inputBorder,
				inputStyle,
				pressed && styles.pressed
			]}>
			<View style={[styles.input, styles.inputBorder, { borderColor: colors.strokeMedium }, innerInputStyle]}>
				{placeholder ? <Text style={[styles.pickerText, { color: colors.fontSecondaryInfo }]}>{placeholder}</Text> : children}
				{loading ? (
					<ActivityIndicator style={styles.icon} />
				) : (
					<CustomIcon name='chevron-down' size={22} color={colors.fontSecondaryInfo} style={styles.icon} />
				)}
			</View>
		</Pressable>
	);
};
export default Input;
