import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

import { CustomIcon } from '../lib/Icons';
import { STATUS_COLORS, themes } from '../constants/colors';
import Status from './Status/Status';
import { withTheme } from '../theme';
import { TUserStatus } from '../definitions/UserStatus';

const styles = StyleSheet.create({
	icon: {
		marginRight: 4
	}
});

interface IRoomTypeIcon {
	theme?: string;
	type: string;
	isGroupChat?: boolean;
	teamMain?: boolean;
	status?: TUserStatus;
	size?: number;
	style?: ViewStyle;
}

const RoomTypeIcon = React.memo(({ type, isGroupChat, status, style, theme, teamMain, size = 16 }: IRoomTypeIcon) => {
	if (!type) {
		return null;
	}

	const color = themes[theme!].titleText;
	const iconStyle = [styles.icon, { color }, style];

	if (type === 'd' && !isGroupChat) {
		if (!status) {
			status = 'offline';
		}
		return <Status style={[iconStyle, { color: STATUS_COLORS[status] }]} size={size} status={status} />;
	}

	// TODO: move this to a separate function
	let icon = 'channel-private';
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
	} else if (type === 'l') {
		icon = 'omnichannel';
	}

	return <CustomIcon name={icon} size={size} style={iconStyle} />;
});

export default withTheme(RoomTypeIcon);
