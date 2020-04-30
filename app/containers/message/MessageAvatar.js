import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import Avatar from '../Avatar';
import styles from './styles';
import MessageContext from './Context';

const MessageAvatar = React.memo(({
	isHeader, avatar, author, baseUrl, user, small, navToRoomInfo, getCustomEmoji, theme, emoji
}) => {
	const { baseUrl, user } = useContext(MessageContext);
	if (isHeader && author) {
		const navParam = {
			t: 'd',
			rid: author._id
		};
		return (
			<TouchableOpacity
				onPress={() => navToRoomInfo(navParam)}
				disabled={author._id === user.id}
			>
				<Avatar
					style={small ? styles.avatarSmall : styles.avatar}
					text={avatar ? '' : author.username}
					size={small ? 20 : 36}
					borderRadius={small ? 2 : 4}
					avatar={avatar}
					emoji={emoji}
					theme={theme}
					baseUrl={baseUrl}
					userId={user.id}
					token={user.token}
					getCustomEmoji={getCustomEmoji}
				/>
			</TouchableOpacity>
		);
	}
	return null;
});

MessageAvatar.propTypes = {
	isHeader: PropTypes.bool,
	avatar: PropTypes.string,
	emoji: PropTypes.string,
	theme: PropTypes.string,
	author: PropTypes.obj,
	small: PropTypes.bool,
	navToRoomInfo: PropTypes.func,
	getCustomEmoji: PropTypes.func
};
MessageAvatar.displayName = 'MessageAvatar';

export default MessageAvatar;
