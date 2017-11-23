import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Clipboard } from 'react-native';
import { connect } from 'react-redux';
import ActionSheet from 'react-native-actionsheet';
import * as moment from 'moment';

import realm from '../lib/realm';
import {
	deleteRequest,
	editInit,
	starRequest,
	permalinkRequest,
	permalinkClear,
	togglePinRequest,
	setInput,
	actionsHide
} from '../actions/messages';

@connect(
	state => ({
		showActions: state.messages.showActions,
		actionMessage: state.messages.actionMessage,
		user: state.login.user,
		usersTyping: state.room.usersTyping,
		server: state.server.server,
		Site_Url: state.settings.Site_Url,
		Message_TimeFormat: state.settings.Message_TimeFormat,
		loading: state.messages.isFetching,
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
		starRequest: message => dispatch(starRequest(message)),
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
		rid: PropTypes.string,
		actionMessage: PropTypes.object,
		user: PropTypes.object,
		permissions: PropTypes.object.isRequired,
		deleteRequest: PropTypes.func.isRequired,
		editInit: PropTypes.func.isRequired,
		starRequest: PropTypes.func.isRequired,
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
		Message_AllowStarring: PropTypes.bool,
		hasEditPermission: PropTypes.bool,
		hasDeletePermission: PropTypes.bool,
		hasForceDeletePermission: PropTypes.bool
	};

	constructor(props) {
		super(props);
		this.state = {
			copyPermalink: false,
			reply: false,
			quote: false
		};
		this.handleActionPress = this.handleActionPress.bind(this);
		this.options = ['Cancel', 'Delete'];
		// permissions
		this.room = realm.objects('subscriptions').filtered('rid = $0', this.props.rid);
		const { roles } = this.room[0];
		const roomRoles = Array.from(Object.keys(roles), i => roles[i].value);
		const userRoles = this.props.user.roles || [];
		const mergedRoles = [...new Set([...roomRoles, ...userRoles])];
		this.hasEditPermission = this.props.permissions['edit-message']
			.some(item => mergedRoles.indexOf(item) !== -1);
		this.hasDeletePermission = this.props.permissions['delete-message']
			.some(item => mergedRoles.indexOf(item) !== -1);
		this.hasForceDeletePermission = this.props.permissions['force-delete-message']
			.some(item => mergedRoles.indexOf(item) !== -1);
	}

	async componentWillReceiveProps(nextProps) {
		if (nextProps.showActions !== this.props.showActions && nextProps.showActions) {
			// Cancel
			this.options = ['Cancel'];
			this.CANCEL_INDEX = 0;
			// Reply
			this.options.push('Reply');
			this.REPLY_INDEX = this.options.length - 1;
			// Edit
			// if (this.allowEdit()) {
			// 	this.options.push('Edit');
			// 	this.EDIT_INDEX = this.options.length - 1;
			// }
			// // Permalink
			// this.options.push('Copy Permalink');
			// this.PERMALINK_INDEX = this.options.length - 1;
			// // Copy
			// this.options.push('Copy Message');
			// this.COPY_INDEX = this.options.length - 1;
			// // Quote
			// this.options.push('Quote');
			// this.QUOTE_INDEX = this.options.length - 1;
			// // Star
			// if (this.props.Message_AllowStarring) {
			// 	this.options.push('Star');
			// 	this.STAR_INDEX = this.options.length - 1;
			// }
			// // Pin
			// if (this.props.Message_AllowPinning) {
			// 	this.options.push('Pin');
			// 	this.PIN_INDEX = this.options.length - 1;
			// }
			// // Delete
			// if (this.allowDelete()) {
			// 	this.options.push('Delete');
			// 	this.DELETE_INDEX = this.options.length - 1;
			// }
			setTimeout(() => {
				this.ActionSheet.show();
			});
		} else if (this.props.permalink !== nextProps.permalink && nextProps.permalink) {
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
				if (this.props.user.username !== this.props.actionMessage.u.username && this.room[0].t !== 'd') {
					msg += `@${ this.props.actionMessage.u.username } `;
				}
				this.props.setInput({ msg });
			}
		}
	}

	isOwn = () => this.props.actionMessage.u && this.props.actionMessage.u._id === this.props.user.id;

	allowEdit = () => {
		const editOwn = this.isOwn();
		const { Message_AllowEditing: isEditAllowed, hasEditPermission } = this.props;
		if (!(hasEditPermission || (isEditAllowed && editOwn))) {
			return false;
		}
		const blockEditInMinutes = this.props.Message_AllowEditing_BlockEditInMinutes;
		if (blockEditInMinutes) {
			let msgTs;
			if (this.props.actionMessage.ts != null) {
				msgTs = moment(this.props.actionMessage.ts);
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
			if (this.props.actionMessage.ts != null) {
				msgTs = moment(this.props.actionMessage.ts);
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
		Alert.alert('Copied to clipboard!');
	}

	handleStar() {
		this.props.starRequest(this.props.actionMessage);
	}

	handlePermalink() {
		this.setState({ copyPermalink: true });
		console.warn(this.props.actionMessage)
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
		// this.props.actionsHide();
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
