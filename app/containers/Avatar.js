import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import FastImage from '@rocket.chat/react-native-fast-image';
import Touchable from 'react-native-platform-touchable';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { avatarURL } from '../utils/avatar';
import Emoji from './markdown/Emoji';

const Avatar = React.memo(({
	text, size, baseUrl, borderRadius, style, avatar, type, children, userId, token, onPress, theme, emoji, getCustomEmoji
}) => {
	const avatarStyle = {
		width: size,
		height: size,
		borderRadius
	};

	if (!text && !avatar) {
		return null;
	}

	const uri = avatarURL({
		type, text, size, userId, token, avatar, baseUrl
	});

	let image = emoji ? (
		<Emoji
			theme={theme}
			baseUrl={baseUrl}
			getCustomEmoji={getCustomEmoji}
			isMessageContainsOnlyEmoji
			literal={emoji}
		/>
	) : (
		<FastImage
			style={avatarStyle}
			source={{
				uri,
				headers: RocketChatSettings.customHeaders,
				priority: FastImage.priority.high
			}}
		/>
	);

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
	baseUrl: PropTypes.string.isRequired,
	style: PropTypes.any,
	text: PropTypes.string,
	avatar: PropTypes.string,
	emoji: PropTypes.string,
	size: PropTypes.number,
	borderRadius: PropTypes.number,
	type: PropTypes.string,
	children: PropTypes.object,
	userId: PropTypes.string,
	token: PropTypes.string,
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

export default Avatar;
