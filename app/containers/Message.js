import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet } from 'react-native';
import { emojify } from 'react-emojione';
import Markdown from 'react-native-easy-markdown';

import Card from './message/card';
import Avatar from './message/Avatar';
import User from './message/User';

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

		return (
			<View style={[styles.message, extraStyle]}>
				<Avatar item={item} baseUrl={this.props.baseUrl} />
				<View style={[styles.content]}>
					<User
						onPress={this._onPress}
						item={item}
						Message_TimeFormat={this.props.Message_TimeFormat}
					/>
					{this.attachments()}
					<Markdown>
						{msg}
					</Markdown>
				</View>
			</View>
		);
	}
}
