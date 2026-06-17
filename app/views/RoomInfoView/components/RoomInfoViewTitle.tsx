import { Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { type ReactElement } from 'react';

import { type ISubscription, type TUserStatus, SubscriptionType } from '../../../definitions';
import styles from '../styles';
import { useTheme } from '../../../theme';
import RoomTypeIcon from '../../../containers/RoomTypeIcon';
import { getRoomTitle } from '../../../lib/methods/helpers';
import CollapsibleText from '../../../containers/CollapsibleText';
import StatusRows from '../../../containers/Status/StatusRows';
import EventEmitter from '../../../lib/methods/helpers/events';
import { LISTENER } from '../../../containers/Toast';
import I18n from '../../../i18n';

interface IRoomInfoViewTitle {
	room?: ISubscription;
	name?: string;
	username: string;
	userId?: string;
	status?: TUserStatus;
	statusText?: string;
	statusExpiresAt?: string;
	type: SubscriptionType;
}

const RoomInfoViewTitle = ({
	room,
	name,
	username,
	userId,
	status,
	statusText,
	statusExpiresAt,
	type
}: IRoomInfoViewTitle): ReactElement => {
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
					style={[styles.roomTitle, { color: colors.fontTitlesLabels }]}>
					{name}
				</Text>
				{username && (
					<Text
						onLongPress={() => copyInfoToClipboard(username)}
						testID='room-info-view-username'
						style={[styles.roomUsername, { color: colors.fontSecondaryInfo }]}>{`@${username}`}</Text>
				)}
				<StatusRows
					userId={userId}
					statusText={statusText}
					status={status}
					statusExpiresAt={statusExpiresAt}
					statusTextColor={colors.fontTitlesLabels}
					fontSecondaryInfo={colors.fontSecondaryInfo}
					renderStatusText={text => (
						<CollapsibleText linesToTruncate={2} msg={text} style={[styles.statusText, { color: colors.fontTitlesLabels }]} />
					)}
					textStyle={styles.statusText}
					secondaryTextStyle={styles.expiryText}
					rowStyle={styles.statusRow}
					expiryRowStyle={styles.statusExpiryRow}
					testIDs={{
						customStatus: 'room-info-view-custom-status',
						presenceStatus: 'room-info-view-presence-status',
						statusExpiry: 'room-info-view-status-expiry'
					}}
				/>
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
				abacAttributes={room?.abacAttributes}
			/>
			<Text testID='room-info-view-name' style={[styles.roomTitle, { color: colors.fontTitlesLabels }]} key='room-info-name'>
				{getRoomTitle(room)}
			</Text>
		</View>
	);
};

export default RoomInfoViewTitle;
