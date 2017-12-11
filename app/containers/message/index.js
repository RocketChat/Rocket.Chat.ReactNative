import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { connect } from 'react-redux';
import moment from 'moment';

import { actionsShow } from '../../actions/messages';
import Image from './Image';
import User from './User';
import Avatar from '../Avatar';
import Audio from './Audio';
import Video from './Video';
import Markdown from './Markdown';
import Url from './Url';
import Reply from './Reply';

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
		user: PropTypes.object.isRequired,
		editing: PropTypes.bool,
		actionsShow: PropTypes.func
	}

	onLongPress() {
		const { item } = this.props;
		this.props.actionsShow(JSON.parse(JSON.stringify(item)));
	}

	isDeleted() {
		return this.props.item.t === 'rm';
	}

	isPinned() {
		return this.props.item.t === 'message_pinned';
	}

	attachments() {
		if (this.props.item.attachments.length === 0) {
			return null;
		}

		const file = this.props.item.attachments[0];
		const { baseUrl, user } = this.props;
		if (file.image_type) {
			return <Image file={file} baseUrl={baseUrl} user={user} />;
		} else if (file.audio_type) {
			return <Audio file={file} baseUrl={baseUrl} user={user} />;
		} else if (file.video_type) {
			return <Video file={file} baseUrl={baseUrl} user={user} />;
		}

		return <Reply attachment={file} timeFormat={this.props.Message_TimeFormat} />;
	}

	renderMessageContent() {
		if (this.isDeleted()) {
			return <Text style={styles.textInfo}>Message removed</Text>;
		} else if (this.isPinned()) {
			return <Text style={styles.textInfo}>Message pinned</Text>;
		}
		return <Markdown msg={this.props.item.msg} />;
	}

	renderUrl() {
		if (this.props.item.urls.length === 0) {
			return null;
		}

		return this.props.item.urls.map(url => (
			<Url url={url} key={url._id} />
		));
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

		const accessibilityLabel = `Message from ${ item.alias || item.u.username } at ${ moment(item.ts).format(this.props.Message_TimeFormat) }, ${ this.props.item.msg }`;

		return (
			<TouchableOpacity
				onLongPress={() => this.onLongPress()}
				disabled={this.isDeleted()}
				style={[styles.message, extraStyle, isEditing ? styles.editing : null]}
				accessibilityLabel={accessibilityLabel}
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
					{this.renderMessageContent()}
					{this.attachments()}
					{this.renderUrl()}
				</View>
			</TouchableOpacity>
		);
	}
}
