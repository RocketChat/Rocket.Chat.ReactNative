import React from 'react';
import { Text } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';

import { CustomIcon, TIconsName } from '../../../containers/CustomIcon';
import styles from '../styles';
import { useTheme } from '../../../theme';
import { useVideoConf } from '../../../lib/hooks/useVideoConf';
import i18n from '../../../i18n';
import { useAppSelector } from '../../../lib/hooks';
import { compareServerVersion } from '../../../lib/methods/helpers';

// TODO: change other icons on future
function UserInfoButton({
	danger,
	iconName,
	onPress,
	label,
	showIcon,
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
	let color = danger ? colors.dangerColor : colors.actionTintColor;
	if (!enabled) color = colors.auxiliaryText;
	if (showIcon)
		return (
			<BorderlessButton enabled={enabled} testID={`room-info-view-${iconName}`} onPress={onPress} style={styles.roomButton}>
				<CustomIcon name={iconName} size={30} color={color} />
				<Text style={[styles.roomButtonText, { color }]}>{label}</Text>
			</BorderlessButton>
		);
	return null;
}

export function CallButton({ rid, isDirect }: { rid: string; isDirect: boolean }): React.ReactElement | null {
	const { callEnabled, showInitCallActionSheet, disabledTooltip } = useVideoConf(rid);
	const serverVersion = useAppSelector(state => state.server.version);
	const greaterThanFive = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '5.0.0');

	const showIcon = greaterThanFive ? callEnabled : callEnabled && isDirect;

	return (
		<UserInfoButton
			enabled={!disabledTooltip}
			onPress={showInitCallActionSheet}
			iconName='phone'
			label={i18n.t('Call')}
			showIcon={showIcon}
		/>
	);
}
