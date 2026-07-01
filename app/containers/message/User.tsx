import { useContext } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type MessageTypesValues, SubscriptionType } from '../../definitions';
import { useTheme } from '../../theme';
import sharedStyles from '../../views/Styles';
import RightIcons from './Components/RightIcons';
import MessageContext from './Context';
import { messageHaveAuthorName } from './utils';
import MessageTime from './Time';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import {
	useIsEdited,
	useMessageAuthor,
	useMessageGrouping,
	useMessageMeta,
	useMessageStatus,
	useMessageText
} from './MessageStore';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
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
		alignItems: 'center',
		gap: 4
	},
	alias: {
		fontSize: 14,
		...sharedStyles.textRegular
	}
});

interface IMessageUser {
	useRealName?: boolean;
	timeFormat?: string;
	isReadReceiptEnabled?: boolean;
}

const User = ({ useRealName, timeFormat, isReadReceiptEnabled }: IMessageUser) => {
	'use memo';

	const { user, navToRoomInfo } = useContext(MessageContext);
	const { colors } = useTheme();
	const { isLargeFontScale } = useResponsiveLayout();
	const isHeader = useMessageGrouping();
	const { u: author, alias } = useMessageAuthor();
	const { hasError } = useMessageStatus();
	const isEdited = useIsEdited();
	const { ts, unread, pinned, t: type } = useMessageMeta();
	const { isTranslated } = useMessageText();

	if (isHeader) {
		const username = (useRealName && author?.name) || author?.username;
		const aliasUsername = alias ? <Text style={[styles.alias, { color: colors.fontSecondaryInfo }]}> @{username}</Text> : null;
		const itsMe = author?._id === user?.id;

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
				<Pressable testID={`username-header-${username}`} style={styles.titleContainer} onPress={onUserPress}>
					<Text style={[styles.username, { color: colors.fontTitlesLabels }]} numberOfLines={1}>
						{textContent}
					</Text>
					{isLargeFontScale ? null : <MessageTime timeFormat={timeFormat} ts={ts as Date | undefined} />}
				</Pressable>
				<RightIcons
					type={type}
					isEdited={isEdited}
					hasError={hasError}
					isReadReceiptEnabled={isReadReceiptEnabled}
					unread={unread}
					pinned={pinned}
					isTranslated={isTranslated}
				/>
			</View>
		);
	}
	return null;
};

User.displayName = 'MessageUser';

export default User;
