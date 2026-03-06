import React from 'react';
import { Text } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';

import { CustomIcon, type TIconsName } from '../../../containers/CustomIcon';
import { useTheme } from '../../../theme';
import styles from '../styles';

export function BaseButton({
	danger,
	iconName,
	onPress,
	label,
	showIcon = true,
	enabled = true
}: {
	danger?: boolean;
	iconName: TIconsName;
	onPress?: (prop: any) => void;
	label: string;
	showIcon?: boolean;
	enabled?: boolean;
}): React.ReactElement | null {
	const { colors } = useTheme();
	const color = danger ? colors.buttonBackgroundDangerDefault : colors.fontHint;

	if (showIcon)
		return (
			<BorderlessButton enabled={enabled} testID={`room-info-view-${iconName}`} onPress={onPress} style={styles.roomButton}>
				<CustomIcon name={iconName} size={30} color={color} />
				<Text numberOfLines={1} style={[styles.roomButtonText, { color }]}>
					{label}
				</Text>
			</BorderlessButton>
		);
	return null;
}
