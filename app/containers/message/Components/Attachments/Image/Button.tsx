import React from 'react';

import { useTheme } from '../../../../../theme';
import styles from '../../../styles';
import PressableOpacity from '../../../../PressableOpacity';

interface IMessageButton {
	children: React.ReactElement;
	disabled?: boolean;
	onPress: () => void;
}

export const Button = ({ children, onPress, disabled }: IMessageButton) => {
	'use memo';

	const { colors } = useTheme();
	return (
		<PressableOpacity
			disabled={disabled}
			onPress={onPress}
			style={styles.imageContainer}
			android_ripple={{
				color: colors.surfaceNeutral
				// foreground: true		// if the effect should be applied above the image
			}}
			disableOpacityOnAndroid>
			{children}
		</PressableOpacity>
	);
};
