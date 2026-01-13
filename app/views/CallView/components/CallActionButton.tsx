import React from 'react';
import { Text, View, Pressable } from 'react-native';

import { CustomIcon, type TIconsName } from '../../../containers/CustomIcon';
import { styles } from '../styles';
import { useTheme } from '../../../theme';

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
	const { colors } = useTheme();

	const getIconColor = () => {
		switch (variant) {
			case 'active':
				return colors.buttonFontSecondaryDanger;
			case 'danger':
				return colors.buttonFontDanger;
			default:
				return colors.buttonFontSecondary;
		}
	};

	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			style={[disabled && { opacity: 0.5 }]}
			accessibilityLabel={label}
			accessibilityRole='button'
			testID={testID}>
			<View
				style={[
					styles.actionButton,
					{
						backgroundColor: variant === 'danger' ? colors.buttonBackgroundDangerDefault : colors.buttonBackgroundSecondaryDefault
					}
				]}>
				<CustomIcon name={icon} size={32} color={getIconColor()} />
			</View>
			<Text style={[styles.actionButtonLabel, { color: colors.fontDefault }]}>{label}</Text>
		</Pressable>
	);
};

export default CallActionButton;
