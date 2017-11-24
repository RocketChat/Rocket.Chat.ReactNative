import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { emojify } from 'react-emojione';
import Markdown from 'react-native-easy-markdown'; // eslint-disable-line
import { connect } from 'react-redux';

import { actionsShow } from '../../actions/messages';
import Card from './Card';
import User from './User';
import Avatar from '../Avatar';

const styles = StyleSheet.create({
	content: {
		flexGrow: 1,
		flexShrink: 1
	},
	message: {
		padding: 12,
		paddingTop: 6,
		paddingBottom: 6,
		flexDirection: 'row',
		transform: [{ scaleY: -1 }]
	},
	textInfo: {
		fontStyle: 'italic',
		color: '#a0a0a0'
	},
	editing: {
		backgroundColor: '#fff5df'
	}
});

@connect(state => ({
	message: state.messages.message,
	editing: state.messages.editing
}), dispatch => ({
	actionsShow: actionMessage => dispatch(actionsShow(actionMessage))
}))
export default class Message extends React.Component {
	static propTypes = {
		item: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		Message_TimeFormat: PropTypes.string.isRequired,
		message: PropTypes.object.isRequired,
		editing: PropTypes.bool,
		actionsShow: PropTypes.func
	}

	onLongPress() {
		const { item } = this.props;
		this.props.actionsShow(JSON.parse(JSON.stringify(item)));
	}

	isDeleted() {
		return !this.props.item.msg;
	}

	attachments() {
		return this.props.item.attachments.length ? (
			<Card
				data={this.props.item.attachments[0]}
			/>
		) : null;
	}

	renderMessageContent() {
		if (this.isDeleted()) {
			return <Text style={styles.textInfo}>Message removed</Text>;
		}

		const msg = emojify(this.props.item.msg, { output: 'unicode' });
		return (
			<Markdown>
				{msg}
			</Markdown>
		);
	}

	render() {
		const {
			item, message, editing
		} = this.props;

		const extraStyle = {};
		if (item.temp) {
			extraStyle.opacity = 0.3;
		}

		const username = item.alias || item.u.username;
		const isEditing = message._id === item._id && editing;

		return (
			<TouchableOpacity
				onLongPress={() => this.onLongPress()}
				disabled={this.isDeleted()}
				style={[styles.message, extraStyle, isEditing ? styles.editing : null]}
			>
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
						baseUrl={this.props.baseUrl}
					/>
					{this.attachments()}
					{this.renderMessageContent(item)}
				</View>
			</TouchableOpacity>
		);
	}
}
