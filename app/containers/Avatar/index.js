import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import FastImage from '@rocket.chat/react-native-fast-image';
import Touchable from 'react-native-platform-touchable';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import { Q } from '@nozbe/watermelondb';

import database from '../../lib/database';
import { avatarURL } from '../../utils/avatar';
import { getUserSelector } from '../../selectors/login';
import Emoji from '../markdown/Emoji';

const Avatar = React.memo(({
	text, size, server, borderRadius, style, avatar, type, children, user, onPress, emoji, theme, getCustomEmoji
}) => {
	if ((!text && !avatar) || !server) {
		return null;
	}

	const [avatarETag, setAvatarETag] = useState();

	const subscribeAvatar = async() => {
		if (type === 'd') {
			const db = database.active;
			const usersCollection = db.collections.get('users');
			try {
				const [userRecord] = await usersCollection.query(Q.where('username', text)).fetch();
				if (userRecord) {
					const observable = userRecord.observe();
					observable.subscribe((u) => {
						setAvatarETag(u.avatarETag);
					});
				}
			} catch {
				// Do nothing
			}
		}
	};

	useEffect(() => {
		subscribeAvatar();
	}, []);

	const avatarStyle = {
		width: size,
		height: size,
		borderRadius
	};

	if (emoji) {
		return (
			<Touchable style={[avatarStyle, style]} disabled={!onPress} onPress={onPress}>
				<Emoji
					theme={theme}
					baseUrl={server}
					getCustomEmoji={getCustomEmoji}
					isMessageContainsOnlyEmoji
					literal={emoji}
				/>
			</Touchable>
		);
	}

	const uri = avatarURL({
		type,
		text,
		size,
		user,
		avatar,
		server,
		avatarETag
	});

	return (
		<Touchable style={[avatarStyle, style]} disabled={!onPress} onPress={onPress}>
			<>
				<FastImage
					style={avatarStyle}
					source={{
						uri,
						headers: RocketChatSettings.customHeaders,
						priority: FastImage.priority.high
					}}
				/>
				{children}
			</>
		</Touchable>
	);
});

Avatar.propTypes = {
	server: PropTypes.string,
	style: PropTypes.any,
	text: PropTypes.string,
	avatar: PropTypes.string,
	emoji: PropTypes.string,
	size: PropTypes.number,
	borderRadius: PropTypes.number,
	type: PropTypes.string,
	children: PropTypes.object,
	user: PropTypes.shape({
		id: PropTypes.string,
		token: PropTypes.string
	}),
	theme: PropTypes.string,
	onPress: PropTypes.func,
	getCustomEmoji: PropTypes.func
};

Avatar.defaultProps = {
	text: '',
	size: 25,
	type: 'd',
	borderRadius: 4
};

const mapStateToProps = state => ({
	user: getUserSelector(state),
	server: state.share.server || state.server.server
});
export default connect(mapStateToProps)(Avatar);
