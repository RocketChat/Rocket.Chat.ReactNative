import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Clipboard, Vibration, Share } from 'react-native';
import { connect } from 'react-redux';
import ActionSheet from 'react-native-actionsheet';
import * as moment from 'moment';

import {
	deleteRequest,
	editInit,
	toggleStarRequest,
	togglePinRequest,
	setInput,
	actionsHide,
	toggleReactionPicker
} from '../actions/messages';
import { showToast } from '../utils/info';
import RocketChat from '../lib/rocketchat';
import I18n from '../i18n';

@connect(
	state => ({
		actionMessage: state.messages.actionMessage,
		Message_AllowDeleting: state.settings.Message_AllowDeleting,
		Message_AllowDeleting_BlockDeleteInMinutes: state.settings.Message_AllowDeleting_BlockDeleteInMinutes,
		Message_AllowEditing: state.settings.Message_AllowEditing,
		Message_AllowEditing_BlockEditInMinutes: state.settings.Message_AllowEditing_BlockEditInMinutes,
		Message_AllowPinning: state.settings.Message_AllowPinning,
		Message_AllowStarring: state.settings.Message_AllowStarring
	}),
	dispatch => ({
		actionsHide: () => dispatch(actionsHide()),
		deleteRequest: message => dispatch(deleteRequest(message)),
		editInit: message => dispatch(editInit(message)),
		toggleStarRequest: message => dispatch(toggleStarRequest(message)),
		togglePinRequest: message => dispatch(togglePinRequest(message)),
		setInput: message => dispatch(setInput(message)),
		toggleReactionPicker: message => dispatch(toggleReactionPicker(message))
	})
)
export default class MessageActions extends React.Component {
	static propTypes = {
		actionsHide: PropTypes.func.isRequired,
		room: PropTypes.object.isRequired,
		actionMessage: PropTypes.object,
		user: PropTypes.object.isRequired,
		deleteRequest: PropTypes.func.isRequired,
		editInit: PropTypes.func.isRequired,
		toggleStarRequest: PropTypes.func.isRequired,
		togglePinRequest: PropTypes.func.isRequired,
		setInput: PropTypes.func.isRequired,
		toggleReactionPicker: PropTypes.func.isRequired,
		Message_AllowDeleting: PropTypes.bool,
		Message_AllowDeleting_BlockDeleteInMinutes: PropTypes.number,
		Message_AllowEditing: PropTypes.bool,
		Message_AllowEditing_BlockEditInMinutes: PropTypes.number,
		Message_AllowPinning: PropTypes.bool,
		Message_AllowStarring: PropTypes.bool
	};

	constructor(props) {
		super(props);
		this.handleActionPress = this.handleActionPress.bind(this);
		this.setPermissions();

		// Cancel
		this.options = [I18n.t('Cancel')];
		this.CANCEL_INDEX = 0;

		// Reply
		if (!this.isRoomReadOnly()) {
			this.options.push(I18n.t('Reply'));
			this.REPLY_INDEX = this.options.length - 1;
		}

		// Edit
		if (this.allowEdit(props)) {
			this.options.push(I18n.t('Edit'));
			this.EDIT_INDEX = this.options.length - 1;
		}

		// Permalink
		this.options.push(I18n.t('Copy_Permalink'));
		this.PERMALINK_INDEX = this.options.length - 1;

		// Copy
		this.options.push(I18n.t('Copy_Message'));
		this.COPY_INDEX = this.options.length - 1;

		// Share
		this.options.push(I18n.t('Share_Message'));
		this.SHARE_INDEX = this.options.length - 1;

		// Quote
		if (!this.isRoomReadOnly()) {
			this.options.push(I18n.t('Quote'));
			this.QUOTE_INDEX = this.options.length - 1;
		}

		// Star
		if (this.props.Message_AllowStarring) {
			this.options.push(I18n.t(props.actionMessage.starred ? 'Unstar' : 'Star'));
			this.STAR_INDEX = this.options.length - 1;
		}

		// Pin
		if (this.props.Message_AllowPinning) {
			this.options.push(I18n.t(props.actionMessage.pinned ? 'Unpin' : 'Pin'));
			this.PIN_INDEX = this.options.length - 1;
		}

		// Reaction
		if (!this.isRoomReadOnly() || this.canReactWhenReadOnly()) {
			this.options.push(I18n.t('Add_Reaction'));
			this.REACTION_INDEX = this.options.length - 1;
		}

		// Delete
		if (this.allowDelete(props)) {
			this.options.push(I18n.t('Delete'));
			this.DELETE_INDEX = this.options.length - 1;
		}
		setTimeout(() => {
			this.ActionSheet.show();
			Vibration.vibrate(50);
		});
	}

