import React, { useContext } from 'react';

import Avatar from '../Avatar';
import styles from './styles';
import MessageContext from './Context';
import { IMessageAvatar } from './interfaces';

const MessageAvatar = React.memo(
	({ isHeader, avatar, author, small, navToRoomInfo, emoji, getCustomEmoji, theme }: IMessageAvatar) => {
		const { user } = useContext(MessageContext);
		if (isHeader && author) {
			const navParam = {
				t: 'd',
				rid: author._id
			};
			return (
				<Avatar
					style={small ? styles.avatarSmall : styles.avatar}
					text={avatar ? '' : author.username}
					size={small ? 20 : 36}
					borderRadius={small ? 2 : 4}
					onPress={author._id === user.id ? undefined : () => navToRoomInfo(navParam)}
					getCustomEmoji={getCustomEmoji}
					avatar={avatar}
					emoji={emoji}
					theme={theme}
				/>
			);
		}
		return null;
	}
);

MessageAvatar.displayName = 'MessageAvatar';

export default MessageAvatar;
