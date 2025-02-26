import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';

import { useTheme } from '../../../../../theme';
import Touchable from '../../../Touchable';
import styles from '../../../styles';

interface IMessageButton {
	children: React.ReactElement;
	disabled?: boolean;
	customStyles?: StyleProp<ViewStyle>;
	onPress: () => void;
}

export const Button = ({ children, onPress, disabled, customStyles }: IMessageButton) => {
	const { colors } = useTheme();
	return (
		<Touchable
			disabled={disabled}
			onPress={onPress}
			style={[styles.imageContainer, customStyles]}
			background={Touchable.Ripple(colors.surfaceNeutral)}>
			{children}
		</Touchable>
	);
};
