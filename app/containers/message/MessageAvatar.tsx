import React, { useContext } from 'react';
import { useWindowDimensions } from 'react-native';

import Avatar from '../Avatar';
import styles from './styles';
import MessageContext from './Context';
import { IMessageAvatar } from './interfaces';
import { SubscriptionType } from '../../definitions';

const MessageAvatar = React.memo(({ isHeader, avatar, author, small, navToRoomInfo, emoji, getCustomEmoji }: IMessageAvatar) => {
	const { user } = useContext(MessageContext);
	const { fontScale } = useWindowDimensions();

	if (isHeader && author) {
		const onPress = () =>
			navToRoomInfo({
				t: SubscriptionType.DIRECT,
				rid: author._id,
				itsMe: author._id === user.id
			});
		const smallSize = 20 * fontScale;
		const normalSize = 36 * fontScale;
		const size = small ? smallSize : normalSize;
		return (
			<Avatar
				style={small ? styles.avatarSmall : styles.avatar}
				text={avatar ? '' : author.username}
				size={size}
				borderRadius={4}
				onPress={onPress}
				getCustomEmoji={getCustomEmoji}
				avatar={avatar}
				emoji={emoji}
			/>
		);
	}
	return null;
});

MessageAvatar.displayName = 'MessageAvatar';

export default MessageAvatar;
