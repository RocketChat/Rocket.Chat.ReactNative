import React from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity } from 'react-native';

import Avatar from '../Avatar';
import styles from './styles';

const MessageAvatar = React.memo(({
	isHeader, avatar, author, baseUrl, user, small, navToRoomInfo
}) => {
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
					baseUrl={baseUrl}
					userId={user.id}
					token={user.token}
				/>
			</TouchableOpacity>
		);
	}
	return null;
});

MessageAvatar.propTypes = {
	isHeader: PropTypes.bool,
	avatar: PropTypes.string,
	author: PropTypes.obj,
	baseUrl: PropTypes.string,
	user: PropTypes.obj,
	small: PropTypes.bool,
	navToRoomInfo: PropTypes.func
};
MessageAvatar.displayName = 'MessageAvatar';

export default MessageAvatar;
