import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import RocketChat from '../../lib/rocketchat';
import { themes } from '../../constants/colors';
import { useTheme } from '../../theme';
import { isAndroid, isTablet } from '../../utils/deviceInfo';
import sharedStyles from '../Styles';
import { makeThreadName } from '../../utils/room';

const androidMarginLeft = isTablet ? 0 : 4;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginRight: isAndroid ? 15 : 5,
		marginLeft: isAndroid ? androidMarginLeft : -10,
		justifyContent: 'center'
	},
	inner: {
		alignItems: 'center',
		flexDirection: 'row',
		flex: 1
	},
	text: {
		fontSize: 16,
		...sharedStyles.textRegular,
		marginRight: 4
	},
	name: {
		...sharedStyles.textSemibold
	}
});

interface IHeader {
	room: { prid?: string; t?: string };
	thread: { id?: string };
}

const Header = React.memo(({ room, thread }: IHeader) => {
	const { theme } = useTheme();
	let type;
	if (thread?.id) {
		type = 'thread';
	} else if (room?.prid) {
		type = 'discussion';
	} else {
		type = room?.t;
	}
	let icon;
	if (type === 'discussion') {
		icon = 'discussions';
	} else if (type === 'thread') {
		icon = 'threads';
	} else if (type === 'c') {
		icon = 'channel-public';
	} else if (type === 'l') {
		icon = 'omnichannel';
	} else if (type === 'd') {
		if (RocketChat.isGroupChat(room)) {
			icon = 'team';
		} else {
			icon = 'mention';
		}
	} else {
		icon = 'channel-private';
	}

	const textColor = themes[theme].previewTintColor;

	let title;
	if (thread?.id) {
		title = makeThreadName(thread);
	} else {
		title = RocketChat.getRoomTitle(room);
	}

	return (
		<View style={styles.container}>
			<View style={styles.inner}>
				<Text numberOfLines={1} style={styles.text}>
					<Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
						{I18n.t('Sending_to')}{' '}
					</Text>
					<CustomIcon name={icon} size={16} color={textColor} />
					<Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
						{title}
					</Text>
				</Text>
			</View>
		</View>
	);
});

export default Header;
