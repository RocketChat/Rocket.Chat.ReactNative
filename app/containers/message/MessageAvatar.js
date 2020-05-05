import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import Avatar from '../Avatar';
import styles from './styles';
import MessageContext from './Context';

const MessageAvatar = React.memo(({
	isHeader, avatar, author, small, navToRoomInfo
}) => {
	const { baseUrl, user } = useContext(MessageContext);
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
				avatar={avatar}
				baseUrl={baseUrl}
				userId={user.id}
				token={user.token}
			/>
		);
	}
	return null;
});

MessageAvatar.propTypes = {
	isHeader: PropTypes.bool,
	avatar: PropTypes.string,
	author: PropTypes.obj,
	small: PropTypes.bool,
	navToRoomInfo: PropTypes.func
};
MessageAvatar.displayName = 'MessageAvatar';

export default MessageAvatar;
