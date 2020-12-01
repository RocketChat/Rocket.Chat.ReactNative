import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import FastImage from '@rocket.chat/react-native-fast-image';
import Touchable from 'react-native-platform-touchable';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { avatarURL } from '../../utils/avatar';
import Emoji from '../markdown/Emoji';

const Avatar = React.memo(({
	text,
	size,
	server,
	borderRadius,
	style,
	avatar,
	type,
	children,
	user,
	onPress,
	emoji,
	theme,
	getCustomEmoji,
	avatarETag,
	isStatic,
	rid,
	blockUnauthenticatedAccess,
	serverVersion
}) => {
	if ((!text && !avatar && !emoji && !rid) || !server) {
		return null;
	}

	const avatarStyle = {
		width: size,
		height: size,
		borderRadius
	};

	let image;
	if (emoji) {
		image = (
			<Emoji
				theme={theme}
				baseUrl={server}
				getCustomEmoji={getCustomEmoji}
				isMessageContainsOnlyEmoji
				literal={emoji}
				style={avatarStyle}
			/>
		);
	} else {
		let uri = avatar;
		if (!isStatic) {
			uri = avatarURL({
				type,
				text,
				size,
				user,
				avatar,
				server,
				avatarETag,
				serverVersion,
				rid,
				blockUnauthenticatedAccess
			});
		}

		image = (
			<FastImage
				style={avatarStyle}
				source={{
					uri,
					headers: RocketChatSettings.customHeaders,
					priority: FastImage.priority.high
				}}
			/>
		);
	}

	if (onPress) {
		image = (
			<Touchable onPress={onPress}>
				{image}
			</Touchable>
		);
	}


	return (
		<View style={[avatarStyle, style]}>
			{image}
			{children}
		</View>
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
	getCustomEmoji: PropTypes.func,
	avatarETag: PropTypes.string,
	isStatic: PropTypes.bool,
	rid: PropTypes.string,
	blockUnauthenticatedAccess: PropTypes.bool,
	serverVersion: PropTypes.string
};

Avatar.defaultProps = {
	text: '',
	size: 25,
	type: 'd',
	borderRadius: 4
};

export default Avatar;
