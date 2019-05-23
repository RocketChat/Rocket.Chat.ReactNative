import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Clipboard, Share } from 'react-native';
import { connect } from 'react-redux';
import ActionSheet from 'react-native-action-sheet';
import * as moment from 'moment';
import {
	actionsHide as actionsHideAction,
	deleteRequest as deleteRequestAction,
	editInit as editInitAction,
	replyInit as replyInitAction,
	togglePinRequest as togglePinRequestAction,
	toggleReactionPicker as toggleReactionPickerAction,
	toggleStarRequest as toggleStarRequestAction
} from '../actions/messages';
import { vibrate } from '../utils/vibration';
import RocketChat from '../lib/rocketchat';
import I18n from '../i18n';
import log from '../utils/log';

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
		actionsHide: () => dispatch(actionsHideAction()),
		deleteRequest: message => dispatch(deleteRequestAction(message)),
		editInit: message => dispatch(editInitAction(message)),
		toggleStarRequest: message => dispatch(toggleStarRequestAction(message)),
		togglePinRequest: message => dispatch(togglePinRequestAction(message)),
		toggleReactionPicker: message => dispatch(toggleReactionPickerAction(message)),
		replyInit: (message, mention) => dispatch(replyInitAction(message, mention))
	})
)
export default class MessageActions extends React.Component {
	static propTypes = {
		actionsHide: PropTypes.func.isRequired,
		room: PropTypes.object.isRequired,
		actionMessage: PropTypes.object,
		toast: PropTypes.element,
		// user: PropTypes.object.isRequired,
		deleteRequest: PropTypes.func.isRequired,
		editInit: PropTypes.func.isRequired,
		toggleStarRequest: PropTypes.func.isRequired,
		togglePinRequest: PropTypes.func.isRequired,
		toggleReactionPicker: PropTypes.func.isRequired,
		replyInit: PropTypes.func.isRequired,
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

		const { Message_AllowStarring, Message_AllowPinning } = this.props;

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
		this.options.push(I18n.t('Permalink'));
		this.PERMALINK_INDEX = this.options.length - 1;

		// Copy
		this.options.push(I18n.t('Copy'));
		this.COPY_INDEX = this.options.length - 1;

		// Share
		this.options.push(I18n.t('Share'));
		this.SHARE_INDEX = this.options.length - 1;

		// Quote
		if (!this.isRoomReadOnly()) {
			this.options.push(I18n.t('Quote'));
			this.QUOTE_INDEX = this.options.length - 1;
		}

		// Star
		if (Message_AllowStarring) {
			this.options.push(I18n.t(props.actionMessage.starred ? 'Unstar' : 'Star'));
			this.STAR_INDEX = this.options.length - 1;
		}

		// Pin
		if (Message_AllowPinning) {
			this.options.push(I18n.t(props.actionMessage.pinned ? 'Unpin' : 'Pin'));
			this.PIN_INDEX = this.options.length - 1;
		}

		// Reaction
		if (!this.isRoomReadOnly() || this.canReactWhenReadOnly()) {
			this.options.push(I18n.t('Add_Reaction'));
			this.REACTION_INDEX = this.options.length - 1;
		}

		// Report
		this.options.push(I18n.t('Report'));
		this.REPORT_INDEX = this.options.length - 1;

		// Delete
		if (this.allowDelete(props)) {
			this.options.push(I18n.t('Delete'));
			this.DELETE_INDEX = this.options.length - 1;
		}
		setTimeout(() => {
			this.showActionSheet();
			vibrate();
		});
	}

	setPermissions() {
		const { room } = this.props;
		const permissions = ['edit-message', 'delete-message', 'force-delete-message'];
		const result = RocketChat.hasPermission(permissions, room.rid);
		this.hasEditPermission = result[permissions[0]];
		this.hasDeletePermission = result[permissions[1]];
		this.hasForceDeletePermission = result[permissions[2]];
	}

