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
		children: PropTypes.object
	}

	static defaultProps = {
		text: '',
		size: 25,
		type: 'd',
		borderRadius: 4
	}

	render() {
		const {
			text, size, baseUrl, borderRadius, style, avatar, type, children
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
		const uri = avatar || `${ baseUrl }/avatar/${ room }?format=png&width=${ uriSize }&height=${ uriSize }`;

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
