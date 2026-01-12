import React from 'react';
import { Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon, type TIconsName } from '../../../containers/CustomIcon';
import { styles } from '../styles';

type TCallActionButtonVariant = 'default' | 'active' | 'danger';

interface ICallActionButton {
	icon: TIconsName;
	label: string;
	onPress: () => void;
	variant?: TCallActionButtonVariant;
	disabled?: boolean;
	testID?: string;
}

const CallActionButton = ({
	icon,
	label,
	onPress,
	variant = 'default',
	disabled = false,
	testID
}: ICallActionButton): React.ReactElement => {
	const getIconStyle = () => {
		switch (variant) {
			case 'active':
				return styles.actionButtonIconActive;
			case 'danger':
				return styles.actionButtonIconDanger;
			default:
				return styles.actionButtonIconDefault;
		}
	};

	const getIconColor = () => {
		switch (variant) {
			case 'active':
				return '#1F2329';
			case 'danger':
				return '#FFFFFF';
			default:
				return '#FFFFFF';
		}
	};

	return (
		<Touchable
			onPress={onPress}
			disabled={disabled}
			style={[styles.actionButton, disabled && { opacity: 0.5 }]}
			accessibilityLabel={label}
			accessibilityRole='button'
			testID={testID}>
			<View style={[styles.actionButtonIcon, getIconStyle()]}>
				<CustomIcon name={icon} size={24} color={getIconColor()} />
			</View>
			<Text style={styles.actionButtonLabel}>{label}</Text>
		</Touchable>
	);
};

export default CallActionButton;