	showActionSheet = () => {
		ActionSheet.showActionSheetWithOptions({
			options: this.options,
			cancelButtonIndex: this.CANCEL_INDEX,
			destructiveButtonIndex: this.DELETE_INDEX,
			title: I18n.t('Message_actions')
		}, (actionIndex) => {
			this.handleActionPress(actionIndex);
		});
	}

	getPermalink = async(message) => {
		try {
			return await RocketChat.getPermalink(message);
		} catch (error) {
			return null;
		}
	}

	isOwn = props => props.actionMessage.u && props.actionMessage.u._id === props.user.id;

	isRoomReadOnly = () => {
		const { room } = this.props;
		return room.ro;
	}

	canReactWhenReadOnly = () => {
		const { room } = this.props;
		return room.reactWhenReadOnly;
	}

	allowEdit = (props) => {
		if (this.isRoomReadOnly()) {
			return false;
		}
		const editOwn = this.isOwn(props);
		const { Message_AllowEditing: isEditAllowed, Message_AllowEditing_BlockEditInMinutes } = this.props;

		if (!(this.hasEditPermission || (isEditAllowed && editOwn))) {
			return false;
		}
		const blockEditInMinutes = Message_AllowEditing_BlockEditInMinutes;
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

		// Prevent from deleting thread start message when positioned inside the thread
		if (props.tmid && props.tmid === props.actionMessage._id) {
			return false;
		}
		const deleteOwn = this.isOwn(props);
		const { Message_AllowDeleting: isDeleteAllowed, Message_AllowDeleting_BlockDeleteInMinutes } = this.props;
		if (!(this.hasDeletePermission || (isDeleteAllowed && deleteOwn) || this.hasForceDeletePermission)) {
			return false;
		}
		if (this.hasForceDeletePermission) {
			return true;
		}
		const blockDeleteInMinutes = Message_AllowDeleting_BlockDeleteInMinutes;
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

	handleDelete = () => {
		const { deleteRequest, actionMessage } = this.props;
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
					onPress: () => deleteRequest(actionMessage)
				}
			],
			{ cancelable: false }
		);
	}

	handleEdit = () => {
		const { actionMessage, editInit } = this.props;
		const { _id, msg, rid } = actionMessage;
		editInit({ _id, msg, rid });
	}

	handleCopy = async() => {
		const { actionMessage, toast } = this.props;
		await Clipboard.setString(actionMessage.msg);
		toast.show(I18n.t('Copied_to_clipboard'));
	}

	handleShare = async() => {
		const { actionMessage } = this.props;
		const permalink = await this.getPermalink(actionMessage);
		Share.share({
			message: permalink
		});
	};

	handleStar = () => {
		const { actionMessage, toggleStarRequest } = this.props;
		toggleStarRequest(actionMessage);
	}

	handlePermalink = async() => {
		const { actionMessage, toast } = this.props;
		const permalink = await this.getPermalink(actionMessage);
		Clipboard.setString(permalink);
		toast.show(I18n.t('Permalink_copied_to_clipboard'));
	}

	handlePin = () => {
		const { actionMessage, togglePinRequest } = this.props;
		togglePinRequest(actionMessage);
	}

	handleReply = () => {
		const { actionMessage, replyInit } = this.props;
		replyInit(actionMessage, true);
	}

	handleQuote = () => {
		const { actionMessage, replyInit } = this.props;
		replyInit(actionMessage, false);
	}

	handleReaction = () => {
		const { actionMessage, toggleReactionPicker } = this.props;
		toggleReactionPicker(actionMessage);
	}

	handleReport = async() => {
		const { actionMessage } = this.props;
		try {
			await RocketChat.reportMessage(actionMessage._id);
			Alert.alert(I18n.t('Message_Reported'));
		} catch (err) {
			log('report message', err);
		}
	}

	handleActionPress = (actionIndex) => {
		if (actionIndex) {
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
				case this.REPORT_INDEX:
					this.handleReport();
					break;
				case this.DELETE_INDEX:
					this.handleDelete();
					break;
				default:
					break;
			}
		}
		const { actionsHide } = this.props;
		actionsHide();
	}

	render() {
		return (
			null
		);
	}
}
