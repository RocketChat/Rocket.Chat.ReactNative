import { type ReactElement } from 'react';
import { type PressableProps } from 'react-native';

import MessageActionTouchable from '../../MessageActionTouchable';
import styles from '../../../styles';

interface IMessageButton {
	children: ReactElement;
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
		<MessageActionTouchable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole={accessibilityRole}
			disabled={disabled}
			onPress={onPress}
			style={styles.imageContainer}>
			{children}
		</MessageActionTouchable>
	);
};
