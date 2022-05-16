import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

import { OmnichannelRoomIcon } from './OmnichannelRoomIcon';
import { CustomIcon, TIconsName } from '../CustomIcon';
import { STATUS_COLORS, themes } from '../../lib/constants';
import Status from '../Status/Status';
import { useTheme } from '../../theme';
import { TUserStatus, IOmnichannelSource } from '../../definitions';

const styles = StyleSheet.create({
	icon: {
		marginRight: 4
	}
});

interface IRoomTypeIcon {
	type: string;
	isGroupChat?: boolean;
	teamMain?: boolean;
	status?: TUserStatus;
	size?: number;
	style?: ViewStyle;
	sourceType?: IOmnichannelSource;
}

const RoomTypeIcon = React.memo(({ type, isGroupChat, status, style, teamMain, size = 16, sourceType }: IRoomTypeIcon) => {
	const { theme } = useTheme();

	if (!type) {
		return null;
	}

	const color = themes[theme].titleText;
	const iconStyle = [styles.icon, { color }, style];

	if (type === 'd' && !isGroupChat) {
		if (!status) {
			status = 'offline';
		}
		return <Status style={[iconStyle, { color: STATUS_COLORS[status] }]} size={size} status={status} />;
	}

	if (type === 'l') {
		return <OmnichannelRoomIcon style={[styles.icon, style]} size={size} type={type} status={status} sourceType={sourceType} />;
	}

	// TODO: move this to a separate function
	let icon: TIconsName = 'channel-private';
	if (teamMain) {
		icon = `teams${type === 'p' ? '-private' : ''}`;
	} else if (type === 'discussion') {
		icon = 'discussions';
	} else if (type === 'c') {
		icon = 'channel-public';
	} else if (type === 'd') {
		if (isGroupChat) {
			icon = 'message';
		} else {
			icon = 'mention';
		}
	}

	return <CustomIcon name={icon} size={size} color={color} style={iconStyle} />;
});

export default RoomTypeIcon;
