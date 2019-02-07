import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { View, ViewPropTypes } from 'react-native';
import FastImage from 'react-native-fast-image';

export default class Avatar extends PureComponent {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		style: ViewPropTypes.style,
		text: PropTypes.string,
		avatar: PropTypes.string,
		size: PropTypes.number,
		borderRadius: PropTypes.number,
		type: PropTypes.string,
		children: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		})
	}

	static defaultProps = {
		text: '',
		size: 25,
		type: 'd',
		borderRadius: 4
	}

	render() {
		const {
			text, size, baseUrl, borderRadius, style, avatar, type, children, user
		} = this.props;

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
		if (user && user.id && user.token) {
			avatarAuthURLFragment = `&rc_token=${ user.token }&rc_uid=${ user.id }`;
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
	}
}
