import React from 'react';

import Avatar from '../Avatar';
import styles from './styles';

const MessageAvatar = React.memo(({
	header, avatar, author, baseUrl, user, small
}) => {
	if (header) {
		return (
			<Avatar
				style={small ? styles.avatarSmall : styles.avatar}
				text={avatar ? '' : author.username}
				size={small ? 20 : 36}
				borderRadius={small ? 2 : 4}
				avatar={avatar}
				baseUrl={baseUrl}
				userId={user.id}
				token={user.token}
			/>
		);
	}
	return null;
});

export default MessageAvatar;
