import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { type ImageStyle } from 'expo-image';

import { OmnichannelRoomIcon } from './OmnichannelRoomIcon';
import { CustomIcon, type TIconsName } from '../CustomIcon';
import { themes } from '../../lib/constants/colors';
import Status from '../Status';
import { useTheme } from '../../theme';
import { type TUserStatus, type IOmnichannelSource, type ISubscription } from '../../definitions';

const styles = StyleSheet.create({
	icon: {
		marginRight: 4
	}
});

interface IRoomTypeIcon {
	type?: string;
	userId?: string | null;
	isGroupChat?: boolean;
	teamMain?: boolean;
	status?: TUserStatus;
	size?: number;
	style?: ViewStyle;
	sourceType?: IOmnichannelSource;
	abacAttributes?: ISubscription['abacAttributes'];
}

const RoomTypeIcon = React.memo(
	({ userId, type, isGroupChat, status, style, teamMain, size = 16, sourceType, abacAttributes }: IRoomTypeIcon) => {
		const { theme } = useTheme();

		if (!type) {
			return null;
		}

		const iconStyle = [styles.icon, style];

		if (type === 'd' && !isGroupChat && userId) {
			// @ts-ignore
			return <Status id={userId} style={iconStyle} size={size} status={status} />;
		}

		if (type === 'l') {
			return (
				<OmnichannelRoomIcon style={iconStyle as ImageStyle} size={size} type={type} status={status} sourceType={sourceType} />
			);
		}

		// TODO: move this to a separate function
		let icon: TIconsName = 'channel-private';
		if (abacAttributes?.length) {
			icon = teamMain ? 'team-shield' : 'hash-shield';
		} else if (teamMain) {
			icon = `teams${type === 'p' ? '-private' : ''}`;
		} else if (type === 'discussion') {
			icon = 'discussions';
		} else if (type === 'c') {
			icon = 'channel-public';
		} else if (type === 'd' && isGroupChat) {
			icon = 'message';
		}

		// @ts-ignore
		return <CustomIcon name={icon} size={size} color={themes[theme].fontTitlesLabels} style={iconStyle} />;
	}
);

export default RoomTypeIcon;
