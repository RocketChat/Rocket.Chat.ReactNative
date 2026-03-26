import React from 'react';

import Touchable from '../../../Touchable';
import styles from '../../../styles';

interface IMessageButton {
	children: React.ReactElement;
	disabled?: boolean;
	onPress: () => void;
}

export const Button = ({ children, onPress, disabled }: IMessageButton) => {
	'use memo';

	return (
		<Touchable disabled={disabled} onPress={onPress} style={styles.imageContainer}>
			{children}
		</Touchable>
	);
};
