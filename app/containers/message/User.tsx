import moment from 'moment';
import React, { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MessageType, MessageTypesValues, SubscriptionType } from '../../definitions';
import { useTheme } from '../../theme';
import { IRoomInfoParam } from '../../views/SearchMessagesView';
import sharedStyles from '../../views/Styles';
import RightIcons from './Components/RightIcons';
import MessageContext from './Context';
import messageStyles from './styles';
import { messageHaveAuthorName } from './utils';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	actionIcons: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	username: {
		flexShrink: 1,
		fontSize: 16,
		lineHeight: 22,
		...sharedStyles.textSemibold
	},
	usernameInfoMessage: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	titleContainer: {
		flexShrink: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	alias: {
		fontSize: 14,
		...sharedStyles.textRegular
	}
});

interface IMessageUser {
	isHeader?: boolean;
	hasError: boolean;
	useRealName?: boolean;
	author?: {
		_id: string;
		name?: string;
		username?: string;
	};
	alias?: string;
	ts?: Date;
	timeFormat?: string;
	navToRoomInfo?: (navParam: IRoomInfoParam) => void;
	type: MessageType;
	isEdited: boolean;
	isReadReceiptEnabled?: boolean;
	unread?: boolean;
	pinned?: boolean;
	isTranslated: boolean;
}

const User = React.memo(
	({
		isHeader,
		useRealName,
		author,
		alias,
		ts,
		timeFormat,
		hasError,
		navToRoomInfo,
		type,
		isEdited,
		isTranslated,
		...props
	}: IMessageUser) => {
		const { user } = useContext(MessageContext);
		const { colors } = useTheme();

		if (isHeader) {
			const username = (useRealName && author?.name) || author?.username;
			const aliasUsername = alias ? <Text style={[styles.alias, { color: colors.fontSecondaryInfo }]}> @{username}</Text> : null;
			const time = moment(ts).format(timeFormat);
			const itsMe = author?._id === user.id;

			const onUserPress = () => {
				navToRoomInfo?.({
					t: SubscriptionType.DIRECT,
					rid: author?._id || '',
					itsMe
				});
			};

			const textContent = (
				<>
					{alias || username}
					{aliasUsername}
				</>
			);

			if (messageHaveAuthorName(type as MessageTypesValues)) {
				return (
					<Text style={[styles.usernameInfoMessage, { color: colors.fontTitlesLabels }]} onPress={onUserPress}>
						{textContent}
					</Text>
				);
			}

			return (
				<View style={styles.container}>
					<TouchableOpacity testID={`username-header-${username}`} style={styles.titleContainer} onPress={onUserPress}>
						<Text style={[styles.username, { color: colors.fontTitlesLabels }]} numberOfLines={1}>
							{textContent}
						</Text>
						<Text style={[messageStyles.time, { color: colors.fontSecondaryInfo }]}>{time}</Text>
					</TouchableOpacity>
					<RightIcons
						type={type}
						isEdited={isEdited}
						hasError={hasError}
						isReadReceiptEnabled={props.isReadReceiptEnabled}
						unread={props.unread}
						pinned={props.pinned}
						isTranslated={isTranslated}
					/>
				</View>
			);
		}
		return null;
	}
);

User.displayName = 'MessageUser';

export default User;
