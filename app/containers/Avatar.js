import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Touch from '../utils/touch';

const formatUrl = (url, baseUrl, uriSize, avatarAuthURLFragment) => (
	`${ baseUrl }${ url }?format=png&width=${ uriSize }&height=${ uriSize }${ avatarAuthURLFragment }`
);

const Avatar = React.memo(({
	text, size, baseUrl, borderRadius, style, avatar, type, children, userId, token, onPress, theme
}) => {
	const avatarStyle = {
		width: size,
		height: size,
		borderRadius
	};

	if (!text && !avatar) {
		return null;
	}

	const room = type === 'd' ? text : `@${ text }`;

	// Avoid requesting several sizes by having only two sizes on cache
	const uriSize = size === 100 ? 100 : 50;

	let avatarAuthURLFragment = '';
	if (userId && token) {
		avatarAuthURLFragment = `&rc_token=${ token }&rc_uid=${ userId }`;
	}


	let uri;
	if (avatar) {
		uri = avatar.includes('http') ? avatar : formatUrl(avatar, baseUrl, uriSize, avatarAuthURLFragment);
	} else {
		uri = formatUrl(`/avatar/${ room }`, baseUrl, uriSize, avatarAuthURLFragment);
	}


	let image = (
		<FastImage
			style={avatarStyle}
			source={{
				uri,
				priority: FastImage.priority.high
			}}
		/>
	);

	if (onPress) {
		image = (
			<Touch onPress={onPress} theme={theme}>
				{image}
			</Touch>
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
	size: PropTypes.number,
	borderRadius: PropTypes.number,
	type: PropTypes.string,
	children: PropTypes.object,
	userId: PropTypes.string,
	token: PropTypes.string,
	theme: PropTypes.string,
	onPress: PropTypes.func
};

Avatar.defaultProps = {
	text: '',
	size: 25,
	type: 'd',
	borderRadius: 4
};

export default Avatar;
