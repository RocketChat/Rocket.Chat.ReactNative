import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import { CachedImage } from 'react-native-img-cache';
import { emojify } from 'react-emojione';
import Markdown from 'react-native-easy-markdown';
import moment from 'moment';

import avatarInitialsAndColor from '../utils/avatarInitialsAndColor';
import Card from './message/card';

const styles = StyleSheet.create({
	content: {
		flexGrow: 1
	},
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
		fontWeight: 'bold'
	},
	usernameView: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 2
	},
	alias: {
		fontSize: 10,
		color: '#888',
		paddingLeft: 5
	},
	time: {
		fontSize: 10,
		color: '#888',
		paddingLeft: 5
	}
});

export default class Message extends React.PureComponent {
	static propTypes = {
		item: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		Message_TimeFormat: PropTypes.string.isRequired
	}
	attachments() {
		return this.props.item.attachments.length ? <Card data={this.props.item.attachments[0]} /> : null;
	}
	render() {
		const { item } = this.props;

		const extraStyle = {};
		if (item.temp) {
			extraStyle.opacity = 0.3;
		}

		const msg = emojify(item.msg, { output: 'unicode' });

		const username = item.alias || item.u.username;

		let { initials, color } = avatarInitialsAndColor(username);

		const avatar = item.avatar || `${ this.props.baseUrl }/avatar/${ item.u.username }`;
		if (item.avatar) {
			initials = '';
			color = 'transparent';
		}

		let aliasUsername;
		if (item.alias) {
			aliasUsername = <Text style={styles.alias}>@{item.u.username}</Text>;
		}

		const time = moment(item.ts).format(this.props.Message_TimeFormat);

		return (
			<View style={[styles.message, extraStyle]}>
				<View style={[styles.avatarContainer, { backgroundColor: color }]}>
					<Text style={styles.avatarInitials}>{initials}</Text>
					<CachedImage style={styles.avatar} source={{ uri: avatar }} />
				</View>
				<View style={[styles.content]}>
					<View style={styles.usernameView}>
						<Text onPress={this._onPress} style={styles.username}>
							{username}
						</Text>
						{aliasUsername}<Text style={styles.time}>{time}</Text>
					</View>
					{this.attachments()}
					<Markdown>
						{msg}
					</Markdown>
				</View>
			</View>
		);
	}
}
