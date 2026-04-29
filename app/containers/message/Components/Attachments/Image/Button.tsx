import React from 'react';
import { type PressableProps } from 'react-native';

import Touchable from '../../../Touchable';
import styles from '../../../styles';

interface IMessageButton {
	children: React.ReactElement;
	disabled?: boolean;
	onPress: () => void;
	accessibilityLabel?: string;
	accessibilityRole?: PressableProps['accessibilityRole'];
}

export const Button = ({
	children,
	onPress,
	disabled,
	accessibilityLabel,
	accessibilityRole = 'imagebutton'
}: IMessageButton) => {
	'use memo';

	return (
		<Touchable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole={accessibilityRole}
			disabled={disabled}
			onPress={onPress}
			style={styles.imageContainer}>
			{children}
		</Touchable>
	);
};
