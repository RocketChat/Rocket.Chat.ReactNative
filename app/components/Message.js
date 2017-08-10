import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import { CachedImage } from 'react-native-img-cache';
import Markdown from 'react-native-easy-markdown';
import { emojify } from 'react-emojione';

const styles = StyleSheet.create({
	message: {
		padding: 12,
		paddingTop: 6,
		paddingBottom: 6,
		flexDirection: 'row',
		transform: [{ scaleY: -1 }]
	},
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
	},
	texts: {
		flex: 1
	},
	msg: {
		flex: 1
	},
	username: {
		fontWeight: 'bold',
		marginBottom: 5
	}
});

const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'];

export default class Message extends React.PureComponent {
	static propTypes = {
		item: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired
	}

	render() {
		const extraStyle = {};
		if (this.props.item.temp) {
			extraStyle.opacity = 0.3;
		}

		const msg = emojify(this.props.item.msg || 'asd', { output: 'unicode' });

		let username = this.props.item.u.username;
		const position = username.length % colors.length;

		const color = colors[position];
		username = username.replace(/[^A-Za-z0-9]/g, '.').replace(/\.+/g, '.').replace(/(^\.)|(\.$)/g, '');

		const usernameParts = username.split('.');

		let initials = usernameParts.length > 1 ? usernameParts[0][0] + usernameParts[usernameParts.length - 1][0] : username.replace(/[^A-Za-z0-9]/g, '').substr(0, 2);
		initials = initials.toUpperCase();

		return (
			<View style={[styles.message, extraStyle]}>
				<View style={[styles.avatarContainer, { backgroundColor: color }]}>
					<Text style={styles.avatarInitials}>{initials}</Text>
					<CachedImage style={styles.avatar} source={{ uri: `${ this.props.baseUrl }/avatar/${ this.props.item.u.username }` }} />
				</View>
				<View style={styles.texts}>
					<Text onPress={this._onPress} style={styles.username}>
						{this.props.item.u.username}
					</Text>
					<Markdown>
						{msg}
					</Markdown>
				</View>
			</View>
		);
	}
}
