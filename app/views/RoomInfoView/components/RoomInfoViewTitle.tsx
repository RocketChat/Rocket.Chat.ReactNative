import React from 'react';
import { Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

import { ISubscription, SubscriptionType } from '../../../definitions';
import styles from '../styles';
import { useTheme } from '../../../theme';
import RoomTypeIcon from '../../../containers/RoomTypeIcon';
import { getRoomTitle } from '../../../lib/methods/helpers';
import CollapsibleText from '../../../containers/CollapsibleText';
import EventEmitter from '../../../lib/methods/helpers/events';
import { LISTENER } from '../../../containers/Toast';
import I18n from '../../../i18n';

interface IRoomInfoViewTitle {
	room?: ISubscription;
	name?: string;
	username: string;
	statusText?: string;
	type: SubscriptionType;
}

const RoomInfoViewTitle = ({ room, name, username, statusText, type }: IRoomInfoViewTitle): React.ReactElement => {
	const { colors } = useTheme();

	const copyInfoToClipboard = (data: string) => {
		Clipboard.setString(data);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	};

	if (type === SubscriptionType.DIRECT) {
		return (
			<View style={styles.roomInfoViewTitleContainer}>
				<Text
					onLongPress={() => (name ? copyInfoToClipboard(name) : {})}
					testID='room-info-view-name'
					style={[styles.roomTitle, { color: colors.fontTitlesLabels }]}
				>
					{name}
				</Text>
				{username && (
					<Text
						onLongPress={() => copyInfoToClipboard(username)}
						testID='room-info-view-username'
						style={[styles.roomUsername, { color: colors.fontSecondaryInfo }]}
					>{`@${username}`}</Text>
				)}
				{!!statusText && (
					<View testID='room-info-view-custom-status'>
						<CollapsibleText
							linesToTruncate={2}
							msg={statusText}
							style={[styles.roomUsername, { color: colors.fontSecondaryInfo }]}
						/>
					</View>
				)}
			</View>
		);
	}
	return (
		<View style={styles.roomTitleContainer}>
			<RoomTypeIcon
				type={room?.prid ? 'discussion' : type}
				teamMain={room?.teamMain}
				key='room-info-type'
				status={room?.visitor?.status}
				sourceType={room?.source}
			/>
			<Text testID='room-info-view-name' style={[styles.roomTitle, { color: colors.fontTitlesLabels }]} key='room-info-name'>
				{getRoomTitle(room)}
			</Text>
		</View>
	);
};

export default RoomInfoViewTitle;
