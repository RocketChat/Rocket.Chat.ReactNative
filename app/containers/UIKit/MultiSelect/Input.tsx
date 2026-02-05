import React from 'react';
import { Text, View } from 'react-native';

import { CustomIcon } from '../../CustomIcon';
import ActivityIndicator from '../../ActivityIndicator';
import styles from './styles';
import { useTheme } from '../../../theme';
import PressableOpacity from '../../PressableOpacity';

interface IInput {
	children?: JSX.Element;
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
		<PressableOpacity
			onPress={onPress}
			testID={testID}
			style={[{ backgroundColor: colors.surfaceRoom }, styles.inputBorder, inputStyle]}
			android_ripple={{
				color: colors.surfaceNeutral
			}}
			disableOpacityOnAndroid
			disableOpeningMessageModal
			disabled={disabled}>
			<View style={[styles.input, styles.inputBorder, { borderColor: colors.strokeMedium }, innerInputStyle]}>
				{placeholder ? <Text style={[styles.pickerText, { color: colors.fontSecondaryInfo }]}>{placeholder}</Text> : children}
				{loading ? (
					<ActivityIndicator style={styles.icon} />
				) : (
					<CustomIcon name='chevron-down' size={22} color={colors.fontSecondaryInfo} style={styles.icon} />
				)}
			</View>
		</PressableOpacity>
	);
};
export default Input;
