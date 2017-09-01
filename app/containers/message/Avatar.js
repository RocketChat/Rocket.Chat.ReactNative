import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';
import { CachedImage } from 'react-native-img-cache';
import avatarInitialsAndColor from '../../utils/avatarInitialsAndColor';

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
		const { text = '', size = 25, baseUrl = this.props.baseUrl,
			borderRadius = 5, style, avatar } = this.props;
		const { initials, color } = avatarInitialsAndColor(`${ text }`);
		return (
			<View style={[styles.iconContainer, {
				backgroundColor: color,
				width: size,
				height: size,
				borderRadius
			}, style]}
			>
				<Text style={[styles.avatarInitials, { fontSize: size / 2 }]}>{initials}</Text>
				{(avatar || baseUrl) && <CachedImage
					style={[styles.avatar, {
						width: size,
						height: size
					}]}
					source={{ uri: avatar || `${ baseUrl }/avatar/${ text }` }}
				/>}
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
