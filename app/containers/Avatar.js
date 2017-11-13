import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';
import { CachedImage } from 'react-native-img-cache';
import avatarInitialsAndColor from '../utils/avatarInitialsAndColor';

const styles = StyleSheet.create({
	iconContainer: {
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center'
	},
	avatar: {
		position: 'absolute'
	},
	avatarInitials: {
		color: '#ffffff'
	}
});

class Avatar extends React.PureComponent {
	render() {
		const {
			text = '', size = 25, baseUrl, borderRadius = 5, style, avatar
		} = this.props;
		const { initials, color } = avatarInitialsAndColor(`${ text }`);

		const iconContainerStyle = {
			backgroundColor: color,
			width: size,
			height: size,
			borderRadius
		};

		const avatarInitialsStyle = {
			fontSize: size / 2
		};

		const avatarStyle = {
			width: size,
			height: size,
			borderRadius
		};

		const uri = avatar || `${ baseUrl }/avatar/${ text }`;
		const image = (avatar || baseUrl) && (
			<CachedImage
				style={[styles.avatar, avatarStyle]}
				source={{ uri }}
			/>
		);

		return (
			<View style={[styles.iconContainer, iconContainerStyle, style]}>
				<Text style={[styles.avatarInitials, avatarInitialsStyle]}>{initials}</Text>
				{image}
			</View>);
	}
}

Avatar.propTypes = {
	style: PropTypes.object,
	baseUrl: PropTypes.string,
	text: PropTypes.string.isRequired,
	avatar: PropTypes.string,
	size: PropTypes.number,
	borderRadius: PropTypes.number
};
export default Avatar;
