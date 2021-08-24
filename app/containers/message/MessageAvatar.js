import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import Avatar from '../Avatar';
import styles from './styles';
import MessageContext from './Context';

const MessageAvatar = React.memo(({
	isHeader, avatar, author, small, navToRoomInfo, emoji, getCustomEmoji, theme
}) => {
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
});

MessageAvatar.propTypes = {
	isHeader: PropTypes.bool,
	avatar: PropTypes.string,
	emoji: PropTypes.string,
	author: PropTypes.obj,
	small: PropTypes.bool,
	navToRoomInfo: PropTypes.func,
	getCustomEmoji: PropTypes.func,
	theme: PropTypes.string
};
MessageAvatar.displayName = 'MessageAvatar';

export default MessageAvatar;
