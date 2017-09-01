import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import { emojify } from 'react-emojione';
import Markdown from 'react-native-easy-markdown';
import moment from 'moment';
import Avatar from './avatar';
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

		const time = moment(item.ts).format(this.props.Message_TimeFormat);

		return (
			<View style={[styles.message, extraStyle]}>
				<Avatar style={{ marginRight: 10 }} text={item.avatar ? '' : username} size={40} baseUrl={this.props.baseUrl} avatar={item.avatar} />
				<View style={[styles.content]}>
					<View style={styles.usernameView}>
						<Text onPress={this._onPress} style={styles.username}>
							{username}
						</Text>
						{item.alias && <Text style={styles.alias}>@{item.u.username}</Text>}<Text style={styles.time}>{time}</Text>
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
