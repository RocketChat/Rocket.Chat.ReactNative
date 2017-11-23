import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Clipboard } from 'react-native';
import { emojify } from 'react-emojione';
import Markdown from 'react-native-easy-markdown'; // eslint-disable-line
import ActionSheet from 'react-native-actionsheet';
import { connect } from 'react-redux';
import * as moment from 'moment';

import Card from './Card';
import User from './User';
import Avatar from '../Avatar';
import {
	deleteRequest,
	editInit,
	starRequest,
	permalinkRequest,
	permalinkClear,
	togglePinRequest,
	setInput
} from '../../actions/messages';

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
	permalink: state.messages.permalink,
	user: state.login.user,
	Message_AllowDeleting: state.settings.Message_AllowDeleting,
	Message_AllowDeleting_BlockDeleteInMinutes: state.settings.Message_AllowDeleting_BlockDeleteInMinutes,
	Message_AllowEditing: state.settings.Message_AllowEditing,
	Message_AllowEditing_BlockEditInMinutes: state.settings.Message_AllowEditing_BlockEditInMinutes,
	Message_AllowPinning: state.settings.Message_AllowPinning,
	Message_AllowStarring: state.settings.Message_AllowStarring
}), dispatch => ({
	deleteRequest: message => dispatch(deleteRequest(message)),
	editInit: message => dispatch(editInit(message)),
	starRequest: message => dispatch(starRequest(message)),
	permalinkRequest: message => dispatch(permalinkRequest(message)),
	togglePinRequest: message => dispatch(togglePinRequest(message)),
	setInput: message => dispatch(setInput(message)),
	permalinkClear: () => dispatch(permalinkClear())
}))
export default class Message extends React.Component {
	static propTypes = {
		item: PropTypes.object.isRequired,
		room: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		Message_TimeFormat: PropTypes.string.isRequired,
		deleteRequest: PropTypes.func.isRequired,
		editInit: PropTypes.func.isRequired,
		starRequest: PropTypes.func.isRequired,
		permalinkRequest: PropTypes.func.isRequired,
		permalinkClear: PropTypes.func.isRequired,
		togglePinRequest: PropTypes.func.isRequired,
		setInput: PropTypes.func.isRequired,
		user: PropTypes.object.isRequired,
		message: PropTypes.object,
		permalink: PropTypes.string,
		Message_AllowDeleting: PropTypes.bool,
		Message_AllowDeleting_BlockDeleteInMinutes: PropTypes.number,
		Message_AllowEditing: PropTypes.bool,
		Message_AllowEditing_BlockEditInMinutes: PropTypes.number,
		Message_AllowPinning: PropTypes.bool,
		Message_AllowStarring: PropTypes.bool,
		hasEditPermission: PropTypes.bool,
		hasDeletePermission: PropTypes.bool,
		hasForceDeletePermission: PropTypes.bool
	}

	constructor(props) {
		super(props);
		this.state = {
			copyPermalink: false,
			reply: false,
			quote: false
		};
		this.handleActionPress = this.handleActionPress.bind(this);
		this.showActions = this.showActions.bind(this);
		// Cancel
		this.options = ['Cancel'];
		this.CANCEL_INDEX = 0;
		// Reply
		this.options.push('Reply');
		this.REPLY_INDEX = this.options.length - 1;
		// Edit
		if (this.allowEdit()) {
			this.options.push('Edit');
			this.EDIT_INDEX = this.options.length - 1;
		}
		// Permalink
		this.options.push('Copy Permalink');
		this.PERMALINK_INDEX = this.options.length - 1;
		// Copy
		this.options.push('Copy Message');
		this.COPY_INDEX = this.options.length - 1;
		// Quote
		this.options.push('Quote');
		this.QUOTE_INDEX = this.options.length - 1;
		// Star
		if (this.props.Message_AllowStarring) {
			this.options.push('Star Message');
			this.STAR_INDEX = this.options.length - 1;
		}
		// Pin
		if (this.props.Message_AllowPinning) {
			this.options.push('Pin Message');
			this.PIN_INDEX = this.options.length - 1;
		}
		// Delete
		if (this.allowDelete()) {
			this.options.push('Delete');
			this.DELETE_INDEX = this.options.length - 1;
		}
	}

	async componentWillReceiveProps(nextProps) {
		if (this.props.permalink !== nextProps.permalink && nextProps.permalink) {
			// copy permalink
			if (this.state.copyPermalink) {
				this.setState({ copyPermalink: false });
				await Clipboard.setString(nextProps.permalink);
				Alert.alert('Permalink copied to clipboard!');
				this.props.permalinkClear();
			// quote
			} else if (this.state.quote) {
				this.setState({ quote: false });
				const msg = `[ ](${ nextProps.permalink }) `;
				this.props.setInput({ msg });

			// reply
			} else if (this.state.reply) {
				this.setState({ reply: false });
				let msg = `[ ](${ nextProps.permalink }) `;

				// if original message wasn't sent by current user and neither from a direct room
				if (this.props.user.username !== this.props.item.u.username && this.props.room.t !== 'd') {
					msg += `@${ this.props.item.u.username } `;
				}
				this.props.setInput({ msg });
			}
		}
	}

