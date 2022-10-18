import React, { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import moment from 'moment';

import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';
import sharedStyles from '../../views/Styles';
import messageStyles from './styles';
import MessageContext from './Context';
import { SYSTEM_MESSAGE_TYPES_WITH_AUTHOR_NAME } from './utils';
import { MessageType, SubscriptionType } from '../../definitions';
import { IRoomInfoParam } from '../../views/SearchMessagesView';
import RightIcons from './Components/RightIcons';

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
}

const User = React.memo(
	({ isHeader, useRealName, author, alias, ts, timeFormat, hasError, navToRoomInfo, type, isEdited, ...props }: IMessageUser) => {
		const { user } = useContext(MessageContext);
		const { theme } = useTheme();

		if (isHeader) {
			const username = (useRealName && author?.name) || author?.username;
			const aliasUsername = alias ? (
				<Text style={[styles.alias, { color: themes[theme].auxiliaryText }]}> @{username}</Text>
			) : null;
			const time = moment(ts).format(timeFormat);
			const onUserPress = () => {
				navToRoomInfo?.({
					t: SubscriptionType.DIRECT,
					rid: author?._id || ''
				});
			};
			const isDisabled = author?._id === user.id;

			const textContent = (
				<>
					{alias || username}
					{aliasUsername}
				</>
			);

			if (SYSTEM_MESSAGE_TYPES_WITH_AUTHOR_NAME.includes(type)) {
				return (
					<Text
						style={[styles.usernameInfoMessage, { color: themes[theme].titleText }]}
						onPress={onUserPress}
						// @ts-ignore // TODO - check this prop
						disabled={isDisabled}
					>
						{textContent}
					</Text>
				);
			}

			return (
				<View style={styles.container}>
					<TouchableOpacity style={styles.titleContainer} onPress={onUserPress} disabled={isDisabled}>
						<Text style={[styles.username, { color: themes[theme].titleText }]} numberOfLines={1}>
							{textContent}
						</Text>
						<Text style={[messageStyles.time, { color: themes[theme].auxiliaryText }]}>{time}</Text>
					</TouchableOpacity>
					<RightIcons
						type={type}
						isEdited={isEdited}
						hasError={hasError}
						isReadReceiptEnabled={props.isReadReceiptEnabled}
						unread={props.unread}
					/>
				</View>
			);
		}
		return null;
	}
);

User.displayName = 'MessageUser';

export default User;
