import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

import { CustomIcon } from '../../lib/Icons';
import { STATUS_COLORS, themes } from '../../constants/colors';
import Status from '../Status/Status';
import { useTheme } from '../../theme';
import { OmnichannelRoomIcon } from './OmnichannelRoomIcon';

const styles = StyleSheet.create({
	icon: {
		marginRight: 4
	}
});

interface IRoomTypeIcon {
	type: string;
	isGroupChat?: boolean;
	teamMain?: boolean;
	status?: string;
	size?: number;
	style?: ViewStyle;
}

const RoomTypeIcon = React.memo(({ type, isGroupChat, status, style, teamMain, size = 16 }: IRoomTypeIcon) => {
	console.log(
		'🚀 ~ file: index.tsx ~ line 27 ~ RoomTypeIcon ~ type, isGroupChat, status, style, teamMain, size',
		type,
		isGroupChat,
		status,
		style,
		teamMain,
		size
	);
	if (!type) {
		return null;
	}
	const { theme } = useTheme();

	const color = themes[theme!].titleText;
	const iconStyle = [styles.icon, { color }, style];

	if (type === 'd' && !isGroupChat) {
		return (
			<Status style={[iconStyle, { color: STATUS_COLORS[status!] ?? STATUS_COLORS.offline }]} size={size} status={status!} />
		);
	}

	if (type === 'l') {
		return <OmnichannelRoomIcon size={size} type={type} status={status} />;
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
	}

	return <CustomIcon name={icon} size={size} style={iconStyle} />;
});

export default RoomTypeIcon;
