import React from 'react';
import { Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../../CustomIcon';
import ActivityIndicator from '../../ActivityIndicator';
import styles from './styles';
import { useTheme } from '../../../theme';

interface IInput {
	children?: JSX.Element;
	onPress: () => void;
	inputStyle?: object;
	disabled?: boolean | null;
	placeholder?: string;
	loading?: boolean;
	innerInputStyle?: object;
}

const Input = ({ children, onPress, loading, inputStyle, placeholder, disabled, innerInputStyle }: IInput) => {
	const { colors } = useTheme();
	return (
		<Touchable
			onPress={onPress}
			style={[{ backgroundColor: colors.backgroundColor }, styles.inputBorder, inputStyle]}
			background={Touchable.Ripple(colors.bannerBackground)}
			disabled={disabled}
		>
			<View style={[styles.input, styles.inputBorder, { borderColor: colors.separatorColor }, innerInputStyle]}>
				{placeholder ? <Text style={[styles.pickerText, { color: colors.auxiliaryText }]}>{placeholder}</Text> : children}
				{loading ? (
					<ActivityIndicator style={styles.icon} />
				) : (
					<CustomIcon name='chevron-down' size={22} color={colors.auxiliaryText} style={styles.icon} />
				)}
			</View>
		</Touchable>
	);
};
export default Input;
