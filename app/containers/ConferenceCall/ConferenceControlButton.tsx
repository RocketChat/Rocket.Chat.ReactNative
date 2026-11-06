import * as Haptics from 'expo-haptics';
import { type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CustomIcon, type TIconsName } from '~/containers/CustomIcon';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { getControlColors, type TConferenceControlVariant } from './getControlColors';

interface IConferenceControlButton {
	icon?: TIconsName;
	renderIcon?: (color: string) => ReactElement;
	label: string;
	onPress: () => void;
	onLongPress?: () => void;
	variant?: TConferenceControlVariant;
	disabled?: boolean;
	size?: number;
	badge?: number | string;
	testID?: string;
}

export const CONTROL_BUTTON_SIZE = 44;
export const COMPACT_BUTTON_SIZE = 32;

export const CONTROL_ICON_SIZE = 22;
const BADGE_SIZE = 18;

const styles = StyleSheet.create({
	button: {
		borderRadius: 4,
		alignItems: 'center',
		justifyContent: 'center'
	},
	disabled: {
		opacity: 0.5
	},
	badge: {
		position: 'absolute',
		top: -6,
		right: -6,
		minWidth: BADGE_SIZE,
		height: BADGE_SIZE,
		paddingHorizontal: 4,
		borderRadius: BADGE_SIZE / 2,
		alignItems: 'center',
		justifyContent: 'center'
	},
	badgeText: {
		...sharedStyles.textBold,
		fontSize: 11,
		lineHeight: 14
	}
});

const ConferenceControlButton = ({
	icon,
	renderIcon,
	label,
	onPress,
	onLongPress,
	variant = 'default',
	disabled = false,
	size = CONTROL_BUTTON_SIZE,
	badge,
	testID
}: IConferenceControlButton): ReactElement => {
	const { colors } = useTheme();
	const iconColor = getControlColors(colors, variant, false).icon;

	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onPress();
	};

	return (
		<Pressable
			onPress={handlePress}
			onLongPress={onLongPress}
			disabled={disabled}
			hitSlop={Math.max(0, (CONTROL_BUTTON_SIZE - size) / 2)}
			accessibilityRole='button'
			accessibilityLabel={label}
			accessibilityState={{ selected: variant === 'toggled', disabled }}
			testID={testID}
			style={({ pressed }) => [
				styles.button,
				{ width: size, height: size, backgroundColor: getControlColors(colors, variant, pressed).background },
				disabled && styles.disabled
			]}>
			{renderIcon ? renderIcon(iconColor) : <CustomIcon name={icon as TIconsName} size={CONTROL_ICON_SIZE} color={iconColor} />}
			{badge !== undefined && badge !== 0 ? (
				<View style={[styles.badge, { backgroundColor: colors.badgeBackgroundLevel1 }]} testID='conference-control-badge'>
					<Text style={[styles.badgeText, { color: colors.fontWhite }]}>{badge}</Text>
				</View>
			) : null}
		</Pressable>
	);
};

export default ConferenceControlButton;
