import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '../../i18n';
import { CustomIcon, TIconsName } from '../../containers/CustomIcon';
import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';
import { makeThreadName } from '../../lib/methods/helpers/room';
import { ISubscription, TThreadModel } from '../../definitions';
import { getRoomTitle, isGroupChat, isAndroid, isTablet } from '../../lib/methods/helpers';
import { getMessageById } from '../../lib/database/services/Message';

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
	room: ISubscription;
	thread: TThreadModel | string;
}

const Header = React.memo(({ room, thread }: IHeader) => {
	const [title, setTitle] = useState('');
	const { theme } = useTheme();
	let type;
	if ((thread as TThreadModel)?.id || typeof thread === 'string') {
		type = 'thread';
	} else if (room?.prid) {
		type = 'discussion';
	} else {
		type = room?.t;
	}
	let icon: TIconsName;
	if (type === 'discussion') {
		icon = 'discussions';
	} else if (type === 'thread') {
		icon = 'threads';
	} else if (type === 'c') {
		icon = 'channel-public';
	} else if (type === 'l') {
		icon = 'omnichannel';
	} else if (type === 'd') {
		if (isGroupChat(room)) {
			icon = 'team';
		} else {
			icon = 'mention';
		}
	} else {
		icon = 'channel-private';
	}

	const textColor = themes[theme].fontDefault;

	useEffect(() => {
		(async () => {
			if ((thread as TThreadModel)?.id) {
				const name = makeThreadName(thread as TThreadModel);
				if (name) {
					setTitle(name);
					return;
				}
			}
			if (typeof thread === 'string') {
				// only occurs when sending images and there is no message in the thread
				const data = await getMessageById(thread);
				const msg = data?.asPlain()?.msg;
				if (msg) {
					setTitle(msg);
					return;
				}
			}
			const name = getRoomTitle(room);
			setTitle(name);
		})();
	}, []);

	return (
		<View style={styles.container} accessible accessibilityLabel={`${I18n.t('Sending_to')} ${title}`} accessibilityRole='header'>
			<View style={styles.inner}>
				<Text numberOfLines={1} style={styles.text}>
					<Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
						{I18n.t('Sending_to')}
					</Text>
				</Text>
				<CustomIcon name={icon} size={16} color={textColor} />
				<Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
					{title}
				</Text>
			</View>
		</View>
	);
});

export default Header;
