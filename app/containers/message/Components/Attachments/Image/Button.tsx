import React from 'react';
import { useTheme } from '../../../../../theme';
import Touchable from '../../../Touchable';
import styles from '../../../styles';

interface IMessageButton {
	children: React.ReactElement;
	disabled?: boolean;
	onPress: () => void;
	onLongPress?: (() => void) | null; // Allow onLongPress to be a function or null
}

export const Button = ({ children, onPress, disabled, onLongPress = null }: IMessageButton) => {
	const { colors } = useTheme();
	return (
		<Touchable
			onLongPress={onLongPress} // Corrected to pass the default null if not provided
			disabled={disabled}
			onPress={onPress}
			style={styles.imageContainer}
			background={Touchable.Ripple(colors.surfaceNeutral)}>
			{children}
		</Touchable>
	);
};