	isOwn = () => this.props.item.u && this.props.item.u._id === this.props.user.id;

	allowEdit = () => {
		const editOwn = this.isOwn();
		const { Message_AllowEditing: isEditAllowed, hasEditPermission } = this.props;
		if (!(hasEditPermission || (isEditAllowed && editOwn))) {
			return false;
		}
		const blockEditInMinutes = this.props.Message_AllowEditing_BlockEditInMinutes;
		if (blockEditInMinutes) {
			let msgTs;
			if (this.props.item.ts != null) {
				msgTs = moment(this.props.item.ts);
			}
			let currentTsDiff;
			if (msgTs != null) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockEditInMinutes;
		}
		return true;
	}

	allowDelete = () => {
		const deleteOwn = this.isOwn();
		const { hasDeletePermission, hasForceDeletePermission, Message_AllowDeleting: isDeleteAllowed } = this.props;
		if (!(hasDeletePermission || (isDeleteAllowed && deleteOwn) || this.props.hasForceDeletePermission)) {
			return false;
		}
		if (hasForceDeletePermission) {
			return true;
		}
		const blockDeleteInMinutes = this.props.Message_AllowDeleting_BlockDeleteInMinutes;
		if (blockDeleteInMinutes != null && blockDeleteInMinutes !== 0) {
			let msgTs;
			if (this.props.item.ts != null) {
				msgTs = moment(this.props.item.ts);
			}
			let currentTsDiff;
			if (msgTs != null) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockDeleteInMinutes;
		}
		return true;
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

	showActions = () => {
		this.ActionSheet.show();
	}

	handleDelete() {
		Alert.alert(
			'Are you sure?',
			'You will not be able to recover this message!',
			[
				{
					text: 'Cancel',
					style: 'cancel'
				},
				{
					text: 'Yes, delete it!',
					style: 'destructive',
					onPress: () => this.props.deleteRequest(this.props.item)
				}
			],
			{ cancelable: false }
		);
	}

	handleEdit() {
		const { _id, msg, rid } = this.props.item;
		this.props.editInit({ _id, msg, rid });
	}

	handleCopy = async() => {
		await Clipboard.setString(this.props.item.msg);
		Alert.alert('Copied to clipboard!');
	}

	handleStar() {
		this.props.starRequest(this.props.item);
	}

	handlePermalink() {
		this.setState({ copyPermalink: true });
		this.props.permalinkRequest(this.props.item);
	}

	handlePin() {
		this.props.togglePinRequest(this.props.item);
	}

	handleReply() {
		this.setState({ reply: true });
		this.props.permalinkRequest(this.props.item);
	}

	handleQuote() {
		this.setState({ quote: true });
		this.props.permalinkRequest(this.props.item);
	}

	handleActionPress = (actionIndex) => {
		switch (actionIndex) {
			case this.REPLY_INDEX:
				this.handleReply();
				break;
			case this.EDIT_INDEX:
				this.handleEdit();
				break;
			case this.PERMALINK_INDEX:
				this.handlePermalink();
				break;
			case this.COPY_INDEX:
				this.handleCopy();
				break;
			case this.QUOTE_INDEX:
				this.handleQuote();
				break;
			case this.STAR_INDEX:
				this.handleStar();
				break;
			case this.PIN_INDEX:
				this.handlePin();
				break;
			case this.DELETE_INDEX:
				this.handleDelete();
				break;
			default:
				break;
		}
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
		const { item } = this.props;

		const extraStyle = {};
		if (item.temp) {
			extraStyle.opacity = 0.3;
		}

		const username = item.alias || item.u.username;
		const isEditing = this.props.message._id === item._id;

		return (
			<TouchableOpacity
				onLongPress={() => this.showActions()}
				disabled={this.isDeleted()}
				style={isEditing ? styles.editing : null}
			>
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
							baseUrl={this.props.baseUrl}
						/>
						{this.attachments()}
						{this.renderMessageContent(item)}
					</View>
					<ActionSheet
						ref={o => this.ActionSheet = o}
						title='Messages actions'
						options={this.options}
						cancelButtonIndex={this.CANCEL_INDEX}
						destructiveButtonIndex={this.DELETE_INDEX}
						onPress={this.handleActionPress}
					/>
				</View>
			</TouchableOpacity>
		);
	}
}
