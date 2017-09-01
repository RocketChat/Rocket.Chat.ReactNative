import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import { CachedImage } from 'react-native-img-cache';

import avatarInitialsAndColor from '../../utils/avatarInitialsAndColor';

const styles = StyleSheet.create({
	avatarContainer: {
		backgroundColor: '#eee',
		width: 40,
		height: 40,
		marginRight: 10,
		borderRadius: 5
	},
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 5,
		position: 'absolute'
	},
	avatarInitials: {
		margin: 2,
		textAlign: 'center',
		lineHeight: 36,
		fontSize: 22,
		color: '#ffffff'
	}
});

export default class Message extends React.PureComponent {
	static propTypes = {
		item: PropTypes.object.isRequired,
		baseUrl: PropTypes.string
	}

	render() {
		const { item } = this.props;

		const username = item.alias || item.u.username;

		const { initials, color } = avatarInitialsAndColor(username);

		const avatar = item.avatar || `${ this.props.baseUrl }/avatar/${ item.u.username }`;
		const avatarInitials = item.avatar ? '' : initials;
		const avatarColor = item.avatar ? 'transparent' : color;

		return (
			<View style={[styles.avatarContainer, { backgroundColor: avatarColor }]}>
				<Text style={styles.avatarInitials}>{avatarInitials}</Text>
				<CachedImage style={styles.avatar} source={{ uri: avatar }} />
			</View>
		);
	}
}
