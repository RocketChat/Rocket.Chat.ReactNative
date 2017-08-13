import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import { CachedImage } from 'react-native-img-cache';
import { emojify } from 'react-emojione';
import Markdown from 'react-native-easy-markdown';
import avatarInitialsAndColor from '../utils/avatarInitialsAndColor';

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

		const msg = emojify(this.props.item.msg, { output: 'unicode' });

		const username = this.props.item.alias || this.props.item.u.username;

		let { initials, color } = avatarInitialsAndColor(username);

		const avatar = this.props.item.avatar || `${ this.props.baseUrl }/avatar/${ this.props.item.u.username }`;
		if (this.props.item.avatar) {
			initials = '';
			color = 'transparent';
		}

		return (
			<View style={[styles.message, extraStyle]}>
				<View style={[styles.avatarContainer, { backgroundColor: color }]}>
					<Text style={styles.avatarInitials}>{initials}</Text>
					<CachedImage style={styles.avatar} source={{ uri: avatar }} />
				</View>
				<View style={styles.texts}>
					<Text onPress={this._onPress} style={styles.username}>
						{username}
					</Text>
					<Markdown>
						{msg}
					</Markdown>
				</View>
			</View>
		);
	}
}
