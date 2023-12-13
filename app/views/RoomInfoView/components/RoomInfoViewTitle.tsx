import React from 'react';
import { Text, View } from 'react-native';

import { ISubscription, SubscriptionType } from '../../../definitions';
import styles from '../styles';
import { useTheme } from '../../../theme';
import RoomTypeIcon from '../../../containers/RoomTypeIcon';
import { getRoomTitle } from '../../../lib/methods/helpers';
import CollapsibleText from '../../../containers/CollapsibleText';

interface IRoomInfoViewTitle {
	room?: ISubscription;
	name?: string;
	username: string;
	statusText?: string;
	type: SubscriptionType;
}

const RoomInfoViewTitle = ({ room, name, username, statusText, type }: IRoomInfoViewTitle): React.ReactElement => {
	const { colors } = useTheme();
	if (type === SubscriptionType.DIRECT) {
		return (
			<View style={styles.roomInfoViewTitleContainer}>
				<Text testID='room-info-view-name' style={[styles.roomTitle, { color: colors.titleText }]}>
					{name}
				</Text>
				{username && (
					<Text
						testID='room-info-view-username'
						style={[styles.roomUsername, { color: colors.auxiliaryText }]}
					>{`@${username}`}</Text>
				)}
				{!!statusText && (
					<View testID='room-info-view-custom-status'>
						<CollapsibleText
							linesToTruncate={2}
							msg={statusText}
							style={[styles.roomUsername, { color: colors.auxiliaryText }]}
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
			<Text testID='room-info-view-name' style={[styles.roomTitle, { color: colors.titleText }]} key='room-info-name'>
				{getRoomTitle(room)}
			</Text>
		</View>
	);
};

export default RoomInfoViewTitle;