	setPermissions() {
		const permissions = ['edit-message', 'delete-message', 'force-delete-message'];
		const result = RocketChat.hasPermission(permissions, this.props.room.rid);
		this.hasEditPermission = result[permissions[0]];
		this.hasDeletePermission = result[permissions[1]];
		this.hasForceDeletePermission = result[permissions[2]];
	}

	getPermalink = async(message) => {
		try {
			return await RocketChat.getPermalink(message);
		} catch (error) {
			return null;
		}
	}

	isOwn = props => props.actionMessage.u && props.actionMessage.u._id === props.user.id;

	isRoomReadOnly = () => this.props.room.ro;

	canReactWhenReadOnly = () => this.props.room.reactWhenReadOnly;

	allowEdit = (props) => {
		if (this.isRoomReadOnly()) {
			return false;
		}
		const editOwn = this.isOwn(props);
		const { Message_AllowEditing: isEditAllowed } = this.props;
		if (!(this.hasEditPermission || (isEditAllowed && editOwn))) {
			return false;
		}
		const blockEditInMinutes = this.props.Message_AllowEditing_BlockEditInMinutes;
		if (blockEditInMinutes) {
			let msgTs;
			if (props.actionMessage.ts != null) {
				msgTs = moment(props.actionMessage.ts);
			}
			let currentTsDiff;
			if (msgTs != null) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockEditInMinutes;
		}
		return true;
	}

	allowDelete = (props) => {
		if (this.isRoomReadOnly()) {
			return false;
		}
		const deleteOwn = this.isOwn(props);
		const { Message_AllowDeleting: isDeleteAllowed } = this.props;
		if (!(this.hasDeletePermission || (isDeleteAllowed && deleteOwn) || this.hasForceDeletePermission)) {
			return false;
		}
		if (this.hasForceDeletePermission) {
			return true;
		}
		const blockDeleteInMinutes = this.props.Message_AllowDeleting_BlockDeleteInMinutes;
		if (blockDeleteInMinutes != null && blockDeleteInMinutes !== 0) {
			let msgTs;
			if (props.actionMessage.ts != null) {
				msgTs = moment(props.actionMessage.ts);
			}
			let currentTsDiff;
			if (msgTs != null) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockDeleteInMinutes;
		}
		return true;
	}

	handleDelete() {
		Alert.alert(
			I18n.t('Are_you_sure_question_mark'),
			I18n.t('You_will_not_be_able_to_recover_this_message'),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action: 'delete' }),
					style: 'destructive',
					onPress: () => this.props.deleteRequest(this.props.actionMessage)
				}
			],
			{ cancelable: false }
		);
	}

	handleEdit() {
		const { _id, msg, rid } = this.props.actionMessage;
		this.props.editInit({ _id, msg, rid });
	}

	handleCopy = async() => {
		await Clipboard.setString(this.props.actionMessage.msg);
		showToast(I18n.t('Copied_to_clipboard'));
	}

	handleShare = async() => {
		Share.share({
			message: this.props.actionMessage.msg.content.replace(/<(?:.|\n)*?>/gm, '')
		});
	};

	handleStar() {
		this.props.toggleStarRequest(this.props.actionMessage);
	}

	async handlePermalink() {
		const permalink = await this.getPermalink(this.props.actionMessage);
		Clipboard.setString(permalink);
		showToast(I18n.t('Permalink_copied_to_clipboard'));
	}

	handlePin() {
		this.props.togglePinRequest(this.props.actionMessage);
	}

	async handleReply() {
		const permalink = await this.getPermalink(this.props.actionMessage);
		let msg = `[ ](${ permalink }) `;

		// if original message wasn't sent by current user and neither from a direct room
		if (this.props.user.username !== this.props.actionMessage.u.username && this.props.room.t !== 'd') {
			msg += `@${ this.props.actionMessage.u.username } `;
		}
		this.props.setInput({ msg });
	}

	async handleQuote() {
		const permalink = await this.getPermalink(this.props.actionMessage);
		const msg = `[ ](${ permalink }) `;
		this.props.setInput({ msg });
	}

	handleReaction() {
		this.props.toggleReactionPicker(this.props.actionMessage);
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
			case this.SHARE_INDEX:
				this.handleShare();
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
			case this.REACTION_INDEX:
				this.handleReaction();
				break;
			case this.DELETE_INDEX:
				this.handleDelete();
				break;
			default:
				break;
		}
		this.props.actionsHide();
	}

	render() {
		return (
			<ActionSheet
				ref={o => this.ActionSheet = o}
				title={I18n.t('Message_actions')}
				testID='message-actions'
				options={this.options}
				cancelButtonIndex={this.CANCEL_INDEX}
				destructiveButtonIndex={this.DELETE_INDEX}
				onPress={this.handleActionPress}
			/>
		);
	}
}
