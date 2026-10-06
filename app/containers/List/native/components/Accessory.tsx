import { Text, View } from 'react-native';

import { CustomIcon } from '~/containers/CustomIcon';
import { getStatusIconName } from '~/containers/Status/getStatusIconName';
import Indicator from '~/containers/NativeListRow/components/Indicator';
import { useUserStatusColor } from '~/lib/hooks/useUserStatusColor';
import { type TUserStatus } from '~/definitions';
import { useTheme } from '~/theme';
import { ICON_SIZE } from '~/containers/List/constants';
import { type TNativeListAccessory } from '../utils/describeAccessory';
import styles from '../styles';
import NativeListToggle from './Toggle';

const NativeListStatus = ({ status }: { status: TUserStatus }) => {
	const { colors } = useTheme();
	const statusColor = useUserStatusColor(status);

	return <CustomIcon name={getStatusIconName(status)} size={ICON_SIZE} color={statusColor ?? colors.userPresenceOffline} />;
};

const NativeListAccessory = ({ accessory }: { accessory: TNativeListAccessory }) => {
	const { colors } = useTheme();

	switch (accessory.kind) {
		case 'icon':
			return (
				<CustomIcon name={accessory.name} size={accessory.size ?? ICON_SIZE} color={accessory.color ?? colors.fontDefault} />
			);
		case 'indicator':
			return <Indicator indicator={accessory.indicator} />;
		case 'check':
			return <Indicator indicator='check' />;
		case 'status':
			return <NativeListStatus status={accessory.status} />;
		case 'toggle':
			return (
				<NativeListToggle
					value={accessory.isOn}
					onValueChange={accessory.onValueChange}
					disabled={accessory.disabled}
					testID={accessory.testID}
					tintColor={colors.buttonBackgroundPrimaryDefault}
				/>
			);
		case 'checkbox':
			return (
				<NativeListToggle
					value={accessory.value}
					onValueChange={accessory.onValueChange}
					testID={accessory.testID}
					tintColor={colors.strokeHighlight}
				/>
			);
		case 'text':
			return (
				<Text numberOfLines={1} style={[styles.accessoryText, { color: accessory.color ?? colors.fontSecondaryInfo }]}>
					{accessory.text}
				</Text>
			);
		case 'hosted':
			return <View>{accessory.element}</View>;
	}
};

export default NativeListAccessory;
