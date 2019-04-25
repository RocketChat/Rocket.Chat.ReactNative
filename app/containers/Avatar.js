import React from 'react';
import PropTypes from 'prop-types';
import { View, ViewPropTypes } from 'react-native';
import FastImage from 'react-native-fast-image';

const Avatar = React.memo(({
	text, size, baseUrl, borderRadius, style, avatar, type, children, userId, token
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

	const uri = avatar || `${ baseUrl }/avatar/${ room }?format=png&width=${ uriSize }&height=${ uriSize }${ avatarAuthURLFragment }`;

	const image = (
		<FastImage
			style={avatarStyle}
			source={{
				uri,
				priority: FastImage.priority.high
			}}
		/>
	);

	return (
		<View style={[avatarStyle, style]}>
			{image}
			{children}
		</View>
	);
});

Avatar.propTypes = {
	baseUrl: PropTypes.string.isRequired,
	style: ViewPropTypes.style,
	text: PropTypes.string,
	avatar: PropTypes.string,
	size: PropTypes.number,
	borderRadius: PropTypes.number,
	type: PropTypes.string,
	children: PropTypes.object,
	userId: PropTypes.string,
	token: PropTypes.string
};

Avatar.defaultProps = {
	text: '',
	size: 25,
	type: 'd',
	borderRadius: 4
};

export default Avatar;
