import React from 'react';
import { Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

import { type ISubscription, type TUserStatus, SubscriptionType } from '../../../definitions';
import styles from '../styles';
import { useTheme } from '../../../theme';
import RoomTypeIcon from '../../../containers/RoomTypeIcon';
import { getRoomTitle } from '../../../lib/methods/helpers';
import { formatStatusExpiry } from '../../../lib/methods/helpers/formatStatusExpiry';
import CollapsibleText from '../../../containers/CollapsibleText';
import { CustomIcon } from '../../../containers/CustomIcon';
import Status from '../../../containers/Status';
import EventEmitter from '../../../lib/methods/helpers/events';
import { LISTENER } from '../../../containers/Toast';
import I18n from '../../../i18n';

const STATUS_I18N_KEYS: Partial<Record<TUserStatus, string>> = {
	online: 'Online',
	away: 'Away',
	busy: 'Busy',
	offline: 'Offline'
};

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

const RoomInfoViewTitle = ({ room, name, username, userId, status, statusText, statusExpiresAt, type }: IRoomInfoViewTitle): React.ReactElement => {
	const { colors } = useTheme();

	const copyInfoToClipboard = (data: string) => {
		Clipboard.setString(data);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	};

	if (type === SubscriptionType.DIRECT) {
		const presenceLabel = !statusText && status ? STATUS_I18N_KEYS[status] : undefined;

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
				{!!statusText && (
					<View testID='room-info-view-custom-status' style={styles.statusRow}>
						{userId && <Status size={12} id={userId} />}
						<CollapsibleText
							linesToTruncate={2}
							msg={statusText}
							style={[styles.roomUsername, { color: colors.fontSecondaryInfo }]}
						/>
					</View>
				)}
				{!!presenceLabel && (
					<View testID='room-info-view-presence-status' style={styles.statusRow}>
						{userId && <Status size={12} id={userId} />}
						<Text style={[styles.roomUsername, { color: colors.fontSecondaryInfo }]}>{I18n.t(presenceLabel)}</Text>
					</View>
				)}
				{!!statusExpiresAt && !!formatStatusExpiry(statusExpiresAt) && (
					<View testID='room-info-view-status-expiry' style={styles.statusRow}>
						<CustomIcon name='clock' size={14} color={colors.fontSecondaryInfo} />
						<Text style={[styles.roomUsername, { color: colors.fontSecondaryInfo, marginTop: 0 }]}>
							{formatStatusExpiry(statusExpiresAt)}
						</Text>
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
				abacAttributes={room?.abacAttributes}
			/>
			<Text testID='room-info-view-name' style={[styles.roomTitle, { color: colors.fontTitlesLabels }]} key='room-info-name'>
				{getRoomTitle(room)}
			</Text>
		</View>
	);
};

export default RoomInfoViewTitle;
