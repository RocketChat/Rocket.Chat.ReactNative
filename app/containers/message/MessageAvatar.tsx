import React, { useContext } from 'react';

import Avatar from '../Avatar';
import styles from './styles';
import MessageContext from './Context';
import { IMessageAvatar } from './interfaces';
import { SubscriptionType } from '../../definitions';

const MessageAvatar = React.memo(({ isHeader, avatar, author, small, navToRoomInfo, emoji, getCustomEmoji }: IMessageAvatar) => {
	const { user } = useContext(MessageContext);
	if (isHeader && author) {
		const navParam = {
			t: SubscriptionType.DIRECT,
			rid: author._id
		};
		return (
			<Avatar
				style={small ? styles.avatarSmall : styles.avatar}
				text={avatar ? '' : author.username}
				size={small ? 20 : 36}
				borderRadius={4}
				onPress={author._id === user.id ? undefined : () => navToRoomInfo(navParam)}
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
