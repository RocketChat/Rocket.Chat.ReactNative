import React from 'react';
import { Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../../../lib/Icons';
import { themes } from '../../../constants/colors';
import ActivityIndicator from '../../ActivityIndicator';
import styles from './styles';

interface IInput {
	children: JSX.Element;
	onPress: Function;
	theme: string;
	inputStyle: object;
	disabled?: boolean | object;
	placeholder?: string;
	loading?: boolean;
	innerInputStyle?: object;
}

const Input = ({ children, onPress, theme, loading, inputStyle, placeholder, disabled, innerInputStyle }: IInput) => (
	<Touchable
		onPress={onPress}
		style={[{ backgroundColor: themes[theme].backgroundColor }, inputStyle]}
		background={Touchable.Ripple(themes[theme].bannerBackground)}
		disabled={disabled}>
		<View style={[styles.input, { borderColor: themes[theme].separatorColor }, innerInputStyle]}>
			{placeholder ? <Text style={[styles.pickerText, { color: themes[theme].auxiliaryText }]}>{placeholder}</Text> : children}
			{loading ? (
				<ActivityIndicator style={[styles.loading, styles.icon]} />
			) : (
				<CustomIcon name='chevron-down' size={22} color={themes[theme].auxiliaryText} style={styles.icon} />
			)}
		</View>
	</Touchable>
);

export default Input;
