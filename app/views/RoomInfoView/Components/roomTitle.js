import React from 'react';
import { View, Text } from 'react-native';
import RoomTypeIcon from '../../../containers/RoomTypeIcon';
import { themes } from '../../../constants/colors';
import Markdown from '../../../containers/markdown';
import RocketChat from '../../../lib/rocketchat';
import styles from './styles';

export default (room, type, name, username, statusText, theme) => {
	if (type === 'd') {
		return (
			<>
				<Text testID='room-info-view-name' style={[styles.roomTitle, { color: themes[theme].titleText }]}>{ name }</Text>
				{username && <Text testID='room-info-view-username' style={[styles.roomUsername, { color: themes[theme].auxiliaryText }]}>{`@${ username }`}</Text>}
				{!!statusText && <View testID='room-info-view-custom-status'><Markdown msg={statusText} style={[styles.roomUsername, { color: themes[theme].auxiliaryText }]} preview theme={theme} /></View>}
			</>
		);
	}

	return (
		<View style={styles.roomTitleRow}>
			<RoomTypeIcon type={room.prid ? 'discussion' : room.t} key='room-info-type' status={room.visitor?.status} />
			<Text testID='room-info-view-name' style={[styles.roomTitle, { color: themes[theme].titleText }]} key='room-info-name'>{RocketChat.getRoomTitle(room)}</Text>
		</View>
	);
};
