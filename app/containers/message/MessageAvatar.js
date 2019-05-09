import React from 'react';
import PropTypes from 'prop-types';

import Avatar from '../Avatar';
import styles from './styles';

const MessageAvatar = React.memo(({
	isHeader, avatar, author, baseUrl, user, small
}) => {
	if (isHeader) {
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
}, () => true);

MessageAvatar.propTypes = {
	isHeader: PropTypes.bool,
	avatar: PropTypes.string,
	author: PropTypes.obj,
	baseUrl: PropTypes.string,
	user: PropTypes.obj,
	small: PropTypes.bool
};
MessageAvatar.displayName = 'MessageAvatar';

export default MessageAvatar;
