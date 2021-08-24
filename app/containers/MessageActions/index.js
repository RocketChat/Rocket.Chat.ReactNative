import React, { forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { Alert, Clipboard, Share } from 'react-native';
import { connect } from 'react-redux';
import moment from 'moment';

import RocketChat from '../../lib/rocketchat';
import database from '../../lib/database';
import I18n from '../../i18n';
import log, { logEvent } from '../../utils/log';
import Navigation from '../../lib/Navigation';
import { getMessageTranslation } from '../message/utils';
import { LISTENER } from '../Toast';
import EventEmitter from '../../utils/events';
import { showConfirmationAlert } from '../../utils/info';
import { useActionSheet } from '../ActionSheet';
import Header, { HEADER_HEIGHT } from './Header';
import events from '../../utils/log/events';

const MessageActions = React.memo(forwardRef(({
	room,
	tmid,
	user,
	editInit,
	reactionInit,
	onReactionPress,
	replyInit,
	isReadOnly,
	server,
	Message_AllowDeleting,
	Message_AllowDeleting_BlockDeleteInMinutes,
	Message_AllowEditing,
	Message_AllowEditing_BlockEditInMinutes,
	Message_AllowPinning,
	Message_AllowStarring,
	Message_Read_Receipt_Store_Users,
	isMasterDetail,
	editMessagePermission,
	deleteMessagePermission,
	forceDeleteMessagePermission,
	pinMessagePermission
}, ref) => {
	let permissions = {};
	const { showActionSheet, hideActionSheet } = useActionSheet();

	const getPermissions = async() => {
		try {
			const permission = [editMessagePermission, deleteMessagePermission, forceDeleteMessagePermission, pinMessagePermission];
			const result = await RocketChat.hasPermission(permission, room.rid);
			permissions = {
				hasEditPermission: result[0],
				hasDeletePermission: result[1],
				hasForceDeletePermission: result[2],
				hasPinPermission: result[3]
			};
		} catch {
			// Do nothing
		}
	};

	const isOwn = message => message.u && message.u._id === user.id;

	const allowEdit = (message) => {
		if (isReadOnly) {
			return false;
		}
		const editOwn = isOwn(message);

		if (!(permissions.hasEditPermission || (Message_AllowEditing && editOwn))) {
			return false;
		}
		const blockEditInMinutes = Message_AllowEditing_BlockEditInMinutes;
		if (blockEditInMinutes) {
			let msgTs;
			if (message.ts != null) {
				msgTs = moment(message.ts);
			}
			let currentTsDiff;
			if (msgTs != null) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockEditInMinutes;
		}
		return true;
	};

	const allowDelete = (message) => {
		if (isReadOnly) {
			return false;
		}

		// Prevent from deleting thread start message when positioned inside the thread
		if (tmid === message.id) {
			return false;
		}
		const deleteOwn = isOwn(message);
		if (!(permissions.hasDeletePermission || (Message_AllowDeleting && deleteOwn) || permissions.hasForceDeletePermission)) {
			return false;
		}
		if (permissions.hasForceDeletePermission) {
			return true;
		}
		const blockDeleteInMinutes = Message_AllowDeleting_BlockDeleteInMinutes;
		if (blockDeleteInMinutes != null && blockDeleteInMinutes !== 0) {
			let msgTs;
			if (message.ts != null) {
				msgTs = moment(message.ts);
			}
			let currentTsDiff;
			if (msgTs != null) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockDeleteInMinutes;
		}
		return true;
	};

	const getPermalink = message => RocketChat.getPermalinkMessage(message);

	const handleReply = (message) => {
		logEvent(events.ROOM_MSG_ACTION_REPLY);
		replyInit(message, true);
	};

	const handleEdit = (message) => {
		logEvent(events.ROOM_MSG_ACTION_EDIT);
		editInit(message);
	};

	const handleCreateDiscussion = (message) => {
		logEvent(events.ROOM_MSG_ACTION_DISCUSSION);
		const params = { message, channel: room, showCloseModal: true };
		if (isMasterDetail) {
			Navigation.navigate('ModalStackNavigator', { screen: 'CreateDiscussionView', params });
		} else {
			Navigation.navigate('NewMessageStackNavigator', { screen: 'CreateDiscussionView', params });
		}
	};

	const handleUnread = async(message) => {
		logEvent(events.ROOM_MSG_ACTION_UNREAD);
		const { id: messageId, ts } = message;
		const { rid } = room;
		try {
			const db = database.active;
			const result = await RocketChat.markAsUnread({ messageId });
			if (result.success) {
				const subCollection = db.get('subscriptions');
				const subRecord = await subCollection.find(rid);
				await db.action(async() => {
					try {
						await subRecord.update(sub => sub.lastOpen = ts);
					} catch {
						// do nothing
					}
				});
				Navigation.navigate('RoomsListView');
			}
		} catch (e) {
			logEvent(events.ROOM_MSG_ACTION_UNREAD_F);
			log(e);
		}
	};

	const handlePermalink = async(message) => {
		logEvent(events.ROOM_MSG_ACTION_PERMALINK);
		try {
			const permalink = await getPermalink(message);
			Clipboard.setString(permalink);
			EventEmitter.emit(LISTENER, { message: I18n.t('Permalink_copied_to_clipboard') });
		} catch {
			logEvent(events.ROOM_MSG_ACTION_PERMALINK_F);
		}
	};

	const handleCopy = async(message) => {
		logEvent(events.ROOM_MSG_ACTION_COPY);
		await Clipboard.setString(message?.attachments?.[0]?.description || message.msg);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	};

	const handleShare = async(message) => {
		logEvent(events.ROOM_MSG_ACTION_SHARE);
		try {
			const permalink = await getPermalink(message);
			Share.share({ message: permalink });
		} catch {
			logEvent(events.ROOM_MSG_ACTION_SHARE_F);
		}
	};

	const handleQuote = (message) => {
		logEvent(events.ROOM_MSG_ACTION_QUOTE);
		replyInit(message, false);
	};

	const handleStar = async(message) => {
		logEvent(message.starred ? events.ROOM_MSG_ACTION_UNSTAR : events.ROOM_MSG_ACTION_STAR);
		try {
			await RocketChat.toggleStarMessage(message.id, message.starred);
			EventEmitter.emit(LISTENER, { message: message.starred ? I18n.t('Message_unstarred') : I18n.t('Message_starred') });
		} catch (e) {
			logEvent(events.ROOM_MSG_ACTION_STAR_F);
			log(e);
		}
	};

	const handlePin = async(message) => {
		logEvent(events.ROOM_MSG_ACTION_PIN);
		try {
			await RocketChat.togglePinMessage(message.id, message.pinned);
		} catch (e) {
			logEvent(events.ROOM_MSG_ACTION_PIN_F);
			log(e);
		}
	};

	const handleReaction = (shortname, message) => {
		logEvent(events.ROOM_MSG_ACTION_REACTION);
		if (shortname) {
			onReactionPress(shortname, message.id);
		} else {
			reactionInit(message);
		}
		// close actionSheet when click at header
		hideActionSheet();
	};

	const handleReadReceipt = (message) => {
		if (isMasterDetail) {
			Navigation.navigate('ModalStackNavigator', { screen: 'ReadReceiptsView', params: { messageId: message.id } });
		} else {
			Navigation.navigate('ReadReceiptsView', { messageId: message.id });
		}
	};

	const handleToggleTranslation = async(message) => {
		try {
			const db = database.active;
			await db.action(async() => {
				await message.update((m) => {
					m.autoTranslate = !m.autoTranslate;
					m._updatedAt = new Date();
				});
			});
			const translatedMessage = getMessageTranslation(message, room.autoTranslateLanguage);
			if (!translatedMessage) {
				const m = {
					_id: message.id,
					rid: message.subscription.id,
					u: message.u,
					msg: message.msg
				};
				await RocketChat.translateMessage(m, room.autoTranslateLanguage);
			}
		} catch (e) {
			log(e);
		}
	};

	const handleReport = async(message) => {
		logEvent(events.ROOM_MSG_ACTION_REPORT);
		try {
			await RocketChat.reportMessage(message.id);
			Alert.alert(I18n.t('Message_Reported'));
		} catch (e) {
			logEvent(events.ROOM_MSG_ACTION_REPORT_F);
			log(e);
		}
	};

	const handleDelete = (message) => {
		showConfirmationAlert({
			message: I18n.t('You_will_not_be_able_to_recover_this_message'),
			confirmationText: I18n.t('Delete'),
			onPress: async() => {
				try {
					logEvent(events.ROOM_MSG_ACTION_DELETE);
					await RocketChat.deleteMessage(message.id, message.subscription.id);
				} catch (e) {
					logEvent(events.ROOM_MSG_ACTION_DELETE_F);
					log(e);
				}
			}
		});
	};

	const getOptions = (message) => {
		let options = [];

		// Reply
		if (!isReadOnly) {
			options = [{
				title: I18n.t('Reply_in_Thread'),
				icon: 'threads',
				onPress: () => handleReply(message)
			}];
		}

		// Quote
		if (!isReadOnly) {
			options.push({
				title: I18n.t('Quote'),
				icon: 'quote',
				onPress: () => handleQuote(message)
			});
		}

		// Edit
		if (allowEdit(message)) {
			options.push({
				title: I18n.t('Edit'),
				icon: 'edit',
				onPress: () => handleEdit(message)
			});
		}

		// Permalink
		options.push({
			title: I18n.t('Permalink'),
			icon: 'link',
			onPress: () => handlePermalink(message)
		});

		// Create Discussion
		options.push({
			title: I18n.t('Start_a_Discussion'),
			icon: 'discussions',
			onPress: () => handleCreateDiscussion(message)
		});

		// Mark as unread
		if (message.u && message.u._id !== user.id) {
			options.push({
				title: I18n.t('Mark_unread'),
				icon: 'flag',
				onPress: () => handleUnread(message)
			});
		}

		// Copy
		options.push({
			title: I18n.t('Copy'),
			icon: 'copy',
			onPress: () => handleCopy(message)
		});

		// Share
		options.push({
			title: I18n.t('Share'),
			icon: 'share',
			onPress: () => handleShare(message)
		});

		// Star
		if (Message_AllowStarring) {
			options.push({
				title: I18n.t(message.starred ? 'Unstar' : 'Star'),
				icon: message.starred ? 'star-filled' : 'star',
				onPress: () => handleStar(message)
			});
		}

		// Pin
		if (Message_AllowPinning && permissions?.hasPinPermission) {
			options.push({
				title: I18n.t(message.pinned ? 'Unpin' : 'Pin'),
				icon: 'pin',
				onPress: () => handlePin(message)
			});
		}

		// Read Receipts
		if (Message_Read_Receipt_Store_Users) {
			options.push({
				title: I18n.t('Read_Receipt'),
				icon: 'info',
				onPress: () => handleReadReceipt(message)
			});
		}

		// Toggle Auto-translate
		if (room.autoTranslate && message.u && message.u._id !== user.id) {
			options.push({
				title: I18n.t(message.autoTranslate ? 'View_Original' : 'Translate'),
				icon: 'language',
				onPress: () => handleToggleTranslation(message)
			});
		}

		// Report
		options.push({
			title: I18n.t('Report'),
			icon: 'warning',
			danger: true,
			onPress: () => handleReport(message)
		});

		// Delete
		if (allowDelete(message)) {
			options.push({
				title: I18n.t('Delete'),
				icon: 'delete',
				danger: true,
				onPress: () => handleDelete(message)
			});
		}

		return options;
	};

	const showMessageActions = async(message) => {
		logEvent(events.ROOM_SHOW_MSG_ACTIONS);
		await getPermissions();
		showActionSheet({
			options: getOptions(message),
			headerHeight: HEADER_HEIGHT,
			customHeader: (!isReadOnly || room.reactWhenReadOnly ? (
				<Header
					server={server}
					handleReaction={handleReaction}
					isMasterDetail={isMasterDetail}
					message={message}
				/>
			) : null)
		});
	};

	useImperativeHandle(ref, () => ({ showMessageActions }));
}));
MessageActions.propTypes = {
	room: PropTypes.object,
	tmid: PropTypes.string,
	user: PropTypes.object,
	editInit: PropTypes.func,
	reactionInit: PropTypes.func,
	onReactionPress: PropTypes.func,
	replyInit: PropTypes.func,
	isReadOnly: PropTypes.bool,
	Message_AllowDeleting: PropTypes.bool,
	Message_AllowDeleting_BlockDeleteInMinutes: PropTypes.number,
	Message_AllowEditing: PropTypes.bool,
	Message_AllowEditing_BlockEditInMinutes: PropTypes.number,
	Message_AllowPinning: PropTypes.bool,
	Message_AllowStarring: PropTypes.bool,
	Message_Read_Receipt_Store_Users: PropTypes.bool,
	server: PropTypes.string,
	editMessagePermission: PropTypes.array,
	deleteMessagePermission: PropTypes.array,
	forceDeleteMessagePermission: PropTypes.array,
	pinMessagePermission: PropTypes.array
};

const mapStateToProps = state => ({
	server: state.server.server,
	Message_AllowDeleting: state.settings.Message_AllowDeleting,
	Message_AllowDeleting_BlockDeleteInMinutes: state.settings.Message_AllowDeleting_BlockDeleteInMinutes,
	Message_AllowEditing: state.settings.Message_AllowEditing,
	Message_AllowEditing_BlockEditInMinutes: state.settings.Message_AllowEditing_BlockEditInMinutes,
	Message_AllowPinning: state.settings.Message_AllowPinning,
	Message_AllowStarring: state.settings.Message_AllowStarring,
	Message_Read_Receipt_Store_Users: state.settings.Message_Read_Receipt_Store_Users,
	isMasterDetail: state.app.isMasterDetail,
	editMessagePermission: state.permissions['edit-message'],
	deleteMessagePermission: state.permissions['delete-message'],
	forceDeleteMessagePermission: state.permissions['force-delete-message'],
	pinMessagePermission: state.permissions['pin-message']
});

export default connect(mapStateToProps, null, null, { forwardRef: true })(MessageActions);
