import React from 'react';
import PropTypes from 'prop-types';
import {
	Alert, Clipboard, Share, View, Text, StyleSheet, TouchableOpacity
} from 'react-native';
import { connect } from 'react-redux';
import * as moment from 'moment';

import BottomSheet from 'reanimated-bottom-sheet';

import {
	actionsHide as actionsHideAction,
	deleteRequest as deleteRequestAction,
	editInit as editInitAction,
	replyInit as replyInitAction,
	togglePinRequest as togglePinRequestAction,
	toggleReactionPicker as toggleReactionPickerAction,
	toggleStarRequest as toggleStarRequestAction
} from '../actions/messages';
import { showToast } from '../utils/info';
import { vibrate } from '../utils/vibration';
import { verticalScale } from '../utils/scaling';
import RocketChat from '../lib/rocketchat';
import I18n from '../i18n';

const styles = StyleSheet.create({
	panelContainer: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 0,
		right: 0
	},
	panel: {
		height: verticalScale(500),
		padding: verticalScale(10),
		backgroundColor: '#aaaaaa',
		paddingTop: verticalScale(20),
		borderTopLeftRadius: verticalScale(20),
		borderTopRightRadius: verticalScale(20),
		shadowColor: '#000000',
		shadowOffset: { width: 0, height: 0 },
		shadowRadius: 5,
		shadowOpacity: 0.4
	},
	panelButton: {
		padding: verticalScale(10),
		borderRadius: verticalScale(10),
		backgroundColor: '#656565',
		alignItems: 'center',
		marginVertical: verticalScale(5)
	},
	panelButtonTitle: {
		fontSize: verticalScale(14),
		fontWeight: 'bold',
		color: 'white'
	}
});

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
		this.hideActionSheet = this.hideActionSheet.bind(this);
		this.setPermissions();

		this.options = [
			{ label: I18n.t('Cancel'), handler: () => {} },
			{ label: I18n.t('Permalink'), handler: this.handlePermalink },
			{ label: I18n.t('Copy'), handler: this.handleCopy },
			{ label: I18n.t('Share'), handler: this.handleShare }
		];

		if (!this.isRoomReadOnly()) {
			this.options.push({ label: I18n.t('Reply'), handler: this.handleReply });
		}

		if (this.allowEdit(props)) {
			this.options.push({ label: I18n.t('Edit'), handler: this.handleEdit });
		}

		if (!this.isRoomReadOnly()) {
			this.options.push({ label: I18n.t('Quote'), handler: this.handleQuote });
		}

		const { Message_AllowStarring, Message_AllowPinning } = this.props;

		if (Message_AllowStarring) {
			this.options.push({ label: I18n.t(props.actionMessage.starred ? 'Unstar' : 'Star'), handler: this.handleStar });
		}

		if (Message_AllowPinning) {
			this.options.push({ label: I18n.t(props.actionMessage.pinned ? 'Unpin' : 'Pin'), handler: this.handlePin });
		}

		if (!this.isRoomReadOnly() || this.canReactWhenReadOnly()) {
			this.options.push({ label: I18n.t('Add_Reaction'), handler: this.handleReaction });
		}

		if (this.allowDelete(props)) {
			this.options.push({ label: I18n.t('Delete'), handler: this.handleDelete });
		}

		this.options.reverse(); // reversing to put the cancel to the bottom of the list

		setTimeout(() => {
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

	getPermalink = async(message) => {
		try {
			return await RocketChat.getPermalink(message);
		} catch (error) {
			return null;
		}
	};

	isOwn = props => props.actionMessage.u && props.actionMessage.u._id === props.user.id;

	isRoomReadOnly = () => {
		const { room } = this.props;
		return room.ro;
	};

	canReactWhenReadOnly = () => {
		const { room } = this.props;
		return room.reactWhenReadOnly;
	};

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
	};

	allowDelete = (props) => {
		if (this.isRoomReadOnly()) {
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
	};

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
	};

	handleEdit = () => {
		const { actionMessage, editInit } = this.props;
		const { _id, msg, rid } = actionMessage;
		editInit({ _id, msg, rid });
	};

	handleCopy = async() => {
		const { actionMessage } = this.props;
		await Clipboard.setString(actionMessage.msg);
		showToast(I18n.t('Copied_to_clipboard'));
	};

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
	};

	handlePermalink = async() => {
		const { actionMessage } = this.props;
		const permalink = await this.getPermalink(actionMessage);
		Clipboard.setString(permalink);
		showToast(I18n.t('Permalink_copied_to_clipboard'));
	};

	handlePin = () => {
		const { actionMessage, togglePinRequest } = this.props;
		togglePinRequest(actionMessage);
	};

	handleReply = () => {
		const { actionMessage, replyInit } = this.props;
		replyInit(actionMessage, true);
	};

	handleQuote = () => {
		const { actionMessage, replyInit } = this.props;
		replyInit(actionMessage, false);
	};

	handleReaction = () => {
		const { actionMessage, toggleReactionPicker } = this.props;
		toggleReactionPicker(actionMessage);
	};

	hideActionSheet() {
		const { actionsHide } = this.props;
		actionsHide();
	}

	renderInner = () => (
		<View style={[styles.panel, { height: this.options.length * verticalScale(50) }]}>
			{this.options.map((option, index) => (
				<TouchableOpacity style={styles.panelButton} onPress={() => { this.hideActionSheet(); option.handler(); }} key={option.label}>
					<Text style={[styles.panelButtonTitle, index === this.options.length - 1 ? { color: 'red' } : {}]}>{option.label}</Text>
				</TouchableOpacity>
			))}
		</View>
	);

	render() {
		return (
			<TouchableOpacity activeOpacity={1} style={styles.panelContainer} onPress={() => this.hideActionSheet()}>
				<BottomSheet
					snapPoints={[this.options.length * verticalScale(50), 0, 0]}
					renderContent={this.renderInner}
					enabledManualSnapping
					enabledGestureInteraction
					enabledInnerScrolling
				/>
			</TouchableOpacity>
		);
	}
}
