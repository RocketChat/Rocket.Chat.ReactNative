import { useContext, memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { type MessageType, type MessageTypesValues, SubscriptionType } from '../../definitions';
import { type IRoomInfoParam } from '../../views/SearchMessagesView';
import sharedStyles from '../../views/Styles';
import RightIcons from './Components/RightIcons';
import MessageContext from './Context';
import { messageHaveAuthorName } from './utils';
import MessageTime from './Time';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const styles = StyleSheet.create(theme => ({
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
		...sharedStyles.textSemibold,
		color: theme.colors.fontTitlesLabels
	},
	usernameInfoMessage: {
		fontSize: 16,
		...sharedStyles.textMedium,
		color: theme.colors.fontTitlesLabels
	},
	titleContainer: {
		flexShrink: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4
	},
	alias: {
		fontSize: 14,
		...sharedStyles.textRegular,
		color: theme.colors.fontSecondaryInfo
	}
}));

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

const User = memo(
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
		'use memo';

		const { user } = useContext(MessageContext);
		const { isLargeFontScale } = useResponsiveLayout();

		if (isHeader) {
			const username = (useRealName && author?.name) || author?.username;
			const aliasUsername = alias ? <Text style={styles.alias}> @{username}</Text> : null;
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
					<Text style={styles.usernameInfoMessage} onPress={onUserPress}>
						{textContent}
					</Text>
				);
			}

			return (
				<View style={styles.container}>
					<Pressable testID={`username-header-${username}`} style={styles.titleContainer} onPress={onUserPress}>
						<Text style={styles.username} numberOfLines={1}>
							{textContent}
						</Text>
						{isLargeFontScale ? null : <MessageTime timeFormat={timeFormat} ts={ts} />}
					</Pressable>
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
