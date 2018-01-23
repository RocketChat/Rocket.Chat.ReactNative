import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Clipboard, Vibration } from 'react-native';
import { connect } from 'react-redux';
import ActionSheet from 'react-native-actionsheet';
import * as moment from 'moment';

import {
	deleteRequest,
	editInit,
	toggleStarRequest,
	permalinkRequest,
	permalinkClear,
	togglePinRequest,
	setInput,
	actionsHide
} from '../actions/messages';
import { showToast } from '../utils/info';

@connect(
	state => ({
		showActions: state.messages.showActions,
		actionMessage: state.messages.actionMessage,
		user: state.login.user,
		permissions: state.permissions,
		permalink: state.messages.permalink,
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
		permalinkRequest: message => dispatch(permalinkRequest(message)),
		permalinkClear: () => dispatch(permalinkClear()),
		togglePinRequest: message => dispatch(togglePinRequest(message)),
		setInput: message => dispatch(setInput(message))
	})
)
export default class MessageActions extends React.Component {
	static propTypes = {
		actionsHide: PropTypes.func.isRequired,
		showActions: PropTypes.bool.isRequired,
		room: PropTypes.object,
		actionMessage: PropTypes.object,
		user: PropTypes.object,
		permissions: PropTypes.object.isRequired,
		deleteRequest: PropTypes.func.isRequired,
		editInit: PropTypes.func.isRequired,
		toggleStarRequest: PropTypes.func.isRequired,
		permalinkRequest: PropTypes.func.isRequired,
		permalinkClear: PropTypes.func.isRequired,
		togglePinRequest: PropTypes.func.isRequired,
		setInput: PropTypes.func.isRequired,
		permalink: PropTypes.string,
		Message_AllowDeleting: PropTypes.bool,
		Message_AllowDeleting_BlockDeleteInMinutes: PropTypes.number,
		Message_AllowEditing: PropTypes.bool,
		Message_AllowEditing_BlockEditInMinutes: PropTypes.number,
		Message_AllowPinning: PropTypes.bool,
		Message_AllowStarring: PropTypes.bool
	};

	constructor(props) {
		super(props);
		this.state = {
			copyPermalink: false,
			reply: false,
			quote: false
		};
		this.handleActionPress = this.handleActionPress.bind(this);
		this.options = [''];
		const { roles } = this.props.room;
		const roomRoles = Array.from(Object.keys(roles), i => roles[i].value);
		const userRoles = this.props.user.roles || [];
		this.mergedRoles = [...new Set([...roomRoles, ...userRoles])];
		this.setPermissions(this.props.permissions);
	}

	async componentWillReceiveProps(nextProps) {
		if (nextProps.showActions !== this.props.showActions && nextProps.showActions) {
			const { actionMessage } = nextProps;
			// Cancel
			this.options = ['Cancel'];
			this.CANCEL_INDEX = 0;
			// Reply
			if (!this.isRoomReadOnly()) {
				this.options.push('Reply');
				this.REPLY_INDEX = this.options.length - 1;
			}
			// Edit
			if (this.allowEdit(nextProps)) {
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
			if (!this.isRoomReadOnly()) {
				this.options.push('Quote');
				this.QUOTE_INDEX = this.options.length - 1;
			}
			// Star
			if (this.props.Message_AllowStarring) {
				this.options.push(actionMessage.starred ? 'Unstar' : 'Star');
				this.STAR_INDEX = this.options.length - 1;
			}
			// Pin
			if (this.props.Message_AllowPinning) {
				this.options.push(actionMessage.pinned ? 'Unpin' : 'Pin');
				this.PIN_INDEX = this.options.length - 1;
			}
			// Delete
			if (this.allowDelete(nextProps)) {
				this.options.push('Delete');
				this.DELETE_INDEX = this.options.length - 1;
			}
			setTimeout(() => {
				this.ActionSheet.show();
				Vibration.vibrate(50);
			});
		} else if (this.props.permalink !== nextProps.permalink && nextProps.permalink) {
			// copy permalink
			if (this.state.copyPermalink) {
				this.setState({ copyPermalink: false });
				await Clipboard.setString(nextProps.permalink);
				showToast('Permalink copied to clipboard!');
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
				if (this.props.user.username !== this.props.actionMessage.u.username && this.props.room.t !== 'd') {
					msg += `@${ this.props.actionMessage.u.username } `;
				}
				this.props.setInput({ msg });
			}
		}
	}

	componentDidUpdate() {
		this.setPermissions(this.props.permissions);
	}

	setPermissions(permissions) {
		this.hasEditPermission = permissions['edit-message']
			.some(item => this.mergedRoles.indexOf(item) !== -1);
		this.hasDeletePermission = permissions['delete-message']
			.some(item => this.mergedRoles.indexOf(item) !== -1);
		this.hasForceDeletePermission = permissions['force-delete-message']
			.some(item => this.mergedRoles.indexOf(item) !== -1);
	}

	isOwn = props => props.actionMessage.u && props.actionMessage.u._id === props.user.id;

	isRoomReadOnly = () => this.props.room.ro;

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
		showToast('Copied to clipboard!');
	}

	handleStar() {
		this.props.toggleStarRequest(this.props.actionMessage);
	}

	handlePermalink() {
		this.setState({ copyPermalink: true });
		this.props.permalinkRequest(this.props.actionMessage);
	}

	handlePin() {
		this.props.togglePinRequest(this.props.actionMessage);
	}

	handleReply() {
		this.setState({ reply: true });
		this.props.permalinkRequest(this.props.actionMessage);
	}

	handleQuote() {
		this.setState({ quote: true });
		this.props.permalinkRequest(this.props.actionMessage);
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
		this.props.actionsHide();
	}

	render() {
		return (
			<ActionSheet
				ref={o => this.ActionSheet = o}
				title='Messages actions'
				options={this.options}
				cancelButtonIndex={this.CANCEL_INDEX}
				destructiveButtonIndex={this.DELETE_INDEX}
				onPress={this.handleActionPress}
			/>
		);
	}
}
