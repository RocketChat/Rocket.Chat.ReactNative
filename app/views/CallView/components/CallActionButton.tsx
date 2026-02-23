import React from 'react';
import { Text, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

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

	const getBackgroundColor = (pressed: boolean) => {
		if (pressed) {
			switch (variant) {
				case 'active':
					return colors.buttonBackgroundSecondaryDangerPress;
				case 'danger':
					return colors.buttonBackgroundDangerPress;
				default:
					return colors.buttonBackgroundSecondaryPress;
			}
		}
		return variant === 'danger' ? colors.buttonBackgroundDangerDefault : colors.buttonBackgroundSecondaryDefault;
	};

	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onPress();
	};

	return (
		<View>
			<Pressable
				onPress={handlePress}
				disabled={disabled}
				style={({ pressed }) => [
					styles.actionButton,
					disabled && { opacity: 0.5 },
					{ backgroundColor: getBackgroundColor(pressed) }
				]}
				accessibilityLabel={label}
				accessibilityRole='button'
				testID={testID}>
				<CustomIcon name={icon} size={32} color={getIconColor()} />
			</Pressable>
			<Text style={[styles.actionButtonLabel, { color: colors.fontDefault }]}>{label}</Text>
		</View>
	);
};

export default CallActionButton;
