import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet } from 'react-native';
import { emojify } from 'react-emojione';
import Markdown from 'react-native-easy-markdown';

import Card from './message/Card';
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

		return (
			<View style={[styles.message, extraStyle]}>
				<Avatar
					style={{ marginRight: 10 }}
					text={item.avatar ? '' : username}
					size={40}
					baseUrl={this.props.baseUrl}
					avatar={item.avatar}
				/>
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
